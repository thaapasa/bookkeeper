import { Validator } from '../util/Validator';
import Money, { MoneyLike } from '../../shared/util/Money';
import { negateDivision, splitByShares } from '../../shared/util/Splitter';
import { Expense, ExpenseDivisionItem, ExpenseDivisionType } from '../../shared/types/Expense';
import { Source } from '../../shared/types/Session';

interface ExpenseDivisionItemNoType {
  userId: number;
  sum: MoneyLike;
}

function divisionOfType(division: ExpenseDivisionItem[] | undefined, type: ExpenseDivisionType): ExpenseDivisionItem[] {
  return division ? division.filter(d => d.type === type) : [];
}

function validateDivision(items: ExpenseDivisionItem[], sum: MoneyLike, field: ExpenseDivisionType) {
  const calculated = items.map(i => Money.from(i.sum)).reduce((a, b) => a.plus(b), Money.zero);
  if (!Money.from(sum).equals(calculated)) {
    throw new Validator.InvalidInputError(field, calculated,
      `Division sum must match expense sum ${sum.toString()}, is ${calculated.toString()}`);
  }
  return items;
}

function getCostFromSource(sum: MoneyLike, source: Source): ExpenseDivisionItemNoType[] {
  return negateDivision(splitByShares(sum, source.users.map(u => ({ userId: u.userId, share: u.share }))));
}

function getDefaultIncome(expense: Expense): ExpenseDivisionItem[] {
  return [{ userId: expense.userId, sum: expense.sum, type: 'income' }];
}

function addType(type: ExpenseDivisionType) {
  return (item: ExpenseDivisionItemNoType): ExpenseDivisionItem => {
    return { ...item, type };
  };
}

export function determineDivision(expense: Expense, source: Source): ExpenseDivisionItem[] {
  if (expense.type === 'income') {
    const givenIncome = divisionOfType(expense.division, 'income');
    const givenSplit = divisionOfType(expense.division, 'split');
    const income = givenIncome.length > 0 ?
      validateDivision(givenIncome, expense.sum, 'income') :
      getDefaultIncome(expense);
    const split = givenSplit.length > 0 ?
      validateDivision(givenSplit, Money.from(expense.sum).negate(), 'split') :
      negateDivision(income);
    return income.map(addType('income')).concat(split.map(addType('split')));
  } else if (expense.type === 'expense') {
    const givenCost = divisionOfType(expense.division, 'cost');
    const givenBenefit = divisionOfType(expense.division, 'benefit');
    const cost = givenCost.length > 0 ?
      validateDivision(givenCost, Money.negate(expense.sum), 'cost') :
      getCostFromSource(expense.sum, source);
    const benefit = givenBenefit.length > 0 ?
      validateDivision(givenBenefit, expense.sum, 'benefit') :
      negateDivision(cost);
    return cost.map(addType('cost')).concat(benefit.map(addType('benefit')));
  } else if (expense.type === 'transfer') {
    const givenTransferor = divisionOfType(expense.division, 'transferor');
    const givenTransferee = divisionOfType(expense.division, 'transferee');
    const transferor = givenTransferor.length > 0 ?
      validateDivision(givenTransferor, Money.negate(expense.sum), 'transferor') :
      getCostFromSource(expense.sum, source);
    const transferee = givenTransferee.length > 0 ?
      validateDivision(givenTransferee, expense.sum, 'transferee') :
      negateDivision(transferor);
    return transferor.map(addType('transferor')).concat(transferee.map(addType('transferee')));
  } else {
    throw new Validator.InvalidInputError('type', expense.type,
      'Unrecognized expense type; expected expense, income, or transfer');
  }
}
