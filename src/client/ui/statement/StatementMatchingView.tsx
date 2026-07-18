import { Affix, Badge, Box, Button, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';

import {
  effectiveStatementDate,
  MatchableExpense,
  MatchingStatementRow,
  StatementMatchInput,
  suggestStatementMatches,
} from 'shared/statement';
import { ISODate, ISOMonth, readableDateWithYear } from 'shared/time';
import { ObjectId } from 'shared/types';
import { Money } from 'shared/util';
import { apiConnect } from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';
import { editExpense, requestNewExpense } from 'client/data/State';
import { UserIdAvatar } from 'client/ui/component/UserAvatar';
import { executeOperation } from 'client/util/ExecuteOperation';

import { defaultExpenseSaveAction } from '../expense/dialog/ExpenseSaveAction';
import { Icons } from '../icons/Icons';
import {
  ConnectorSpec,
  expenseCardKey,
  MatchConnectors,
  rowCardKey,
  useCardRefs,
} from './MatchConnectors';

/**
 * Statement-to-expense matching view for one (source, month): expenses on
 * the left, statement rows on the right, grouped into per-date buckets.
 * Preliminary match suggestions are computed client-side and confirmed as a
 * batch; manual matching works by selecting one statement row and one or
 * more expenses.
 */
export const StatementMatchingView: React.FC<{ sourceId: ObjectId; month: ISOMonth }> = ({
  sourceId,
  month,
}) => {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: QueryKeys.statements.matching(sourceId, month),
    queryFn: () => apiConnect.getStatementMatching(sourceId, month),
  });

  const suggestions = React.useMemo(
    () => suggestStatementMatches(data.expenses, data.statementRows),
    [data],
  );
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState<Set<number>>(
    () => new Set(),
  );
  const activeSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.statementRowId));
  const suggestedRowIds = new Set(activeSuggestions.map(s => s.statementRowId));
  const suggestedExpenseIds = new Set(activeSuggestions.flatMap(s => s.expenseIds));

  const [selectedRowId, setSelectedRowId] = React.useState<number | null>(null);
  const [selectedExpenseIds, setSelectedExpenseIds] = React.useState<number[]>([]);

  const clearSelection = () => {
    setSelectedRowId(null);
    setSelectedExpenseIds([]);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QueryKeys.statements.all });

  const confirmSuggestions = () =>
    executeOperation(() => apiConnect.createStatementMatches(activeSuggestions), {
      success: `${activeSuggestions.length} ehdotusta täsmätty`,
      postProcess: () => {
        setDismissedSuggestions(new Set());
        clearSelection();
        return invalidate();
      },
    });

  const matchSelection = () => {
    if (selectedRowId === null || selectedExpenseIds.length < 1) {
      return;
    }
    const match: StatementMatchInput = {
      statementRowId: selectedRowId,
      expenseIds: selectedExpenseIds,
    };
    return executeOperation(() => apiConnect.createStatementMatch(match), {
      success: 'Täsmätty',
      postProcess: () => {
        clearSelection();
        return invalidate();
      },
    });
  };

  const createExpenseFromRow = (row: MatchingStatementRow) => {
    const amount = Money.from(row.amount);
    void requestNewExpense(
      async (expense, original) => {
        const id = await defaultExpenseSaveAction(expense, original);
        if (id) {
          await apiConnect.createStatementMatch({ statementRowId: row.id, expenseIds: [id] });
          await invalidate();
        }
        return id;
      },
      'Uusi kirjaus tiliotteelta',
      {
        date: effectiveStatementDate(row),
        sum: amount.abs().toString(),
        receiver: row.counterparty ?? '',
        type: row.amount.startsWith('-') ? 'expense' : 'income',
        sourceId,
      },
    );
  };

  const buckets = buildBuckets(data.expenses, data.statementRows, activeSuggestions);
  const unmatchedExpenses = data.expenses.filter(
    e => !e.matchedStatementRowId && !e.statementSkip,
  ).length;
  const unmatchedRows = data.statementRows.filter(
    r => r.matchedExpenseIds.length < 1 && !r.skipped,
  ).length;

  // Connector lines: confirmed matches, active suggestions, and a preview
  // of the current manual selection.
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { cards, registerCard } = useCardRefs();
  const connectors: ConnectorSpec[] = [
    ...data.statementRows.flatMap(r =>
      r.matchedExpenseIds.map(expenseId => ({
        expenseId,
        rowId: r.id,
        kind: 'match' as const,
      })),
    ),
    ...activeSuggestions.flatMap(s =>
      s.expenseIds.map(expenseId => ({
        expenseId,
        rowId: s.statementRowId,
        kind: 'suggestion' as const,
      })),
    ),
    ...(selectedRowId !== null
      ? selectedExpenseIds.map(expenseId => ({
          expenseId,
          rowId: selectedRowId,
          kind: 'selection' as const,
        }))
      : []),
  ];

  const selectionActive = selectedRowId !== null || selectedExpenseIds.length > 0;
  const actionBarVisible = selectionActive || activeSuggestions.length > 0;
  const selectedRow =
    selectedRowId !== null ? data.statementRows.find(r => r.id === selectedRowId) : undefined;
  const selectedTotal = data.expenses
    .filter(e => selectedExpenseIds.includes(e.id))
    .reduce((sum, e) => sum.plus(e.sum), Money.from(0));

  return (
    <Stack gap="sm" pb={actionBarVisible ? 80 : undefined}>
      <Text fz="sm" c="dimmed">
        Täsmäämättä: {unmatchedExpenses} kirjausta, {unmatchedRows} tiliotetapahtumaa
      </Text>

      <Group gap="md" wrap="nowrap" align="center">
        <Text fz="sm" fw={600} flex={1}>
          Kirjaukset
        </Text>
        <Text fz="sm" fw={600} flex={1}>
          Tiliotetapahtumat
        </Text>
      </Group>

      <Box pos="relative" ref={containerRef}>
        <Stack gap="sm">
          {buckets.map(bucket => (
            <Box key={bucket.date}>
              <Text fz="xs" c="dimmed" mb={4}>
                {readableDateWithYear(bucket.date)}
              </Text>
              <Group gap="xl" wrap="nowrap" align="flex-start">
                <Stack gap="xs" flex={1} miw={0}>
                  {bucket.expenses.map(e => (
                    <ExpenseCard
                      key={e.id}
                      cardRef={registerCard(expenseCardKey(e.id))}
                      expense={e}
                      suggested={suggestedExpenseIds.has(e.id)}
                      selected={selectedExpenseIds.includes(e.id)}
                      onSelect={() =>
                        setSelectedExpenseIds(ids =>
                          ids.includes(e.id) ? ids.filter(i => i !== e.id) : [...ids, e.id],
                        )
                      }
                      onEdit={async () => {
                        // The editor's save invalidates all queries; refresh
                        // again on close so an edited sum/date reflows the view
                        await editExpense(e.id);
                        await invalidate();
                      }}
                      onUnmatch={() =>
                        executeOperation(() => apiConnect.unmatchExpense(e.id), {
                          postProcess: invalidate,
                        })
                      }
                      onToggleSkip={() =>
                        executeOperation(
                          () => apiConnect.setExpenseStatementSkip(e.id, !e.statementSkip),
                          { postProcess: invalidate },
                        )
                      }
                    />
                  ))}
                </Stack>
                <Stack gap="xs" flex={1} miw={0}>
                  {bucket.rows.map(r => (
                    <StatementRowCard
                      key={r.id}
                      cardRef={registerCard(rowCardKey(r.id))}
                      row={r}
                      displayDate={bucket.date}
                      suggested={suggestedRowIds.has(r.id)}
                      selected={selectedRowId === r.id}
                      onSelect={() => setSelectedRowId(id => (id === r.id ? null : r.id))}
                      onDismissSuggestion={() =>
                        setDismissedSuggestions(prev => new Set(prev).add(r.id))
                      }
                      onUnmatch={() =>
                        executeOperation(() => apiConnect.unmatchStatementRow(r.id), {
                          postProcess: invalidate,
                        })
                      }
                      onToggleSkip={() =>
                        executeOperation(
                          () => apiConnect.setStatementRowSkipped(r.id, !r.skipped),
                          { postProcess: invalidate },
                        )
                      }
                      onCreateExpense={() => createExpenseFromRow(r)}
                    />
                  ))}
                </Stack>
              </Group>
            </Box>
          ))}
        </Stack>
        {/* Rendered after the cards so their refs are attached before the
            overlay measures them on mount. */}
        <MatchConnectors containerRef={containerRef} cards={cards} connectors={connectors} />
      </Box>
      {buckets.length < 1 ? (
        <Text fz="sm" c="dimmed">
          Ei kirjauksia eikä tiliotetapahtumia tässä kuussa.
        </Text>
      ) : null}
      {actionBarVisible ? (
        <Affix position={{ bottom: 20, left: 0, right: 0 }} zIndex={200}>
          <Group justify="center">
            <Paper shadow="md" withBorder p="sm" radius="md">
              <Group gap="sm" wrap="nowrap">
                {selectionActive ? (
                  <>
                    <Text fz="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                      Valittu {selectedExpenseIds.length} kirjausta ({selectedTotal.format()})
                      {selectedRow ? ` · tapahtuma ${Money.from(selectedRow.amount).format()}` : ''}
                    </Text>
                    <Button
                      size="xs"
                      leftSection={<Icons.Link />}
                      disabled={selectedRowId === null || selectedExpenseIds.length < 1}
                      onClick={() => void matchSelection()}
                    >
                      Täsmää valitut
                    </Button>
                    <Button size="xs" variant="default" onClick={clearSelection}>
                      Tyhjennä
                    </Button>
                  </>
                ) : null}
                {activeSuggestions.length > 0 ? (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<Icons.Check />}
                    onClick={() => void confirmSuggestions()}
                  >
                    Vahvista {activeSuggestions.length} ehdotusta
                  </Button>
                ) : null}
              </Group>
            </Paper>
          </Group>
        </Affix>
      ) : null}
    </Stack>
  );
};

interface DateBucket {
  date: ISODate;
  expenses: MatchableExpense[];
  rows: MatchingStatementRow[];
}

function buildBuckets(
  expenses: MatchableExpense[],
  rows: MatchingStatementRow[],
  suggestions: StatementMatchInput[],
): DateBucket[] {
  const expenseDates = new Map(expenses.map(e => [e.id, e.date]));
  const buckets = new Map<ISODate, DateBucket>();
  const bucket = (date: ISODate): DateBucket => {
    let b = buckets.get(date);
    if (!b) {
      b = { date, expenses: [], rows: [] };
      buckets.set(date, b);
    }
    return b;
  };
  for (const e of expenses) {
    bucket(e.date).expenses.push(e);
  }
  for (const r of rows) {
    bucket(rowBucketDate(r, expenseDates)).rows.push(r);
  }
  const suggestionRowByExpense = new Map(
    suggestions.flatMap(s => s.expenseIds.map(id => [id, s.statementRowId] as const)),
  );
  const suggestedRowIds = new Set(suggestions.map(s => s.statementRowId));
  for (const b of buckets.values()) {
    b.expenses.sort(compareBucketOrder(e => expenseOrderKey(e, suggestionRowByExpense)));
    b.rows.sort(compareBucketOrder(r => rowOrderKey(r, suggestedRowIds)));
  }
  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Within a bucket both columns sort the same way — matched first, then
 * suggested, then unmatched, skipped last — and matched/suggested items on
 * both sides order by the statement row id of their link, so pairs sit on
 * the same line and connectors do not cross.
 */
type BucketOrderKey = [group: number, linkedRowId: number, id: number];

function expenseOrderKey(
  e: MatchableExpense,
  suggestionRowByExpense: Map<number, number>,
): BucketOrderKey {
  if (e.matchedStatementRowId !== null) {
    return [0, e.matchedStatementRowId, e.id];
  }
  const suggestedRow = suggestionRowByExpense.get(e.id);
  if (suggestedRow !== undefined) {
    return [1, suggestedRow, e.id];
  }
  return [e.statementSkip ? 3 : 2, 0, e.id];
}

function rowOrderKey(r: MatchingStatementRow, suggestedRowIds: Set<number>): BucketOrderKey {
  if (r.matchedExpenseIds.length > 0) {
    return [0, r.id, r.id];
  }
  if (suggestedRowIds.has(r.id)) {
    return [1, r.id, r.id];
  }
  return [r.skipped ? 3 : 2, 0, r.id];
}

function compareBucketOrder<T>(key: (item: T) => BucketOrderKey) {
  return (a: T, b: T) => {
    const ka = key(a);
    const kb = key(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
  };
}

/**
 * Matched statement rows move to their expenses' date bucket so the pair
 * sits on one line; the row's own date is then shown on its card. Unmatched
 * rows stay on their effective date.
 */
function rowBucketDate(r: MatchingStatementRow, expenseDates: Map<number, ISODate>): ISODate {
  const matchedDates = r.matchedExpenseIds
    .map(id => expenseDates.get(id))
    .filter((d): d is ISODate => d !== undefined)
    .sort();
  return matchedDates[0] ?? effectiveStatementDate(r);
}

const cardStyle = (state: {
  matched: boolean;
  skipped: boolean;
  suggested: boolean;
  selected: boolean;
}) => ({
  padding: 'var(--mantine-spacing-xs)',
  opacity: state.matched || state.skipped ? 0.55 : 1,
  cursor: state.matched || state.skipped ? 'default' : 'pointer',
  borderColor: state.selected
    ? 'var(--mantine-color-primary-7)'
    : state.suggested
      ? 'var(--mantine-color-primary-5)'
      : undefined,
  borderStyle: state.skipped ? 'dashed' : 'solid',
  borderWidth: state.selected ? 2 : 1,
});

const ExpenseCard: React.FC<{
  cardRef: (el: HTMLDivElement | null) => void;
  expense: MatchableExpense;
  suggested: boolean;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onUnmatch: () => void;
  onToggleSkip: () => void;
}> = ({ cardRef, expense, suggested, selected, onSelect, onEdit, onUnmatch, onToggleSkip }) => {
  const matched = expense.matchedStatementRowId !== null;
  const selectable = !matched && !expense.statementSkip;
  return (
    <Paper
      ref={cardRef}
      withBorder
      style={cardStyle({ matched, skipped: expense.statementSkip, suggested, selected })}
      onClick={selectable ? onSelect : undefined}
    >
      <Group gap="xs" wrap="nowrap" justify="space-between">
        <Group gap="xs" wrap="nowrap" miw={0}>
          <UserIdAvatar userId={expense.userId} size="sm" />
          <Box miw={0}>
            <Text fz="sm" truncate>
              {expense.title ?? expense.receiver ?? '–'}
            </Text>
            <Text fz="xs" c="dimmed" truncate>
              {expense.receiver ?? ''}
            </Text>
          </Box>
        </Group>
        <Group gap={4} wrap="nowrap">
          {!expense.confirmed ? (
            <Tooltip label="Alustava kirjaus — summa voi vielä muuttua">
              <Badge size="xs" variant="light" color="yellow" radius="sm">
                Alustava
              </Badge>
            </Tooltip>
          ) : null}
          <ItemBadges matched={matched} skipped={expense.statementSkip} suggested={suggested} />
          <Text fz="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
            {Money.from(expense.sum).format()}
          </Text>
          <Tooltip label="Muokkaa kirjausta">
            <Icons.Edit size={16} cursor="pointer" onClick={stop(onEdit)} />
          </Tooltip>
          {matched ? (
            <Tooltip label="Poista täsmäytys">
              <Icons.Unlink size={16} cursor="pointer" onClick={onUnmatch} />
            </Tooltip>
          ) : (
            <Tooltip label={expense.statementSkip ? 'Palauta täsmättäväksi' : 'Ohita täsmäytys'}>
              {expense.statementSkip ? (
                <Icons.Visible size={16} cursor="pointer" onClick={onToggleSkip} />
              ) : (
                <Icons.Hidden size={16} cursor="pointer" onClick={stop(onToggleSkip)} />
              )}
            </Tooltip>
          )}
        </Group>
      </Group>
    </Paper>
  );
};

const StatementRowCard: React.FC<{
  cardRef: (el: HTMLDivElement | null) => void;
  row: MatchingStatementRow;
  /** The date bucket the card is shown in; the row's own date is shown when it differs. */
  displayDate: ISODate;
  suggested: boolean;
  selected: boolean;
  onSelect: () => void;
  onDismissSuggestion: () => void;
  onUnmatch: () => void;
  onToggleSkip: () => void;
  onCreateExpense: () => void;
}> = ({
  cardRef,
  row,
  displayDate,
  suggested,
  selected,
  onSelect,
  onDismissSuggestion,
  onUnmatch,
  onToggleSkip,
  onCreateExpense,
}) => {
  const matched = row.matchedExpenseIds.length > 0;
  const selectable = !matched && !row.skipped;
  const ownDate = effectiveStatementDate(row);
  return (
    <Paper
      ref={cardRef}
      withBorder
      style={cardStyle({ matched, skipped: row.skipped, suggested, selected })}
      onClick={selectable ? onSelect : undefined}
    >
      <Group gap="xs" wrap="nowrap" justify="space-between">
        <Box miw={0}>
          <Group gap={6} wrap="nowrap">
            <Text fz="sm" truncate>
              {row.counterparty ?? row.type}
            </Text>
            {ownDate !== displayDate ? (
              <Tooltip label="Tiliotteen päivä eroaa kirjauksen päivästä">
                <Text fz="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {readableDateWithYear(ownDate)}
                </Text>
              </Tooltip>
            ) : null}
          </Group>
          <Text fz="xs" c="dimmed" truncate>
            {row.message ?? row.reference ?? row.type}
          </Text>
        </Box>
        <Group gap={4} wrap="nowrap">
          <ItemBadges matched={matched} skipped={row.skipped} suggested={suggested} />
          <Text
            fz="sm"
            fw={600}
            c={row.amount.startsWith('-') ? undefined : 'green.8'}
            style={{ whiteSpace: 'nowrap' }}
          >
            {Money.from(row.amount).format()}
          </Text>
          {suggested ? (
            <Tooltip label="Hylkää ehdotus">
              <Icons.Clear size={16} cursor="pointer" onClick={stop(onDismissSuggestion)} />
            </Tooltip>
          ) : null}
          {matched ? (
            <Tooltip label="Poista täsmäytys">
              <Icons.Unlink size={16} cursor="pointer" onClick={onUnmatch} />
            </Tooltip>
          ) : (
            <>
              <Tooltip label="Luo kirjaus tästä">
                <Icons.PlusCircle size={16} cursor="pointer" onClick={stop(onCreateExpense)} />
              </Tooltip>
              <Tooltip label={row.skipped ? 'Palauta täsmättäväksi' : 'Ohita täsmäytys'}>
                {row.skipped ? (
                  <Icons.Visible size={16} cursor="pointer" onClick={onToggleSkip} />
                ) : (
                  <Icons.Hidden size={16} cursor="pointer" onClick={stop(onToggleSkip)} />
                )}
              </Tooltip>
            </>
          )}
        </Group>
      </Group>
    </Paper>
  );
};

const ItemBadges: React.FC<{ matched: boolean; skipped: boolean; suggested: boolean }> = ({
  matched,
  skipped,
  suggested,
}) => (
  <>
    {matched ? (
      <Badge size="xs" variant="light" color="green" radius="sm">
        Täsmätty
      </Badge>
    ) : null}
    {skipped ? (
      <Badge size="xs" variant="light" color="gray" radius="sm">
        Ohitettu
      </Badge>
    ) : null}
    {suggested ? (
      <Badge size="xs" variant="light" color="primary" radius="sm">
        Ehdotus
      </Badge>
    ) : null}
  </>
);

/** Wraps a card action handler so the click does not toggle selection. */
const stop = (fn: () => unknown) => (e: React.MouseEvent) => {
  e.stopPropagation();
  void fn();
};
