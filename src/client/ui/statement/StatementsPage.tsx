import { Group, Pagination, Select, Stack, Tabs, Text } from '@mantine/core';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

/**
 * The whole view state lives in the URL —
 * `/p/tiliotteet/[tab]/[sourceId]/m/[month]` — so a reload or a shared
 * link restores the same tab, source, and month. Missing or invalid
 * segments fall back to defaults instead of redirecting. Tab slugs are
 * plain ASCII to keep the URL free of percent-encoding.
 */
const statementTabs = ['tapahtumat', 'tuonnit', 'tasmaytys'] as const;
type StatementTab = (typeof statementTabs)[number];

function parseTab(tab?: string): StatementTab {
  return statementTabs.includes(tab as StatementTab) ? (tab as StatementTab) : 'tapahtumat';
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
  const navigate = useNavigate();
  const [pending, setPending] = React.useState<PendingUpload | null>(null);
  const [importing, setImporting] = React.useState(false);
  const {
    tab: tabParam,
    sourceId: sourceParam,
    month: monthParam,
  } = useParams<'tab' | 'sourceId' | 'month'>();
  const tab = parseTab(tabParam);
  const month = parseMonth(monthParam);

  const bankSources = session.sources.filter(s => s.statementFormat !== null);
  // URL-selected source when it is a valid bank source; otherwise default
  // to the user's own account (the first bank source they are mapped to)
  const urlSource = bankSources.find(s => `${s.id}` === sourceParam);
  const selectedSourceId = (
    urlSource ??
    bankSources.find(s => s.users.some(u => u.userId === session.user.id)) ??
    bankSources[0]
  )?.id;

  const pathFor = (to: { tab?: StatementTab; sourceId?: ObjectId }) => {
    const parts = [statementsPagePath, to.tab ?? tab];
    const source = to.sourceId ?? selectedSourceId;
    if (source !== undefined) {
      parts.push(`${source}`);
    }
    return `${parts.join('/')}/m/${month}`;
  };

  // Bind the top bar date navigator to this page (month mode); tab and
  // source stay in the path when the month changes. Without a bank source
  // there is no month view to navigate — a sourceless month path would not
  // match any statement route and would fall through to the expense page —
  // so the binding is left untouched.
  React.useEffect(() => {
    if (selectedSourceId === undefined) {
      return;
    }
    useNavigationStore.getState().setNavigation({
      pathPrefix: `${statementsPagePath}/${tab}/${selectedSourceId}`,
      dateRange: monthRange(`${month}-01`),
    });
  }, [tab, selectedSourceId, month]);

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
          setPending(null);
          navigate(pathFor({ sourceId }));
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
              onChange={v => (v ? navigate(pathFor({ sourceId: Number(v) })) : undefined)}
              maw={320}
            />
            {selectedSourceId !== undefined ? (
              <Tabs
                value={tab}
                onChange={t => (t ? navigate(pathFor({ tab: t as StatementTab })) : undefined)}
                keepMounted={false}
              >
                <Tabs.List>
                  <Tabs.Tab value="tapahtumat">Tapahtumat</Tabs.Tab>
                  <Tabs.Tab value="tuonnit">Tuonnit</Tabs.Tab>
                  <Tabs.Tab value="tasmaytys">Täsmäytys</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="tapahtumat" pt="md">
                  <StatementRowsList key={selectedSourceId} sourceId={selectedSourceId} />
                </Tabs.Panel>
                <Tabs.Panel value="tuonnit" pt="md">
                  <StatementUploadsList sourceId={selectedSourceId} />
                </Tabs.Panel>
                <Tabs.Panel value="tasmaytys" pt="md">
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
