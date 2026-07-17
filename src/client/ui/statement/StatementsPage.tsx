import { Group, Pagination, Select, Stack, Tabs, Text } from '@mantine/core';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import React from 'react';
import { useParams } from 'react-router-dom';

import { ParsedStatement, parseStatement } from 'shared/statement';
import { ISOMonth, ISOMonthRegExp, monthRange } from 'shared/time';
import { ObjectId } from 'shared/types';
import { apiConnect } from 'client/data/ApiConnect';
import { useNavigationStore } from 'client/data/NavigationStore';
import { notifyError } from 'client/data/NotificationStore';
import { QueryKeys } from 'client/data/queryKeys';
import { useValidSession } from 'client/data/SessionStore';
import { executeOperation } from 'client/util/ExecuteOperation';
import { statementsPagePath } from 'client/util/Links';

import { PageTitle } from '../design/PageTitle';
import { Subtitle } from '../design/Text';
import { PageLayout } from '../layout/PageLayout';
import { StatementDropZone } from './StatementDropZone';
import { StatementMatchingView } from './StatementMatchingView';
import { StatementRowsTable } from './StatementRowsTable';
import { autoSelectStatementSource, statementSourceOptions } from './statementSources';
import { StatementUploadPreview } from './StatementUploadPreview';
import { StatementUploadsList } from './StatementUploadsList';

interface PendingUpload {
  filename: string;
  content: string;
  parsed: ParsedStatement;
}

// Validate URL param as ISOMonth; fall back to current month on invalid input
function parseMonth(month?: string): ISOMonth {
  if (month && ISOMonthRegExp.test(month)) {
    return month as ISOMonth;
  }
  return DateTime.now().toFormat('yyyy-MM') as ISOMonth;
}

export const StatementsPage: React.FC = () => {
  const session = useValidSession();
  const queryClient = useQueryClient();
  const [pending, setPending] = React.useState<PendingUpload | null>(null);
  const [importing, setImporting] = React.useState(false);
  const { month: monthParam } = useParams<'month'>();
  const month = parseMonth(monthParam);

  // Bind the top bar date navigator to this page (month mode)
  React.useEffect(() => {
    useNavigationStore.getState().setNavigation({
      pathPrefix: statementsPagePath,
      dateRange: monthRange(`${month}-01`),
    });
  }, [month]);

  const bankSources = session.sources.filter(s => s.statementFormat !== null);
  // Default to the user's own account: the first bank source they are mapped to
  const [selectedSourceId, setSelectedSourceId] = React.useState<ObjectId | undefined>(
    () =>
      (bankSources.find(s => s.users.some(u => u.userId === session.user.id)) ?? bankSources[0])
        ?.id,
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
        <Subtitle>Tuodut tiliotteet</Subtitle>
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
              <Tabs defaultValue="rows" keepMounted={false}>
                <Tabs.List>
                  <Tabs.Tab value="rows">Tapahtumat</Tabs.Tab>
                  <Tabs.Tab value="uploads">Tuonnit</Tabs.Tab>
                  <Tabs.Tab value="matching">Täsmäytys</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="rows" pt="md">
                  <StatementRowsList key={selectedSourceId} sourceId={selectedSourceId} />
                </Tabs.Panel>
                <Tabs.Panel value="uploads" pt="md">
                  <StatementUploadsList sourceId={selectedSourceId} />
                </Tabs.Panel>
                <Tabs.Panel value="matching" pt="md">
                  <StatementMatchingView sourceId={selectedSourceId} month={month} />
                </Tabs.Panel>
              </Tabs>
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

const ROWS_PAGE_SIZE = 50;

const StatementRowsList: React.FC<{ sourceId: ObjectId }> = ({ sourceId }) => {
  const [page, setPage] = React.useState(1);
  const { data } = useSuspenseQuery({
    queryKey: QueryKeys.statements.rows(sourceId, page),
    queryFn: () =>
      apiConnect.getStatementRows(sourceId, {
        limit: ROWS_PAGE_SIZE,
        offset: (page - 1) * ROWS_PAGE_SIZE,
      }),
  });
  const pageCount = Math.ceil(data.total / ROWS_PAGE_SIZE);
  if (data.total < 1) {
    return (
      <Text fz="sm" c="dimmed">
        Ei tuotuja tapahtumia tälle tilille.
      </Text>
    );
  }
  return (
    <Stack gap="sm">
      <StatementRowsTable rows={data.rows} />
      {pageCount > 1 ? (
        <Group justify="center">
          <Pagination total={pageCount} value={page} onChange={setPage} size="sm" />
        </Group>
      ) : null}
    </Stack>
  );
};
