"use strict";

import BookkeeperPage from "../ui/page";
import Promise from "bluebird";
const request = Promise.promisifyAll(require("superagent"));

function login(username, password) {
    const url = 'http://localhost:3000/api/session';

    return request.put(url)
        .set('Content-Type', 'application/json')
        .send({username: username, password: password})
        .endAsync()
        .then(req => req.body)
        .catch(defaultErrorHandler);
}

function getSession(token) {
    const url = 'http://localhost:3000/api/session';

    return request.get(url)
        .set('Authorization', 'Bearer ' + token)
        .endAsync()
        .then(req => req.body)
        .catch(defaultErrorHandler);
}

function getExpenses(token, group, year, month) {
    const url = 'http://localhost:3000/api/expense/month';

    return request.get(url)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .query({year : year, month : month, groupId: group})
        .endAsync()
        .then(req => req.body)
        .catch(defaultErrorHandler);
}

function storeExpense(token, group, expense) {
    const url = 'http://localhost:3000/api/expense';

    return request.put(url)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .query({groupId : group})
        .send(expense)
        .endAsync()
        .then(req => req.body)
        .catch(defaultErrorHandler);
}


function defaultErrorHandler(er) {
    console.log("Error in api-connect:", er);
    throw er;
}


module.exports = {login : login, getSession : getSession, getExpenses : getExpenses, storeExpense : storeExpense };
