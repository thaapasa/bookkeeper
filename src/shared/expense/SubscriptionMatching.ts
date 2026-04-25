import { ISODate } from '../time/Time';
import { ExpenseQuery, ExpenseType } from './Expense';

/**
 * Source table for a subscription filter. While reports and recurring
 * expenses live in separate tables (steps 3-5 of the rework), the
 * tiebreaker rule is "recurring before report, then by id". After the
 * tables merge in step 6b this collapses to a single id ordering.
 */
export type FilterSource = 'recurring' | 'report';

export interface SubscriptionFilter {
  source: FilterSource;
  id: number;
  filter: ExpenseQuery;
  /**
   * Categories the filter names exactly. An expense whose `categoryId`
   * is in this set scores `directCategoryWeight`.
   */
  directCategoryIds: Set<number>;
  /**
   * Descendant categories produced by `includeSubCategories: true`,
   * excluding direct ones. An expense whose `categoryId` is here scores
   * `subtreeCategoryWeight`.
   */
  subtreeCategoryIds: Set<number>;
  receiverPattern: string | null;
  titlePattern: string | null;
  searchPattern: string | null;
  types: ExpenseType[] | null;
  userId: number | null;
  confirmed: boolean | null;
  startDate: ISODate | null;
  endDate: ISODate | null;
}

export interface MatchableExpense {
  id: number;
  date: ISODate;
  type: ExpenseType;
  sum: string;
  title: string;
  receiver: string;
  userId: number;
  categoryId: number;
  confirmed: boolean;
}

const directCategoryWeight = 20;
const subtreeCategoryWeight = 10;
const receiverWeight = 15;
const titleWeight = 15;
const searchWeight = 10;
const typeWeight = 5;
const userIdWeight = 5;
const confirmedWeight = 2;

export function buildSubscriptionFilter(
  source: FilterSource,
  id: number,
  filter: ExpenseQuery,
  subtreeCategoryIds: Iterable<number>,
): SubscriptionFilter {
  const direct = new Set<number>(toCategoryArray(filter.categoryId));
  const subtree = new Set<number>(subtreeCategoryIds);
  for (const id of direct) subtree.delete(id);
  return {
    source,
    id,
    filter,
    directCategoryIds: direct,
    subtreeCategoryIds: subtree,
    receiverPattern: lower(filter.receiver),
    titlePattern: lower(filter.title),
    searchPattern: lower(filter.search),
    types: filter.type ? (Array.isArray(filter.type) ? filter.type : [filter.type]) : null,
    userId: filter.userId ?? null,
    confirmed: filter.confirmed ?? null,
    startDate: filter.startDate ?? null,
    endDate: filter.endDate ?? null,
  };
}

function toCategoryArray(value: ExpenseQuery['categoryId']): number[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function lower(value: string | undefined): string | null {
  if (!value) return null;
  return value.toLowerCase();
}

/**
 * Returns the score for matching `expense` against `filter`, or `null`
 * if any specified constraint fails (in which case the filter does not
 * match the expense at all).
 */
export function scoreFilter(filter: SubscriptionFilter, expense: MatchableExpense): number | null {
  let score = 0;

  const hasCategoryConstraint =
    filter.directCategoryIds.size > 0 || filter.subtreeCategoryIds.size > 0;
  if (hasCategoryConstraint) {
    if (filter.directCategoryIds.has(expense.categoryId)) {
      score += directCategoryWeight;
    } else if (filter.subtreeCategoryIds.has(expense.categoryId)) {
      score += subtreeCategoryWeight;
    } else {
      return null;
    }
  }

  if (filter.receiverPattern !== null) {
    if (!expense.receiver.toLowerCase().includes(filter.receiverPattern)) return null;
    score += receiverWeight;
  }

  if (filter.titlePattern !== null) {
    if (!expense.title.toLowerCase().includes(filter.titlePattern)) return null;
    score += titleWeight;
  }

  if (filter.searchPattern !== null) {
    const inTitle = expense.title.toLowerCase().includes(filter.searchPattern);
    const inReceiver = expense.receiver.toLowerCase().includes(filter.searchPattern);
    if (!inTitle && !inReceiver) return null;
    score += searchWeight;
  }

  if (filter.types !== null) {
    if (!filter.types.includes(expense.type)) return null;
    score += typeWeight;
  }

  if (filter.userId !== null) {
    if (expense.userId !== filter.userId) return null;
    score += userIdWeight;
  }

  if (filter.confirmed !== null) {
    if (expense.confirmed !== filter.confirmed) return null;
    score += confirmedWeight;
  }

  if (filter.startDate !== null && expense.date < filter.startDate) return null;
  if (filter.endDate !== null && expense.date > filter.endDate) return null;

  return score;
}

function tiebreakRank(filter: SubscriptionFilter): number {
  // Recurring (source=0) wins over report (source=1) on equal score; then by id.
  return (filter.source === 'recurring' ? 0 : 1) * 10_000_000 + filter.id;
}

export function pickWinningFilter(
  expense: MatchableExpense,
  filters: readonly SubscriptionFilter[],
): SubscriptionFilter | null {
  let best: SubscriptionFilter | null = null;
  let bestScore = -1;
  let bestRank = Infinity;
  for (const filter of filters) {
    const score = scoreFilter(filter, expense);
    if (score === null) continue;
    if (score > bestScore) {
      best = filter;
      bestScore = score;
      bestRank = tiebreakRank(filter);
      continue;
    }
    if (score === bestScore) {
      const rank = tiebreakRank(filter);
      if (rank < bestRank) {
        best = filter;
        bestRank = rank;
      }
    }
  }
  return best;
}

export type FilterKey = `recurring:${number}` | `report:${number}`;

export function filterKey(filter: { source: FilterSource; id: number }): FilterKey {
  return `${filter.source}:${filter.id}` as FilterKey;
}

/**
 * For each candidate expense, find the highest-scoring filter that
 * matches it (with the tiebreak rule). Returns the assignments grouped
 * by filter key. Expenses that match no filter are not returned.
 */
export function assignExpensesToSubscriptions(
  expenses: readonly MatchableExpense[],
  filters: readonly SubscriptionFilter[],
): Map<FilterKey, MatchableExpense[]> {
  const assignments = new Map<FilterKey, MatchableExpense[]>();
  for (const expense of expenses) {
    const winner = pickWinningFilter(expense, filters);
    if (!winner) continue;
    const key = filterKey(winner);
    const list = assignments.get(key);
    if (list) list.push(expense);
    else assignments.set(key, [expense]);
  }
  return assignments;
}
