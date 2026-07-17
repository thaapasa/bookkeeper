import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { findSourceId, logoutSession } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { StatementRow, StatementUploadResult } from 'shared/statement';
import { OP_ROWS, opCsv, SPANKKI_ROWS, spankkiCsv } from 'shared/statement/test/StatementFixtures';
import { Source } from 'shared/types';
import { logger } from 'server/Logger';

import { captureTestState, cleanupTestDataSince, TestState } from './TestCleanup';

describe('statement import', () => {
  let session: SessionWithControl;
  let state: TestState;
  let sourceId: number;
  const client = createTestClient({ logger });

  const upload = (filename: string, content: string, source = sourceId) =>
    session.post<StatementUploadResult>(`/api/statement/upload/${source}`, {
      filename,
      content,
    });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
    state = await captureTestState();
    sourceId = findSourceId('Yhteinen tili', session);
    await session.patch(`/api/source/${sourceId}`, { statementFormat: 'op' });
  });

  afterEach(async () => {
    // statement_format is set on a seed source row, so restore it explicitly
    // (TestCleanup only reverses INSERTs).
    await session.patch(`/api/source/${sourceId}`, { statementFormat: null });
    await cleanupTestDataSince(session.group.id, state);
    await logoutSession(session);
  });

  it('imports statement rows and reports counts', async () => {
    const result = await upload('op.csv', opCsv(OP_ROWS));
    expect(result).toMatchObject({
      format: 'op',
      rowCount: 5,
      newCount: 5,
      duplicateCount: 0,
    });
    expect(result.uploadId).toBeGreaterThan(0);
  });

  it('skips already imported rows on re-upload', async () => {
    await upload('op.csv', opCsv(OP_ROWS));
    const again = await upload('op-again.csv', opCsv(OP_ROWS));
    expect(again).toMatchObject({ rowCount: 5, newCount: 0, duplicateCount: 5 });

    const overlapping = [
      ...OP_ROWS.slice(2),
      `"2026-07-01";"2026-07-01";-9,99;"162";"PKORTTIMAKSU";"UUSI KAUPPA";"";"";"ref=";"";"20260701/ABC123/000099"`,
    ];
    const overlap = await upload('op-overlap.csv', opCsv(overlapping));
    expect(overlap).toMatchObject({ rowCount: 4, newCount: 1, duplicateCount: 3 });
  });

  it('collapses identical rows within one file', async () => {
    const result = await upload('op-dup.csv', opCsv([OP_ROWS[0], OP_ROWS[0]]));
    expect(result).toMatchObject({ rowCount: 2, newCount: 1, duplicateCount: 1 });
  });

  it('lists imported rows with date filtering', async () => {
    await upload('op.csv', opCsv(OP_ROWS));
    const rows = await session.get<StatementRow[]>('/api/statement/rows', {
      sourceId: `${sourceId}`,
    });
    expect(rows).toHaveLength(5);
    // Sorted by booking date, latest first
    expect(rows[0]).toMatchObject({
      sourceId,
      bookingDate: '2026-06-28',
      amount: '-400.00',
      type: 'TILISIIRTO',
      counterparty: 'Säästötili',
      archiveId: '20140101/STANDING/00001',
    });

    const filtered = await session.get<StatementRow[]>('/api/statement/rows', {
      sourceId: `${sourceId}`,
      startDate: '2026-05-03',
      endDate: '2026-05-15',
    });
    expect(filtered.map(r => r.bookingDate)).toEqual(['2026-05-15', '2026-05-03']);
  });

  it('rejects uploads whose format does not match the source', async () => {
    await expect(upload('spankki.csv', spankkiCsv(SPANKKI_ROWS))).rejects.toMatchObject({
      code: 'STATEMENT_FORMAT_MISMATCH',
    });
  });

  it('rejects uploads to a source with no statement format', async () => {
    await session.patch(`/api/source/${sourceId}`, { statementFormat: null });
    await expect(upload('op.csv', opCsv(OP_ROWS))).rejects.toMatchObject({
      code: 'SOURCE_HAS_NO_STATEMENT_FORMAT',
    });
  });

  it('rejects unparseable files', async () => {
    await expect(upload('random.csv', 'id,name\n1,foo\n')).rejects.toMatchObject({
      code: 'UNKNOWN_STATEMENT_FORMAT',
    });
  });

  it('exposes the statement format on sources', async () => {
    const source = await session.get<Source>(`/api/source/${sourceId}`);
    expect(source.statementFormat).toEqual('op');
    expect(source.name).toEqual('Yhteinen tili');
  });
});
