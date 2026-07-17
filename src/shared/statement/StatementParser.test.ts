import { describe, expect, it } from 'bun:test';

import { parseStatement, sniffStatementFormat, splitCsvLine } from './StatementParser';
import { OP_ROWS, opCsv, SPANKKI_ROWS, spankkiCsv } from './test/StatementFixtures';

describe('sniffStatementFormat', () => {
  it('detects OP format from the header', () => {
    expect(sniffStatementFormat(opCsv(OP_ROWS))).toEqual('op');
  });

  it('detects S-pankki format from the header', () => {
    expect(sniffStatementFormat(spankkiCsv(SPANKKI_ROWS))).toEqual('spankki');
  });

  it('returns undefined for unknown content', () => {
    expect(sniffStatementFormat('id,name\n1,foo\n')).toBeUndefined();
    expect(sniffStatementFormat('')).toBeUndefined();
    expect(sniffStatementFormat('some random text')).toBeUndefined();
  });
});

describe('parseStatement (OP)', () => {
  it('parses all rows', () => {
    const result = parseStatement(opCsv(OP_ROWS));
    expect(result.format).toEqual('op');
    expect(result.rows).toHaveLength(5);
  });

  it('normalizes a card payment row', () => {
    const [row] = parseStatement(opCsv(OP_ROWS)).rows;
    expect(row).toEqual({
      bookingDate: '2026-05-02',
      valueDate: '2026-05-02',
      // Real purchase date parsed from "OSTOPVM 260501" in the message
      purchaseDate: '2026-05-01',
      amount: '-12.90',
      type: 'PKORTTIMAKSU',
      counterparty: 'MEGASTORE HELSINKI',
      counterpartyAccount: null,
      reference: null,
      message: '512345******9876 OSTOPVM 260501',
      archiveId: '20260502/ABC123/000001',
      rawLine: OP_ROWS[0],
    });
  });

  it('strips the ref= prefix from references', () => {
    const row = parseStatement(opCsv(OP_ROWS)).rows[1];
    expect(row.reference).toEqual('1122334455');
    expect(row.counterpartyAccount).toEqual('FI2112345600000785');
    expect(row.message).toBeNull();
    // No OSTOPVM in a transfer message
    expect(row.purchaseDate).toBeNull();
  });

  it('parses the purchase date from messages with trailing card suffixes', () => {
    const row = `"2026-01-02";"2026-01-02";-15,99;"162";"PKORTTIMAKSU";"WEBSHOP";"";"";"ref=";"Viesti: 401046******1226 OSTOPVM 260101MF NRO 742 VARMENTAJA 050";"20260102/X/1"`;
    const { rows } = parseStatement(opCsv([row]));
    expect(rows[0].purchaseDate).toEqual('2026-01-01');
  });

  it('parses incoming amounts as positive', () => {
    const row = parseStatement(opCsv(OP_ROWS)).rows[2];
    expect(row.amount).toEqual('2500.00');
    expect(row.type).toEqual('PALKKA');
    // "Viesti: " is only stripped as a prefix, not mid-message
    expect(row.message).toEqual('SEPA-MAKSU Viesti: Palkka kaudelta 5/2026');
  });

  it('keeps recurring standing-order rows with the same archive id', () => {
    const { rows } = parseStatement(opCsv(OP_ROWS));
    expect(rows[3].archiveId).toEqual(rows[4].archiveId);
    expect(rows[3].bookingDate).not.toEqual(rows[4].bookingDate);
  });

  it('preserves quoted semicolons in fields', () => {
    const row = `"2026-05-02";"2026-05-02";-1,00;"162";"PKORTTIMAKSU";"KAUPPA; TOINEN";"";"";"ref=";"";"20260502/X/1"`;
    const { rows } = parseStatement(opCsv([row]));
    expect(rows[0].counterparty).toEqual('KAUPPA; TOINEN');
  });
});

describe('parseStatement (S-pankki)', () => {
  it('parses all rows', () => {
    const result = parseStatement(spankkiCsv(SPANKKI_ROWS));
    expect(result.format).toEqual('spankki');
    expect(result.rows).toHaveLength(4);
  });

  it('normalizes a card purchase row', () => {
    const [row] = parseStatement(spankkiCsv(SPANKKI_ROWS)).rows;
    expect(row).toEqual({
      bookingDate: '2026-05-13',
      valueDate: '2026-05-11',
      purchaseDate: null,
      amount: '-25.50',
      type: 'KORTTIOSTO',
      counterparty: 'KAUPPA HELSINKI',
      counterpartyAccount: null,
      reference: null,
      message: '512345******1234 260511000001',
      archiveId: '20260513390000000001',
      rawLine: SPANKKI_ROWS[0],
    });
  });

  it('normalizes the counterparty IBAN on outgoing transfers', () => {
    const row = parseStatement(spankkiCsv(SPANKKI_ROWS)).rows[1];
    expect(row.counterparty).toEqual('Testi Saaja');
    expect(row.counterpartyAccount).toEqual('FI2112345600000785');
    expect(row.message).toEqual('Vuokra');
  });

  it('uses the payer as counterparty on incoming rows', () => {
    const { rows } = parseStatement(spankkiCsv(SPANKKI_ROWS));
    expect(rows[2].amount).toEqual('5.25');
    expect(rows[2].counterparty).toEqual('OSUUSKAUPPA');
    // The receiving account is the statement's own account, not counterparty data
    expect(rows[2].counterpartyAccount).toBeNull();
    expect(rows[2].message).toBeNull();
    expect(rows[3].counterparty).toEqual('MAIJA MEIKÄLÄINEN');
    expect(rows[3].message).toEqual('Käyttörahaa');
  });
});

describe('parseStatement (errors)', () => {
  it('rejects unknown formats', () => {
    expect(() => parseStatement('id,name\n1,foo\n')).toThrow('does not match any supported');
  });

  it('rejects rows with wrong field count', () => {
    expect(() => parseStatement(opCsv([`"2026-05-02";"2026-05-02";-1,00`]))).toThrow(
      'has 3 fields, expected 11',
    );
  });

  it('rejects malformed amounts', () => {
    const row = `"2026-05-02";"2026-05-02";oops;"162";"X";"";"";"";"ref=";"";"20260502/X/1"`;
    expect(() => parseStatement(opCsv([row]))).toThrow('Invalid statement amount');
  });

  it('rejects malformed dates', () => {
    const row = `32.13.2026;11.05.2026;-1,00;KORTTIOSTO;A;B;-;-;-;'-';123`;
    expect(() => parseStatement(spankkiCsv([row]))).toThrow('Invalid statement date');
  });
});

describe('splitCsvLine', () => {
  it('splits unquoted fields', () => {
    expect(splitCsvLine('a;b;;c')).toEqual(['a', 'b', '', 'c']);
  });

  it('honors quotes and escaped quotes', () => {
    expect(splitCsvLine('"a;b";"c ""d"" e";f')).toEqual(['a;b', 'c "d" e', 'f']);
  });
});
