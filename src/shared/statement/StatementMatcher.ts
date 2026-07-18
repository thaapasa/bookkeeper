import { Money } from '../util/Money';
import { effectiveStatementDate } from './Statement';
import { MatchableExpense, MatchingStatementRow, StatementMatchInput } from './StatementMatch';

/**
 * A matching unit: either a single expense, or all open parts of one split
 * purchase (expenses sharing a split_id), which the bank sees as one
 * payment with the total sum.
 */
interface ExpenseUnit {
  date: string;
  expenseIds: number[];
  signedTotal: string;
}

/**
 * Preliminary statement matching: suggests statement row ↔ expense links
 * for the user to review and confirm. Suggestions are never persisted
 * directly — the UI shows them and the user confirms.
 *
 * Expenses sharing a split_id are treated as one unit whose sum is the
 * total of its open parts — the bank statement has one payment for the
 * whole purchase. A unit is suggested for a row when the dates match (the
 * row's effective date = its real purchase date when known), the signed
 * sums match exactly, and the pairing is unambiguous: exactly one unit and
 * one row share that (date, sum) bucket. Anything ambiguous — including a
 * split whose parts have drifted to different dates — is left for manual
 * matching rather than guessed at.
 */
export function suggestStatementMatches(
  expenses: MatchableExpense[],
  rows: MatchingStatementRow[],
): StatementMatchInput[] {
  const openExpenses = expenses.filter(
    e => e.matchedStatementRowIds.length < 1 && !e.statementSkip,
  );
  const openRows = rows.filter(r => r.matchedExpenseIds.length < 1 && !r.skipped);

  const unitBuckets = groupBy(buildExpenseUnits(openExpenses), u => `${u.date}|${u.signedTotal}`);
  const rowBuckets = groupBy(
    openRows,
    r => `${effectiveStatementDate(r)}|${normalizeSum(r.amount)}`,
  );

  const suggestions: StatementMatchInput[] = [];
  for (const [key, bucketRows] of rowBuckets) {
    const bucketUnits = unitBuckets.get(key);
    if (bucketRows.length === 1 && bucketUnits?.length === 1) {
      suggestions.push({
        statementRowIds: [bucketRows[0].id],
        expenseIds: bucketUnits[0].expenseIds,
      });
    }
  }
  return suggestions;
}

function buildExpenseUnits(expenses: MatchableExpense[]): ExpenseUnit[] {
  const bySplit = groupBy(expenses, e => e.splitId ?? `single-${e.id}`);
  const units: ExpenseUnit[] = [];
  for (const parts of bySplit.values()) {
    // Parts of one split normally share the purchase date; if the user has
    // edited them to different dates there is no single date to match on.
    if (!parts.every(p => p.date === parts[0].date)) {
      continue;
    }
    units.push({
      date: parts[0].date,
      expenseIds: parts.map(p => p.id),
      signedTotal: parts
        .reduce((sum, e) => sum.plus(signedExpenseSum(e)), Money.from(0))
        .toString(),
    });
  }
  return units;
}

/**
 * The signed bank-statement amount an expense should correspond to:
 * expenses and transfers take money out of the account (negative), incomes
 * bring it in (positive).
 */
function signedExpenseSum(expense: MatchableExpense): string {
  const sum = Money.from(expense.sum);
  return normalizeSum((expense.type === 'income' ? sum : sum.negate()).toString());
}

/** Normalizes "-0.00" style values so signs compare consistently. */
function normalizeSum(sum: string): string {
  return Money.from(sum).toString();
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) {
      list.push(item);
    } else {
      map.set(k, [item]);
    }
  }
  return map;
}
