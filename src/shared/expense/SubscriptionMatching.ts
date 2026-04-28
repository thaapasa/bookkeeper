import { ISODate } from '../time/Time';
import { ExpenseQuery, ExpenseType } from './Expense';

export interface SubscriptionFilter {
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
  id: number,
  filter: ExpenseQuery,
  subtreeCategoryIds: Iterable<number>,
): SubscriptionFilter {
  const direct = new Set<number>(toCategoryArray(filter.categoryId));
  const subtree = new Set<number>(subtreeCategoryIds);
  for (const cid of direct) subtree.delete(cid);
  return {
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

/**
 * On equal score the older subscription wins (lowest id). All filters
 * now live in the `subscriptions` table, so id ordering is the single
 * tiebreak rule.
 */
export function pickWinningFilter(
  expense: MatchableExpense,
  filters: readonly SubscriptionFilter[],
): SubscriptionFilter | null {
  let best: SubscriptionFilter | null = null;
  let bestScore = -1;
  let bestId = Infinity;
  for (const filter of filters) {
    const score = scoreFilter(filter, expense);
    if (score === null) continue;
    if (score > bestScore || (score === bestScore && filter.id < bestId)) {
      best = filter;
      bestScore = score;
      bestId = filter.id;
    }
  }
  return best;
}

/**
 * For each candidate expense, find the highest-scoring filter that
 * matches it (with the tiebreak rule). Returns the assignments grouped
 * by filter id. Expenses that match no filter are not returned.
 */
export function assignExpensesToSubscriptions(
  expenses: readonly MatchableExpense[],
  filters: readonly SubscriptionFilter[],
): Map<number, MatchableExpense[]> {
  const assignments = new Map<number, MatchableExpense[]>();
  for (const expense of expenses) {
    const winner = pickWinningFilter(expense, filters);
    if (!winner) continue;
    const list = assignments.get(winner.id);
    if (list) list.push(expense);
    else assignments.set(winner.id, [expense]);
  }
  return assignments;
}
