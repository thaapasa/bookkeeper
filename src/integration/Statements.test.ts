import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { findSourceId, logoutSession } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import {
  StatementRowsResponse,
  StatementUploadDeleteResult,
  StatementUploadListItem,
  StatementUploadResult,
} from 'shared/statement';
import {
  OP_ROWS,
  OPCREDIT_ROWS,
  opCreditCsv,
  opCsv,
  SPANKKI_ROWS,
  spankkiCsv,
} from 'shared/statement/test/StatementFixtures';
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
    const result = await session.get<StatementRowsResponse>('/api/statement/rows', {
      sourceId: `${sourceId}`,
    });
    expect(result.total).toEqual(5);
    expect(result.rows).toHaveLength(5);
    // Sorted by booking date, latest first
    expect(result.rows[0]).toMatchObject({
      sourceId,
      bookingDate: '2026-06-28',
      amount: '-400.00',
      type: 'TILISIIRTO',
      counterparty: 'Säästötili',
      archiveId: '20140101/STANDING/00001',
    });

    const filtered = await session.get<StatementRowsResponse>('/api/statement/rows', {
      sourceId: `${sourceId}`,
      startDate: '2026-05-03',
      endDate: '2026-05-15',
    });
    expect(filtered.total).toEqual(2);
    expect(filtered.rows.map(r => r.bookingDate)).toEqual(['2026-05-15', '2026-05-03']);
  });

  it('pages the row list', async () => {
    await upload('op.csv', opCsv(OP_ROWS));
    const page1 = await session.get<StatementRowsResponse>('/api/statement/rows', {
      sourceId: `${sourceId}`,
      limit: '2',
      offset: '0',
    });
    expect(page1.total).toEqual(5);
    expect(page1.rows).toHaveLength(2);
    const page3 = await session.get<StatementRowsResponse>('/api/statement/rows', {
      sourceId: `${sourceId}`,
      limit: '2',
      offset: '4',
    });
    expect(page3.total).toEqual(5);
    expect(page3.rows).toHaveLength(1);
    // total reflects the whole filter even when the page is past the end
    const past = await session.get<StatementRowsResponse>('/api/statement/rows', {
      sourceId: `${sourceId}`,
      limit: '2',
      offset: '10',
    });
    expect(past).toEqual({ rows: [], total: 5 });
  });

  it('lists upload batches with live row counts', async () => {
    const first = await upload('op.csv', opCsv(OP_ROWS));
    const second = await upload('op-again.csv', opCsv(OP_ROWS));
    const uploads = await session.get<StatementUploadListItem[]>('/api/statement/uploads', {
      sourceId: `${sourceId}`,
    });
    expect(uploads).toHaveLength(2);
    // Latest first; the re-upload owns no rows
    expect(uploads[0]).toMatchObject({
      id: second.uploadId,
      filename: 'op-again.csv',
      newCount: 0,
      duplicateCount: 5,
      currentRowCount: 0,
    });
    expect(uploads[1]).toMatchObject({
      id: first.uploadId,
      filename: 'op.csv',
      newCount: 5,
      currentRowCount: 5,
    });
  });

  it('deletes a batch and only the rows it owns', async () => {
    const first = await upload('op.csv', opCsv([OP_ROWS[0], OP_ROWS[1]]));
    // Overlapping upload: owns only the three rows the first one did not have
    const second = await upload('op-more.csv', opCsv(OP_ROWS));
    expect(second.newCount).toEqual(3);

    const del = await session.del<StatementUploadDeleteResult>(
      `/api/statement/upload/${second.uploadId}`,
    );
    expect(del).toEqual({ uploadId: second.uploadId, deletedRowCount: 3 });

    const rows = await session.get<StatementRowsResponse>('/api/statement/rows', {
      sourceId: `${sourceId}`,
    });
    expect(rows.total).toEqual(2);
    expect(rows.rows.every(r => r.uploadId === first.uploadId)).toEqual(true);

    const uploads = await session.get<StatementUploadListItem[]>('/api/statement/uploads', {
      sourceId: `${sourceId}`,
    });
    expect(uploads.map(u => u.id)).toEqual([first.uploadId]);

    // Deleted rows can be re-imported
    const again = await upload('op-again.csv', opCsv(OP_ROWS));
    expect(again.newCount).toEqual(3);
  });

  it('rejects deleting an unknown batch', async () => {
    await expect(session.del(`/api/statement/upload/999999`)).rejects.toMatchObject({
      code: 'STATEMENT_UPLOAD_NOT_FOUND',
    });
  });

  it('rejects uploads whose format does not match the source', async () => {
    await expect(upload('spankki.csv', spankkiCsv(SPANKKI_ROWS))).rejects.toMatchObject({
      code: 'STATEMENT_FORMAT_MISMATCH',
    });
  });

  it('imports credit card files into a bank statement source', async () => {
    const result = await upload('opcredit.csv', opCreditCsv(OPCREDIT_ROWS));
    expect(result).toMatchObject({ format: 'op-credit', rowCount: 3, newCount: 3 });

    // Bank and credit rows coexist; credit-ness is derived from the upload format
    await upload('op.csv', opCsv(OP_ROWS));
    const rows = await session.get<StatementRowsResponse>('/api/statement/rows', {
      sourceId: `${sourceId}`,
    });
    expect(rows.total).toEqual(8);
    const byArchiveId = (id: string) => rows.rows.find(r => r.archiveId === id);
    expect(byArchiveId('74463656189601898056439')).toMatchObject({
      credit: true,
      purchaseDate: '2026-05-20',
      valueDate: '2026-06-09',
      amount: '-342.25',
      type: 'KORTTIOSTO',
    });
    expect(byArchiveId('20260502/ABC123/000001')).toMatchObject({ credit: false });
  });

  it('rejects credit card files when the source format is not op', async () => {
    await session.patch(`/api/source/${sourceId}`, { statementFormat: 'spankki' });
    await expect(upload('opcredit.csv', opCreditCsv(OPCREDIT_ROWS))).rejects.toMatchObject({
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
