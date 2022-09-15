import {
  ExpenseDivisionItem,
  ExpenseDivisionType,
  ExpenseInput,
  negateDivision,
  splitByShares,
} from 'shared/expense';
import { InvalidInputError } from 'shared/types/Errors';
import { Source } from 'shared/types/Session';
import Money, { MoneyLike } from 'shared/util/Money';

interface ExpenseDivisionItemNoType {
  userId: number;
  sum: MoneyLike;
}

function divisionOfType(
  division: ExpenseDivisionItem[] | undefined,
  type: ExpenseDivisionType
): ExpenseDivisionItem[] {
  return division ? division.filter(d => d.type === type) : [];
}

function validateDivision(
  items: ExpenseDivisionItem[],
  sum: MoneyLike,
  field: ExpenseDivisionType
) {
  const calculated = items.reduce((a, b) => a.plus(b.sum), Money.zero);
  if (!Money.from(sum).equals(calculated)) {
    throw new InvalidInputError(
      'INVALID_INPUT',
      `${field} Division sum must match expense sum ${sum.toString()}, is ${calculated.toString()}`
    );
  }
  return items;
}

function getCostFromSource(
  sum: MoneyLike,
  source: Source
): ExpenseDivisionItemNoType[] {
  return negateDivision(
    splitByShares(
      sum,
      source.users.map(u => ({ userId: u.userId, share: u.share }))
    )
  );
}

function getDefaultIncome(expense: ExpenseInput): ExpenseDivisionItem[] {
  return [{ userId: expense.userId, sum: expense.sum, type: 'income' }];
}

function addType(type: ExpenseDivisionType) {
  return (item: ExpenseDivisionItemNoType): ExpenseDivisionItem => {
    return { ...item, type };
  };
}

export function determineDivision(
  expense: ExpenseInput,
  source: Source
): ExpenseDivisionItem[] {
  if (expense.type === 'income') {
    const givenIncome = divisionOfType(expense.division, 'income');
    const givenSplit = divisionOfType(expense.division, 'split');
    const income =
      givenIncome.length > 0
        ? validateDivision(givenIncome, expense.sum, 'income')
        : getDefaultIncome(expense);
    const split =
      givenSplit.length > 0
        ? validateDivision(
            givenSplit,
            Money.from(expense.sum).negate(),
            'split'
          )
        : negateDivision(income);
    return income.map(addType('income')).concat(split.map(addType('split')));
  } else if (expense.type === 'expense') {
    const givenCost = divisionOfType(expense.division, 'cost');
    const givenBenefit = divisionOfType(expense.division, 'benefit');
    const cost =
      givenCost.length > 0
        ? validateDivision(givenCost, Money.negate(expense.sum), 'cost')
        : getCostFromSource(expense.sum, source);
    const benefit =
      givenBenefit.length > 0
        ? validateDivision(givenBenefit, expense.sum, 'benefit')
        : negateDivision(cost);
    return cost.map(addType('cost')).concat(benefit.map(addType('benefit')));
  } else if (expense.type === 'transfer') {
    const givenTransferor = divisionOfType(expense.division, 'transferor');
    const givenTransferee = divisionOfType(expense.division, 'transferee');
    const transferor =
      givenTransferor.length > 0
        ? validateDivision(
            givenTransferor,
            Money.negate(expense.sum),
            'transferor'
          )
        : getCostFromSource(expense.sum, source);
    const transferee =
      givenTransferee.length > 0
        ? validateDivision(givenTransferee, expense.sum, 'transferee')
        : negateDivision(transferor);
    return transferor
      .map(addType('transferor'))
      .concat(transferee.map(addType('transferee')));
  } else {
    throw new InvalidInputError(
      'INVALID_INPUT',
      `Unrecognized expense ${expense.type}`
    );
  }
}
