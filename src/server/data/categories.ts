"use strict";

const db = require("./db");
const errors = require("../util/errors");
import Money from "../../shared/util/money";

function createCategoryObject(categories) {
    const res: any[] = [];
    const subs = {};
    console.log(categories);
    categories.forEach(c => {
        if (c.parentId === null) {
            c.children = [];
            subs[c.id] = c;
            res.push(c);
        } else {
            subs[c.parentId].children.push(c);
        }
    });
    return res;
}

function sumChildTotalsToParent(categoryTable) {
    categoryTable.forEach(c => {
        console.log("summing childs of ", c.id);
        if (c.parentId === null) {
            let expenseSum = Money.from(c.expenses);
            let incomeSum = Money.from(c.income);
            c.children.forEach(ch => {
                expenseSum = expenseSum.plus(ch.expenses);
                incomeSum = incomeSum.plus(ch.income);
            });
            c.totalExpenses = expenseSum.toString();
            c.totalIncome = incomeSum.toString();
        }
    });
    return categoryTable;
}

function getAll(tx) {
    return (groupId) => tx.queryList("categories.get_all", "SELECT id, parent_id, name FROM categories WHERE group_id=$1::INTEGER " +
        "ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name", [ groupId ])
        .then(createCategoryObject);
}

function getTotals(tx) {
    return (groupId, params) => {
        return tx.queryList("categories.get_totals", "SELECT categories.id, categories.parent_id, " +
                "SUM(CASE WHEN type='expense' AND template=false AND date >= $2::DATE AND date < $3::DATE THEN sum::NUMERIC ELSE 0::NUMERIC END) AS expenses, " +
                "SUM(CASE WHEN type='income' AND template=false AND date >= $2::DATE AND date < $3::DATE THEN sum::NUMERIC ELSE 0::NUMERIC END) AS income FROM categories " +
            "LEFT JOIN expenses ON categories.id=category_id WHERE expenses.id IS NULL OR expenses.group_id=$1::INTEGER " +
            "GROUP BY categories.id, categories.parent_id " +
            "ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name",
            [ groupId, params.startDate, params.endDate ])
        .then(createCategoryObject)
        .then(sumChildTotalsToParent);
     }
}

function create(tx) {
    return (groupId, data) => tx.insert("categories.create", "INSERT INTO categories (group_id, parent_id, name) "+
        "VALUES ($1::INTEGER, $2::INTEGER, $3) RETURNING id", [ groupId, data.parentId || null, data.name ]);
}

function getById(tx) {
    return (groupId, id) => tx.queryObject("categories.get_by_id",
        "SELECT id, parent_id, name FROM categories WHERE id=$1::INTEGER AND group_id=$2::INTEGER ",
        [ id, groupId ])
        .then(errors.undefinedToError(errors.NotFoundError, "CATEGORY_NOT_FOUND", "category"));
}

function update(groupId, categoryId, data) {
    return db.transaction(tx => getById(tx)(groupId, categoryId)
            .then(errors.undefinedToError(errors.NotFoundError, "CATEGORY_NOT_FOUND", "category"))
            .then(x => tx.update("categories.update",
                "UPDATE categories SET parent_id=$1::INTEGER, name=$2 WHERE id=$3::INTEGER AND group_id=$4::INTEGER",
                [data.parentId || null, data.name, categoryId, groupId]))
            .then(x => ({ id: categoryId, parentId: data.parentId || null, name: data.name })), false);
}

module.exports = {
    getAll: getAll(db),
    getTotals: getTotals(db),
    getById: getById(db),
    create: create(db),
    update: update,
    tx: {
        getAll: getAll,
        getById: getById
    }
};
