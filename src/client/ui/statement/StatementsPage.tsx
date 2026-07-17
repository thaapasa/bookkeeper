import { Select, Stack, Text } from '@mantine/core';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';

import { ParsedStatement, parseStatement } from 'shared/statement';
import { ObjectId } from 'shared/types';
import { apiConnect } from 'client/data/ApiConnect';
import { notifyError } from 'client/data/NotificationStore';
import { QueryKeys } from 'client/data/queryKeys';
import { useValidSession } from 'client/data/SessionStore';
import { executeOperation } from 'client/util/ExecuteOperation';

import { PageTitle } from '../design/PageTitle';
import { Subtitle } from '../design/Text';
import { PageLayout } from '../layout/PageLayout';
import { StatementDropZone } from './StatementDropZone';
import { StatementRowsTable } from './StatementRowsTable';
import { autoSelectStatementSource, statementSourceOptions } from './statementSources';
import { StatementUploadPreview } from './StatementUploadPreview';

interface PendingUpload {
  filename: string;
  content: string;
  parsed: ParsedStatement;
}

export const StatementsPage: React.FC = () => {
  const session = useValidSession();
  const queryClient = useQueryClient();
  const [pending, setPending] = React.useState<PendingUpload | null>(null);
  const [importing, setImporting] = React.useState(false);

  const bankSources = session.sources.filter(s => s.statementFormat !== null);
  const [selectedSourceId, setSelectedSourceId] = React.useState<ObjectId | undefined>(
    bankSources[0]?.id,
  );

  const onFile = (filename: string, content: string) => {
    try {
      setPending({ filename, content, parsed: parseStatement(content) });
    } catch (e) {
      notifyError('Tiliotteen lukeminen epäonnistui', e);
    }
  };

  const onImport = async (sourceId: ObjectId) => {
    if (!pending) {
      return;
    }
    await executeOperation(
      () => apiConnect.uploadStatement(sourceId, pending.filename, pending.content),
      {
        success: r =>
          `Tuotu ${r.newCount} uutta tapahtumaa` +
          (r.duplicateCount > 0 ? ` (${r.duplicateCount} oli jo tuotu)` : ''),
        trackProgress: setImporting,
        postProcess: async () => {
          await queryClient.invalidateQueries({ queryKey: QueryKeys.statements.all });
          setSelectedSourceId(sourceId);
          setPending(null);
        },
      },
    );
  };

  return (
    <PageLayout>
      <Stack gap="md" w="100%">
        <PageTitle>Tiliotteet</PageTitle>
        {pending ? (
          <StatementUploadPreview
            filename={pending.filename}
            parsed={pending.parsed}
            sourceOptions={statementSourceOptions(session, pending.parsed.format)}
            initialSourceId={autoSelectStatementSource(session, pending.parsed.format)}
            onImport={onImport}
            onCancel={() => setPending(null)}
            importing={importing}
          />
        ) : (
          <StatementDropZone onFile={onFile} />
        )}
        <Subtitle>Tuodut tapahtumat</Subtitle>
        {bankSources.length > 0 ? (
          <>
            <Select
              label="Tili"
              data={bankSources.map(s => ({ value: `${s.id}`, label: s.name }))}
              value={selectedSourceId !== undefined ? `${selectedSourceId}` : null}
              onChange={v => setSelectedSourceId(v ? Number(v) : undefined)}
              maw={320}
            />
            {selectedSourceId !== undefined ? (
              <StatementRowsList sourceId={selectedSourceId} />
            ) : null}
          </>
        ) : (
          <Text fz="sm" c="dimmed">
            Yhdellekään lähteelle ei ole määritetty tiliotemuotoa. Määritä muoto Tiedot-sivulla,
            niin voit tuoda tiliotteita.
          </Text>
        )}
      </Stack>
    </PageLayout>
  );
};

const StatementRowsList: React.FC<{ sourceId: ObjectId }> = ({ sourceId }) => {
  const { data: rows } = useSuspenseQuery({
    queryKey: QueryKeys.statements.rows(sourceId),
    queryFn: () => apiConnect.getStatementRows(sourceId),
  });
  return rows.length > 0 ? (
    <StatementRowsTable rows={rows} />
  ) : (
    <Text fz="sm" c="dimmed">
      Ei tuotuja tapahtumia tälle tilille.
    </Text>
  );
};
