import users from './data/users';
import * as moment from 'moment';
import sessions from './data/sessions';
import expenses from './data/expenses';
import categories from './data/categories';
import sources from './data/sources';
import { config } from './config';
import * as server from './util/server-util';
import { Validator as V } from './util/validator';

export function registerAPI(app) {

    // GET /api/status
    app.get('/api/status', server.processUnauthorizedRequest(req => Promise.resolve({
        status: 'OK',
        timestamp: moment().format(),
        version: config.version,
        revision: config.revision,
        environment: config.environment
    })));


    // PUT /api/session
    app.put('/api/session', server.processUnauthorizedRequest(req =>
        sessions.login(req.body.username, req.body.password, req.query.groupId)
            .then(sessions.appendInfo)));
    app.put('/api/session/refresh', server.processUnauthorizedRequest(req =>
        sessions.refresh(server.getToken(req), req.query.groupId)
            .then(sessions.appendInfo)));

    // GET /api/session
    app.get('/api/session', server.processRequest(sessions.appendInfo));
    app.get('/api/session/bare', server.processRequest(x => x));

    // DELETE /api/session
    app.delete('/api/session', server.processRequest(session =>
        sessions.logout(session)));

    // GET /api/session/groups
    app.get('/api/session/groups', server.processRequest(session =>
        users.getGroups(session.user.id)));


    // GET /api/user/list
    app.get('/api/user/list', server.processRequest((session, req) =>
        users.getAll(session.group.id), true));

    // GET /api/user/[userid]
    const userPath = /\/api\/user\/([0-9]+)/;
    app.get('/api/user/:id', server.processRequest((session, req) =>
        users.getById(session.group.id, parseInt(req.params.id, 10)), true));



    // GET /api/category/list
    app.get("/api/category/list", server.processRequest(session =>
        categories.getAll(session.group.id), true));

    // PUT /api/category
    const categorySchema = {
        name: V.stringWithLength(1, 255),
        parentId: V.nonNegativeInt
    };
    app.put("/api/category", server.processRequest((session, req) =>
        categories.create(session.group.id, V.validate(categorySchema, req.body))
            .then(id => ({ status: "OK", message: "Category created", categoryId: id }), true)));

    // POST /api/category/categoryId
    app.post('/api/category/:id', server.processRequest((session, req) =>
        categories.update(session.group.id, parseInt(req.params.id, 10), V.validate(categorySchema, req.body)), true));

    // GET /api/category/categoryId
    app.get('/api/category/:id', server.processRequest((session, req) =>
        categories.getById(session.group.id, parseInt(req.params.id, 10)), true));

    const dateSchema = {
        startDate: V.date,
        endDate: V.date
    };
    // GET /api/category/totals
    app.get('/api/category/totals', server.processRequest((session, req) => {
        const params = V.validate(dateSchema, req.query);
        return categories.getTotals(session.group.id, params);
    }, true));

    // GET /api/source/list
    app.get('/api/source/list', server.processRequest(session =>
        sources.getAll(session.group.id), true));
    // GET /api/source/:id
    app.get('/api/source/:id', server.processRequest((session, req) =>
        sources.getById(session.group.id, parseInt(req.params.id, 10)), true));


    // GET /api/expense/list
    app.get('/api/expense/list', server.processRequest(session =>
        expenses.getAll(session.group.id, session.user.id), true));

    // GET /api/expense/month
    const monthSchema = {
        year: V.intBetween(1500, 3000),
        month: V.intBetween(1, 12)
    };
    app.get('/api/expense/month', server.processRequest((session, req) => {
        const params = V.validate(monthSchema, { year: req.query.year, month: req.query.month });
        return expenses.getByMonth(session.group.id, session.user.id, params.year, params.month);
    }, true));

    const searchSchema = {
        startDate: V.date,
        endDate: V.date,
        categoryId: V.optional(V.positiveInt)
    };
    app.get('/api/expense/search', server.processRequest((session, req) => {
        const params = V.validate(searchSchema, req.query);
        return expenses.search(session.group.id, session.user.id, params);
    }, true));

    // PUT /api/expense
    const expenseSchema = {
        userId: V.positiveInt,
        date: V.date,
        receiver: V.stringWithLength(1, 50),
        type: V.either('expense', 'income'),
        sum: V.money,
        title: V.stringWithLength(1, 255),
        description: V.optional(V.or(V.string, V.null)),
        confirmed: V.optional(V.boolean),
        sourceId: V.optional(V.positiveInt),
        categoryId: V.positiveInt,
        division: V.optional(V.listOfObjects({ userId: V.positiveInt, sum: V.money, type: V.stringWithLength(1, 10) }))
    };
    app.put('/api/expense', server.processRequest((session, req) =>
        expenses.create(session.user.id, session.group.id, V.validate(expenseSchema, req.body), session.group.defaultSourceId), true));

    // POST /api/expense/[expenseId]
    app.post('/api/expense/:id', server.processRequest((session, req) =>
        expenses.update(session.group.id, session.user.id, parseInt(req.params.id, 10), V.validate(expenseSchema, req.body),
            session.group.defaultSourceId), true));

    // GET /api/expense/[expenseId]
    app.get('/api/expense/:id', server.processRequest((session, req) =>
        expenses.getById(session.group.id, session.user.id, parseInt(req.params.id, 10))
            .then(e => expenses.getDivision(e.id).then(division => Object.assign(e, { division: division }))), true));

    // DELETE /api/expense/[expenseId]
    app.delete('/api/expense/:id', server.processRequest((session, req) =>
        expenses.deleteById(session.group.id, parseInt(req.params.id, 10)), true));

    // GET /api/expense/receivers?receiver=[query]
    app.get('/api/expense/receivers', server.processRequest((session, req) =>
        expenses.queryReceivers(session.group.id, V.validate({ receiver: V.stringWithLength(3, 50) }, req.query).receiver)
            .then(l => l.map(r => r.receiver)), true));


    const recurringExpenseSchema = {
        period: V.either('monthly', 'yearly'),
        occursUntil: V.optional(V.date)
    };

    // PUT /api/expense/recurring/[expenseId]
    app.put('/api/expense/recurring/:id', server.processRequest((session, req) =>
        expenses.createRecurring(session.group.id, session.user.id, parseInt(req.params.id, 10),
            V.validate(recurringExpenseSchema, req.body)), true));

}
