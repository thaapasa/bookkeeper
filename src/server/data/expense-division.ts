import { Validator } from '../util/validator';
import Money, { MoneyLike } from '../../shared/util/money';
import * as splitter from '../../shared/util/splitter';
import { Expense, ExpenseDivisionItem, ExpenseDivisionType } from '../../shared/types/expense';
import { Source } from '../../shared/types/session';
import { Map } from '../../shared/util/util';
import { negateDivision } from '../../shared/util/splitter';

interface ExpenseDivisionItemNoType {
    userId: number;
    sum: MoneyLike;
}

function divisionOfType(division: ExpenseDivisionItem[] | undefined, type: ExpenseDivisionType): ExpenseDivisionItem[] {
    return division ? division.filter(d => d.type === type) : [];
}

function validateDivision(items: ExpenseDivisionItem[], sum: MoneyLike, field) {
    const calculated = items.map(i => Money.from(i.sum)).reduce((a, b) => a.plus(b), Money.zero);
    if (!Money.from(sum).equals(calculated)) throw new Validator.InvalidInputError(field, calculated,
        `Division sum must match expense sum ${sum.toString()}, is ${calculated.toString()}`);
    return items;
}

function getCostFromSource(sum: MoneyLike, source: Source): ExpenseDivisionItemNoType[] {
    return negateDivision(splitter.splitByShares(sum, source.users.map(u => ({ userId: u.userId, share: u.share }))));
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
    if (expense.type == 'income') {
        const givenIncome = divisionOfType(expense.division, 'income');
        const givenSplit = divisionOfType(expense.division, 'split');
        const income = givenIncome.length > 0 ?
            validateDivision(givenIncome, expense.sum, 'income') :
            getDefaultIncome(expense);
        const split = givenSplit.length > 0 ?
            validateDivision(givenSplit, Money.from(expense.sum).negate(), 'split') :
            negateDivision(income);
        return income.map(addType('income')).concat(split.map(addType('split')));
    } else if (expense.type == 'expense') {
        const givenCost = divisionOfType(expense.division, 'cost');
        const givenBenefit = divisionOfType(expense.division, 'benefit');
        const cost = givenCost.length > 0 ?
            validateDivision(givenCost, Money.negate(expense.sum), 'cost') :
            getCostFromSource(expense.sum, source);
        const benefit = givenBenefit.length > 0 ?
            validateDivision(givenBenefit, expense.sum, 'benefit') :
            negateDivision(cost);
        return cost.map(addType('cost')).concat(benefit.map(addType('benefit')));
    } else throw new Validator.InvalidInputError('type', expense.type, 'Unrecognized expense type; expected expense or income');
}
