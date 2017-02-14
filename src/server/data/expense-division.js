"use strict";

const validator = require("../util/validator");
const Money = require("../../shared/util/money");
const splitter = require("../../shared/util/splitter");

module.exports = {};

function divisionOfType(division, type) {
    return division ? division.filter(d => d.type === type) : [];
}

function validateDivision(items, sum, field) {
    const calculated = items.map(i => i.sum).reduce((a, b) => a.plus(b), Money.zero);
    if (!sum.equals(calculated)) throw new validator.InvalidInputError(field, calculated,
        `Division sum must match expense sum ${sum.toString()}, is ${calculated.toString()}`);
    return items;
}

function getCostFromSource(sum, source) {
    return splitter.negateDivision(splitter.splitByShares(sum, source.users.map(u => ({ userId: u.userId, share: u.share }))));
}

function getDefaultIncome(expense) {
    return [{ userId: expense.userId, sum: expense.sum, type: "income" }];
}

function addType(type) {
    return (item) => {
        item.type = type;
        return item;
    };
}

module.exports.determineDivision = function determineDivision(expense, source) {
    if (expense.type == "income") {
        const givenIncome = divisionOfType(expense.division, "income");
        const givenSplit = divisionOfType(expense.division, "split");
        const income = givenIncome.length > 0 ?
            validateDivision(givenIncome, expense.sum, "income") :
            getDefaultIncome(expense);
        const split = givenSplit.length > 0 ?
            validateDivision(givenSplit, expense.sum.negate(), "split") :
            splitter.negateDivision(income);
        return income.map(addType("income")).concat(split.map(addType("split")));
    } else if (expense.type == "expense") {
        const givenCost = divisionOfType(expense.division, "cost");
        const givenBenefit = divisionOfType(expense.division, "benefit");
        const cost = givenCost.length > 0 ?
            validateDivision(givenCost, expense.sum.negate(), "cost") :
            getCostFromSource(expense.sum, source);
        const benefit = givenBenefit.length > 0 ?
            validateDivision(givenBenefit, expense.sum, "benefit") :
            splitter.negateDivision(cost);
        return cost.map(addType("cost")).concat(benefit.map(addType("benefit")));
    } else throw new validator.InvalidInputError("type", expense.type, "Unrecognized expense type; expected expense or income");
}


