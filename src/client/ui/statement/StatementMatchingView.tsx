import {
  ActionIcon,
  Affix,
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  Group,
  Loader,
  Menu,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
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
import { Money, MoneyLike } from 'shared/util';
import { apiConnect } from 'client/data/ApiConnect';
import { getFullCategoryName } from 'client/data/Categories';
import { QueryKeys } from 'client/data/queryKeys';
import { useCategoryMap } from 'client/data/SessionStore';
import { requestNewExpense } from 'client/data/State';
import { QueryBoundary } from 'client/ui/component/QueryBoundary';
import { UserIdAvatar } from 'client/ui/component/UserAvatar';
import { executeOperation } from 'client/util/ExecuteOperation';

import { DivisionInfo } from '../expense/details/DivisionInfo';
import { defaultExpenseSaveAction } from '../expense/dialog/ExpenseSaveAction';
import { ExpenseMenuItems } from '../expense/row/ExpenseRowMenu';
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
  const activeSuggestions = suggestions.filter(
    s => !s.statementRowIds.some(id => dismissedSuggestions.has(id)),
  );
  const suggestedRowIds = new Set(activeSuggestions.flatMap(s => s.statementRowIds));
  const suggestedExpenseIds = new Set(activeSuggestions.flatMap(s => s.expenseIds));

  const [selectedRowIds, setSelectedRowIds] = React.useState<number[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = React.useState<number[]>([]);
  const [hideHandled, setHideHandled] = React.useState(false);

  // Display-only filter: matched and skipped items are hidden so only the
  // remaining work is visible. Counts and selection totals still use the
  // full data.
  const visibleExpenses = hideHandled
    ? data.expenses.filter(e => e.matchedStatementRowIds.length < 1 && !e.statementSkip)
    : data.expenses;
  const visibleRows = hideHandled
    ? data.statementRows.filter(r => r.matchedExpenseIds.length < 1 && !r.skipped)
    : data.statementRows;

  const clearSelection = () => {
    setSelectedRowIds([]);
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
    if (selectedRowIds.length < 1 || selectedExpenseIds.length < 1) {
      return;
    }
    const match: StatementMatchInput = {
      statementRowIds: selectedRowIds,
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
          await apiConnect.createStatementMatch({ statementRowIds: [row.id], expenseIds: [id] });
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

  const buckets = buildBuckets(visibleExpenses, visibleRows, activeSuggestions);
  const unmatchedExpenses = data.expenses.filter(
    e => e.matchedStatementRowIds.length < 1 && !e.statementSkip,
  ).length;
  const unmatchedRows = data.statementRows.filter(
    r => r.matchedExpenseIds.length < 1 && !r.skipped,
  ).length;

  // Connector lines: confirmed matches, active suggestions, and a preview
  // of the current manual selection.
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { cards, registerCard } = useCardRefs();
  const connectors: ConnectorSpec[] = [
    ...visibleRows.flatMap(r =>
      r.matchedExpenseIds.map(expenseId => ({
        expenseId,
        rowId: r.id,
        kind: 'match' as const,
      })),
    ),
    ...activeSuggestions.flatMap(s =>
      s.statementRowIds.flatMap(rowId =>
        s.expenseIds.map(expenseId => ({
          expenseId,
          rowId,
          kind: 'suggestion' as const,
        })),
      ),
    ),
    ...selectedRowIds.flatMap(rowId =>
      selectedExpenseIds.map(expenseId => ({
        expenseId,
        rowId,
        kind: 'selection' as const,
      })),
    ),
  ];

  const selectionActive = selectedRowIds.length > 0 || selectedExpenseIds.length > 0;
  const actionBarVisible = selectionActive || activeSuggestions.length > 0;
  const selectedRowTotal = data.statementRows
    .filter(r => selectedRowIds.includes(r.id))
    .reduce((sum, r) => sum.plus(r.amount), Money.from(0));
  const selectedTotal = data.expenses
    .filter(e => selectedExpenseIds.includes(e.id))
    .reduce((sum, e) => sum.plus(e.sum), Money.from(0));

  return (
    <Stack gap="sm" pb={actionBarVisible ? 80 : undefined}>
      <Group gap="md" justify="space-between">
        <Text fz="sm" c="dimmed">
          Täsmäämättä: {unmatchedExpenses} kirjausta, {unmatchedRows} tiliotetapahtumaa
        </Text>
        <Checkbox
          size="xs"
          label="Piilota täsmätyt ja ohitetut"
          checked={hideHandled}
          onChange={e => setHideHandled(e.currentTarget.checked)}
        />
      </Group>

      <Group gap="md" wrap="nowrap" align="center">
        <Text fz="sm" fw={600} flex={1}>
          Kirjaukset
        </Text>
        <Text fz="sm" fw={600} flex={1}>
          Tiliotetapahtumat
        </Text>
      </Group>

      <Box pos="relative" ref={containerRef}>
        <Stack gap={0}>
          {bucketZones(buckets, month).map(zone => (
            <Box
              key={zone.key}
              p="xs"
              // The selected month is one continuous panel; the tolerance
              // areas above and below it get a softer half-step tint (same
              // mix as the expense table's alternating day rows), so the
              // month boundary shows as a sharp background change.
              bg={zone.inMonth ? 'surface.1' : undefined}
              style={
                zone.inMonth
                  ? undefined
                  : {
                      backgroundColor:
                        'color-mix(in srgb, var(--mantine-color-surface-0), var(--mantine-color-surface-1))',
                    }
              }
            >
              <Stack gap="sm">
                {zone.buckets.map(bucket => (
                  <Box key={bucket.date}>
                    <Text fz="sm" c="dimmed" mb={4}>
                      {readableDateWithYear(bucket.date)}
                    </Text>
                    <Group gap="xl" wrap="nowrap" align="flex-start">
                      <Stack gap="xs" flex={1} miw={0}>
                        {bucket.expenses.map(e => (
                          <ExpenseCard
                            key={e.id}
                            cardRef={registerCard(expenseCardKey(e.id))}
                            expense={e}
                            linkedExpenses={
                              e.splitId
                                ? data.expenses.filter(
                                    x => x.id !== e.id && x.splitId === e.splitId,
                                  )
                                : []
                            }
                            suggested={suggestedExpenseIds.has(e.id)}
                            selected={selectedExpenseIds.includes(e.id)}
                            onSelect={() =>
                              setSelectedExpenseIds(ids =>
                                ids.includes(e.id) ? ids.filter(i => i !== e.id) : [...ids, e.id],
                              )
                            }
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
                            selected={selectedRowIds.includes(r.id)}
                            onSelect={() =>
                              setSelectedRowIds(ids =>
                                ids.includes(r.id) ? ids.filter(i => i !== r.id) : [...ids, r.id],
                              )
                            }
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
            </Box>
          ))}
        </Stack>
        {/* Rendered after the cards so their refs are attached before the
            overlay measures them on mount. */}
        <MatchConnectors containerRef={containerRef} cards={cards} connectors={connectors} />
      </Box>
      {buckets.length < 1 ? (
        <Text fz="sm" c="dimmed">
          {hideHandled && (data.expenses.length > 0 || data.statementRows.length > 0)
            ? 'Kaikki kirjaukset ja tiliotetapahtumat on käsitelty.'
            : 'Ei kirjauksia eikä tiliotetapahtumia tässä kuussa.'}
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
                      Valittu {selectedExpenseIds.length} kirjausta ({selectedTotal.format()}) ·{' '}
                      {selectedRowIds.length} tapahtumaa ({selectedRowTotal.format()})
                    </Text>
                    <Button
                      size="xs"
                      leftSection={<Icons.Link />}
                      disabled={selectedRowIds.length < 1 || selectedExpenseIds.length < 1}
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

interface BucketZone {
  key: 'before' | 'month' | 'after';
  inMonth: boolean;
  buckets: DateBucket[];
}

/**
 * Splits the (sorted) buckets into up to three zones: tolerance dates
 * before the month, the selected month itself, and tolerance dates after.
 */
function bucketZones(buckets: DateBucket[], month: ISOMonth): BucketZone[] {
  const zones: BucketZone[] = [
    { key: 'before', inMonth: false, buckets: buckets.filter(b => b.date < `${month}-01`) },
    { key: 'month', inMonth: true, buckets: buckets.filter(b => b.date.startsWith(month)) },
    {
      key: 'after',
      inMonth: false,
      buckets: buckets.filter(b => !b.date.startsWith(month) && b.date > `${month}-01`),
    },
  ];
  return zones.filter(z => z.buckets.length > 0);
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
    suggestions.flatMap(s => s.expenseIds.map(id => [id, Math.min(...s.statementRowIds)] as const)),
  );
  const suggestedRowIds = new Set(suggestions.flatMap(s => s.statementRowIds));
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
  if (e.matchedStatementRowIds.length > 0) {
    return [0, Math.min(...e.matchedStatementRowIds), e.id];
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

// Suggested cards use a dashed border like the suggestion connectors, so
// they don't get confused with the solid border of a selected card.
const cardStyle = (state: {
  matched: boolean;
  skipped: boolean;
  suggested: boolean;
  selected: boolean;
}) => ({
  padding: 'var(--mantine-spacing-xs)',
  opacity: state.matched || state.skipped ? 0.75 : 1,
  cursor: state.skipped ? 'default' : 'pointer',
  borderColor: state.selected
    ? 'var(--mantine-color-primary-7)'
    : state.suggested
      ? 'var(--mantine-color-primary-4)'
      : undefined,
  borderStyle: state.skipped || (state.suggested && !state.selected) ? 'dashed' : 'solid',
  borderWidth: state.selected ? 2 : 1,
});

/**
 * Shared card shell for both columns: a selectable Paper with a header row
 * (given left content; badges, sum, expand chevron and a three-dot actions
 * menu on the right) plus the tall-mode details when expanded. Chevron,
 * menu and details clicks stop propagation so only clicks on the card
 * itself toggle selection. The menu dropdown needs its own handler: even
 * though it renders in a portal, React propagates its events through the
 * component tree, not the DOM tree.
 */
const MatchCard: React.FC<{
  cardRef: (el: HTMLDivElement | null) => void;
  matched: boolean;
  skipped: boolean;
  suggested: boolean;
  selected: boolean;
  onSelect: () => void;
  /** Left side of the header row. */
  header: React.ReactNode;
  /** Extra badges shown before the standard state badges. */
  extraBadges?: React.ReactNode;
  sum: MoneyLike;
  sumColor?: string;
  /** Contents of the three-dot actions menu. */
  menuItems: React.ReactNode;
  /** Tall-mode content, mounted only while the card is expanded. */
  details: React.ReactNode;
}> = ({
  cardRef,
  matched,
  skipped,
  suggested,
  selected,
  onSelect,
  header,
  extraBadges,
  sum,
  sumColor,
  menuItems,
  details,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  // Matched items stay selectable so a group can be extended with more links
  const selectable = !skipped;
  return (
    <Paper
      ref={cardRef}
      withBorder
      style={cardStyle({ matched, skipped, suggested, selected })}
      onClick={selectable ? onSelect : undefined}
    >
      <Group gap="xs" wrap="nowrap" justify="space-between">
        {header}
        {/* The right side never shrinks; a tight fit truncates the header side. */}
        <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
          {extraBadges}
          <ItemBadges matched={matched} skipped={skipped} suggested={suggested} />
          <Text fz="sm" fw={600} c={sumColor} style={{ whiteSpace: 'nowrap' }}>
            {Money.from(sum).format()}
          </Text>
          <ExpandToggle expanded={expanded} onToggle={() => setExpanded(v => !v)} />
          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                size="sm"
                aria-label="Toiminnot"
                title="Toiminnot"
                onClick={e => e.stopPropagation()}
              >
                <Icons.More size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown onClick={e => e.stopPropagation()}>{menuItems}</Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
      {expanded ? <CardDetails>{details}</CardDetails> : null}
    </Paper>
  );
};

const ExpenseCard: React.FC<{
  cardRef: (el: HTMLDivElement | null) => void;
  expense: MatchableExpense;
  /** Other loaded expenses split from the same original (same splitId). */
  linkedExpenses: MatchableExpense[];
  suggested: boolean;
  selected: boolean;
  onSelect: () => void;
  onUnmatch: () => void;
  onToggleSkip: () => void;
}> = ({
  cardRef,
  expense,
  linkedExpenses,
  suggested,
  selected,
  onSelect,
  onUnmatch,
  onToggleSkip,
}) => {
  const matched = expense.matchedStatementRowIds.length > 0;
  return (
    <MatchCard
      cardRef={cardRef}
      matched={matched}
      skipped={expense.statementSkip}
      suggested={suggested}
      selected={selected}
      onSelect={onSelect}
      header={
        <Group gap="xs" wrap="nowrap" miw={0}>
          <UserIdAvatar userId={expense.userId} size="sm" />
          <Box miw={0}>
            <Text fz="sm" truncate>
              {expense.title ?? expense.receiver ?? '–'}
            </Text>
            <Text fz="sm" c="dimmed" truncate>
              {expense.receiver ?? ''}
            </Text>
          </Box>
        </Group>
      }
      extraBadges={
        !expense.confirmed ? (
          <Tooltip label="Alustava kirjaus — summa voi vielä muuttua">
            <Badge size="xs" variant="light" color="yellow" radius="sm" style={{ flexShrink: 0 }}>
              Alustava
            </Badge>
          </Tooltip>
        ) : null
      }
      sum={expense.sum}
      menuItems={
        <>
          {matched ? (
            <Menu.Item leftSection={<Icons.Unlink size={16} />} onClick={() => void onUnmatch()}>
              Poista täsmäytys
            </Menu.Item>
          ) : (
            <Menu.Item
              leftSection={
                expense.statementSkip ? <Icons.Visible size={16} /> : <Icons.Hidden size={16} />
              }
              onClick={() => void onToggleSkip()}
            >
              {expense.statementSkip ? 'Palauta täsmättäväksi' : 'Ohita täsmäytys'}
            </Menu.Item>
          )}
          <Menu.Divider />
          <ExpenseMenuItems expense={expense} />
        </>
      }
      details={
        <QueryBoundary
          fallback={
            <Center py="sm">
              <Loader size="sm" />
            </Center>
          }
        >
          <ExpenseCardDetails expenseId={expense.id} linkedExpenses={linkedExpenses} />
        </QueryBoundary>
      }
    />
  );
};

/** Chevron that toggles a card between the narrow and tall (details) modes. */
const ExpandToggle: React.FC<{ expanded: boolean; onToggle: () => void }> = ({
  expanded,
  onToggle,
}) => (
  <ActionIcon
    size="sm"
    aria-label={expanded ? 'Piilota tiedot' : 'Näytä tiedot'}
    title={expanded ? 'Piilota tiedot' : 'Näytä tiedot'}
    onClick={e => {
      e.stopPropagation();
      onToggle();
    }}
  >
    {expanded ? <Icons.ExpandLess size={16} /> : <Icons.ExpandMore size={16} />}
  </ActionIcon>
);

/**
 * Container for a card's tall-mode content. Stops click propagation so
 * interacting with (or selecting text in) the details does not toggle the
 * card's selection.
 */
const CardDetails: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box pt="xs" style={{ cursor: 'auto' }} onClick={e => e.stopPropagation()}>
    {children}
  </Box>
);

/**
 * Tall-mode content of an expense card: category, description, division
 * (with balance), and the other expenses split from the same original.
 * The details (division, description) are not part of the matching data,
 * so they are fetched per expense when the card is first expanded.
 */
const ExpenseCardDetails: React.FC<{
  expenseId: ObjectId;
  linkedExpenses: MatchableExpense[];
}> = ({ expenseId, linkedExpenses }) => {
  const categoryMap = useCategoryMap()!;
  const { data: details } = useSuspenseQuery({
    queryKey: QueryKeys.expenses.detail(expenseId),
    queryFn: () => apiConnect.getExpense(expenseId),
  });
  return (
    <Stack gap="xs">
      <Text fz="sm" c="dimmed">
        {getFullCategoryName(details.categoryId, categoryMap)}
      </Text>
      {details.description ? (
        <Text fz="sm" style={{ overflowWrap: 'anywhere' }}>
          {details.description}
        </Text>
      ) : null}
      <DivisionInfo division={details.division} expenseType={details.type} />
      {linkedExpenses.length > 0 ? (
        <Box>
          <Text fz="sm" c="dimmed">
            Pilkottu samasta kirjauksesta
          </Text>
          {linkedExpenses.map(l => (
            <Group key={l.id} gap="xs" wrap="nowrap" justify="space-between">
              <Text fz="sm" truncate>
                {l.title ?? l.receiver ?? '–'}
              </Text>
              <Text fz="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
                {Money.from(l.sum).format()}
              </Text>
            </Group>
          ))}
        </Box>
      ) : null}
    </Stack>
  );
};

/**
 * Tall-mode content of a statement row card: all parsed statement fields
 * in full, so long messages are readable even when the narrow mode
 * truncates them.
 */
const StatementRowDetails: React.FC<{ row: MatchingStatementRow }> = ({ row }) => {
  const fields: [string, string | null][] = [
    ['Kirjauspäivä', readableDateWithYear(row.bookingDate)],
    ['Arvopäivä', readableDateWithYear(row.valueDate)],
    ['Ostopäivä', row.purchaseDate ? readableDateWithYear(row.purchaseDate) : null],
    ['Tapahtumalaji', row.type],
    ['Saaja/Maksaja', row.counterparty],
    ['Tilinumero', row.counterpartyAccount],
    ['Viite', row.reference],
    ['Viesti', row.message],
    ['Arkistointitunnus', row.archiveId],
  ];
  return (
    <Stack gap={4}>
      {fields
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <Group key={label} gap="xs" wrap="nowrap" align="flex-start">
            <Text fz="sm" c="dimmed" w={120} style={{ flexShrink: 0 }}>
              {label}
            </Text>
            <Text fz="sm" style={{ overflowWrap: 'anywhere' }}>
              {value}
            </Text>
          </Group>
        ))}
    </Stack>
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
  const ownDate = effectiveStatementDate(row);
  return (
    <MatchCard
      cardRef={cardRef}
      matched={matched}
      skipped={row.skipped}
      suggested={suggested}
      selected={selected}
      onSelect={onSelect}
      header={
        <Box miw={0}>
          <Group gap={6} wrap="nowrap">
            <Text fz="sm" truncate>
              {row.counterparty ?? row.type}
            </Text>
            {ownDate !== displayDate ? (
              <Tooltip label="Tiliotteen päivä eroaa kirjauksen päivästä">
                <Text fz="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {readableDateWithYear(ownDate)}
                </Text>
              </Tooltip>
            ) : null}
          </Group>
          <Text fz="sm" c="dimmed" truncate>
            {row.message ?? row.reference ?? row.type}
          </Text>
        </Box>
      }
      sum={row.amount}
      sumColor={row.amount.startsWith('-') ? undefined : 'green.8'}
      menuItems={
        <>
          {suggested ? (
            <Menu.Item
              leftSection={<Icons.Clear size={16} />}
              onClick={() => void onDismissSuggestion()}
            >
              Hylkää ehdotus
            </Menu.Item>
          ) : null}
          {matched ? (
            <Menu.Item leftSection={<Icons.Unlink size={16} />} onClick={() => void onUnmatch()}>
              Poista täsmäytys
            </Menu.Item>
          ) : (
            <>
              <Menu.Item
                leftSection={<Icons.PlusCircle size={16} />}
                onClick={() => void onCreateExpense()}
              >
                Luo kirjaus tästä
              </Menu.Item>
              <Menu.Item
                leftSection={row.skipped ? <Icons.Visible size={16} /> : <Icons.Hidden size={16} />}
                onClick={() => void onToggleSkip()}
              >
                {row.skipped ? 'Palauta täsmättäväksi' : 'Ohita täsmäytys'}
              </Menu.Item>
            </>
          )}
        </>
      }
      details={<StatementRowDetails row={row} />}
    />
  );
};

// flexShrink 0 keeps the badges intact in the card's nowrap header row, so
// a tight fit truncates the title text instead of ellipsizing the badge.
const ItemBadges: React.FC<{ matched: boolean; skipped: boolean; suggested: boolean }> = ({
  matched,
  skipped,
  suggested,
}) => (
  <>
    {matched ? (
      <Badge size="xs" variant="light" color="green" radius="sm" style={{ flexShrink: 0 }}>
        Täsmätty
      </Badge>
    ) : null}
    {skipped ? (
      <Badge size="xs" variant="light" color="gray" radius="sm" style={{ flexShrink: 0 }}>
        Ohitettu
      </Badge>
    ) : null}
    {suggested ? (
      <Badge size="xs" variant="light" color="primary" radius="sm" style={{ flexShrink: 0 }}>
        Ehdotus
      </Badge>
    ) : null}
  </>
);
