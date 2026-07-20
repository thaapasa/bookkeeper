import { DateTime } from 'luxon';

import { ISODate } from '../time/Time';
import { InvalidInputError } from '../types/Errors';
import { Money } from '../util/Money';
import { StatementFileFormat, StatementRowData } from './Statement';

/**
 * Parsers for bank statement CSV exports (see docs/BANK_STATEMENTS.md).
 * Shared between client (format sniffing, upload preview) and server
 * (authoritative parse on upload).
 */

export interface ParsedStatement {
  format: StatementFileFormat;
  rows: StatementRowData[];
}

interface FormatSpec {
  format: StatementFileFormat;
  /** Leading header fields that identify the format. */
  header: string[];
  columnCount: number;
  parseRow: (fields: string[], rawLine: string) => StatementRowData;
}

const FORMATS: FormatSpec[] = [
  {
    format: 'op',
    header: ['Kirjauspäivä', 'Arvopäivä', 'Määrä EUROA'],
    columnCount: 11,
    parseRow: parseOpRow,
  },
  {
    format: 'op-credit',
    header: ['Kirjauspäivä', 'Arvopäivä', 'Määrä', 'Kurssi'],
    columnCount: 8,
    parseRow: parseOpCreditRow,
  },
  {
    format: 'spankki',
    header: ['Kirjauspäivä', 'Maksupäivä', 'Summa'],
    columnCount: 11,
    parseRow: parseSpankkiRow,
  },
];

/**
 * Detects the statement format from the CSV header row, or returns
 * undefined if the header matches no known format.
 */
export function sniffStatementFormat(content: string): StatementFileFormat | undefined {
  return sniffFormatSpec(content)?.format;
}

function sniffFormatSpec(content: string): FormatSpec | undefined {
  const [header] = splitLines(content);
  if (!header) {
    return undefined;
  }
  const fields = splitCsvLine(header);
  return FORMATS.find(f => startsWithFields(fields, f.header));
}

/**
 * Parses statement CSV content, detecting the format from the header row.
 * Throws InvalidInputError if the format is unknown or a row is malformed.
 */
export function parseStatement(content: string): ParsedStatement {
  const spec = sniffFormatSpec(content);
  if (!spec) {
    throw new InvalidInputError(
      'UNKNOWN_STATEMENT_FORMAT',
      'Statement CSV header does not match any supported bank format',
    );
  }
  return { format: spec.format, rows: parseRows(content, spec) };
}

function parseRows(content: string, spec: FormatSpec): StatementRowData[] {
  const [, ...lines] = splitLines(content);
  return lines.map((line, i) => {
    const fields = splitCsvLine(line);
    if (fields.length !== spec.columnCount) {
      throw new InvalidInputError(
        'INVALID_STATEMENT_ROW',
        `Statement row ${i + 2} has ${fields.length} fields, expected ${spec.columnCount}`,
      );
    }
    try {
      return spec.parseRow(fields, line);
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw e;
      }
      throw new InvalidInputError('INVALID_STATEMENT_ROW', `Cannot parse statement row ${i + 2}`);
    }
  });
}

/**
 * OP columns: Kirjauspäivä, Arvopäivä, Määrä EUROA, Laji, Selitys,
 * Saaja/Maksaja, Saajan tilinumero, Saajan pankin BIC, Viite, Viesti,
 * Arkistointitunnus. Dates are already ISO; text fields are quoted.
 */
function parseOpRow(fields: string[], rawLine: string): StatementRowData {
  const [bookingDate, valueDate, amount, , type, counterparty, account, , reference, message] =
    fields;
  return {
    bookingDate: parseIsoDate(bookingDate),
    valueDate: parseIsoDate(valueDate),
    // For OP card payments both bank dates are the booking date; the actual
    // purchase date is only in the message ("OSTOPVM 260101...").
    purchaseDate: parsePurchaseDate(message),
    amount: parseAmount(amount),
    type,
    counterparty: emptyToNull(counterparty),
    counterpartyAccount: emptyToNull(normalizeIban(account)),
    // OP prefixes the reference with "ref=" and the message with "Viesti: "
    reference: emptyToNull(stripPrefix(reference, 'ref=')),
    message: emptyToNull(stripPrefix(message, 'Viesti: ')),
    archiveId: emptyToNull(fields[10]),
    rawLine,
  };
}

const PurchaseDateRE = /OSTOPVM (\d{2})(\d{2})(\d{2})/;

/** Extracts the "OSTOPVM YYMMDD" purchase date from an OP message, if any. */
function parsePurchaseDate(message: string): ISODate | null {
  const match = PurchaseDateRE.exec(message);
  if (!match) {
    return null;
  }
  const date = `20${match[1]}-${match[2]}-${match[3]}`;
  return DateTime.fromISO(date).isValid ? (date as ISODate) : null;
}

/**
 * OP credit card export columns: Kirjauspäivä, Arvopäivä, Määrä, Kurssi,
 * Selite, Maksaja, Saaja, Arkistointitunnus. Dates are ISO; amounts use a
 * dot decimal separator with 1–2 decimals. Kirjauspäivä is the actual
 * purchase date and Arvopäivä the later billing date. There is no Laji,
 * account, reference, message, or card number. Selite is the merchant name
 * (duplicating Saaja) for purchases, and a type-like text ("Suoritus") for
 * incoming bill payments, whose Maksaja/Saaja are empty.
 */
function parseOpCreditRow(fields: string[], rawLine: string): StatementRowData {
  const [bookingDate, valueDate, amount, , description, , receiver] = fields;
  const counterparty = emptyToNull(receiver);
  return {
    bookingDate: parseIsoDate(bookingDate),
    valueDate: parseIsoDate(valueDate),
    purchaseDate: parseIsoDate(bookingDate),
    amount: parseDotAmount(amount),
    type: counterparty ? 'KORTTIOSTO' : (emptyToNull(description) ?? 'LUOTTOKORTTI'),
    counterparty,
    counterpartyAccount: null,
    reference: null,
    message: null,
    archiveId: emptyToNull(fields[7]),
    rawLine,
  };
}

/**
 * S-pankki columns: Kirjauspäivä, Maksupäivä, Summa, Tapahtumalaji, Maksaja,
 * Saajan nimi, Saajan tilinumero, Saajan BIC-tunnus, Viitenumero, Viesti,
 * Arkistointitunnus. Dates are Finnish (dd.mm.yyyy), empty fields are "-",
 * the message is wrapped in single quotes, and incoming amounts carry a "+".
 */
function parseSpankkiRow(fields: string[], rawLine: string): StatementRowData {
  const [bookingDate, valueDate, rawAmount, type, payer, receiver, account, , reference, message] =
    fields;
  const amount = parseAmount(rawAmount);
  const outgoing = amount.startsWith('-');
  return {
    bookingDate: parseFinnishDate(bookingDate),
    // S-pankki's Maksupäivä is already the purchase date, so no separate
    // purchase date is needed.
    valueDate: parseFinnishDate(valueDate),
    purchaseDate: null,
    amount,
    type,
    // The counterparty depends on direction: for outgoing payments it is the
    // receiver; for incoming ones the payer. The other side is the account
    // owner. Same for the account: on incoming rows "Saajan tilinumero" is
    // the account's own IBAN, which is not counterparty data.
    counterparty: dashToNull(outgoing ? receiver : payer),
    counterpartyAccount: outgoing ? dashToNull(normalizeIban(account)) : null,
    reference: dashToNull(reference),
    message: dashToNull(stripSingleQuotes(message)),
    archiveId: dashToNull(fields[10]),
    rawLine,
  };
}

function splitLines(content: string): string[] {
  return stripBom(content)
    .split(/\r?\n/)
    .filter(line => line.trim() !== '');
}

const BOM = '\uFEFF';

function stripBom(content: string): string {
  return content.startsWith(BOM) ? content.substring(1) : content;
}

/** Splits a `;`-separated CSV line, honoring double-quoted fields. */
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += c;
      }
    } else if (c === '"' && current === '') {
      inQuotes = true;
    } else if (c === ';') {
      fields.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  fields.push(current);
  return fields;
}

function startsWithFields(fields: string[], expected: string[]): boolean {
  return expected.every((f, i) => fields[i] === f);
}

const AmountRE = /^[+-]?\d+,\d{2}$/;

function parseAmount(value: string): string {
  if (!AmountRE.test(value)) {
    throw new InvalidInputError('INVALID_STATEMENT_ROW', `Invalid statement amount: ${value}`);
  }
  return Money.from(value.replace('+', '').replace(',', '.')).toString();
}

const DotAmountRE = /^[+-]?\d+(\.\d{1,2})?$/;

/** OP credit exports use dot decimals with 1–2 decimals (e.g. "211.1"). */
function parseDotAmount(value: string): string {
  if (!DotAmountRE.test(value)) {
    throw new InvalidInputError('INVALID_STATEMENT_ROW', `Invalid statement amount: ${value}`);
  }
  return Money.from(value.replace('+', '')).toString(2);
}

function parseIsoDate(value: string): ISODate {
  const date = ISODate.safeParse(value);
  if (!date.success || !DateTime.fromISO(value).isValid) {
    throw new InvalidInputError('INVALID_STATEMENT_ROW', `Invalid statement date: ${value}`);
  }
  return date.data;
}

const FinnishDateRE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

function parseFinnishDate(value: string): ISODate {
  const match = FinnishDateRE.exec(value);
  if (!match) {
    throw new InvalidInputError('INVALID_STATEMENT_ROW', `Invalid statement date: ${value}`);
  }
  return parseIsoDate(`${match[3]}-${match[2]}-${match[1]}`);
}

function stripPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.substring(prefix.length) : value;
}

function stripSingleQuotes(value: string): string {
  return value.startsWith("'") && value.endsWith("'") && value.length >= 2
    ? value.substring(1, value.length - 1)
    : value;
}

/** IBANs in exports may contain grouping spaces and stray whitespace. */
function normalizeIban(value: string): string {
  return value.replace(/ /g, '').trim();
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function dashToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === '-' ? null : trimmed;
}
