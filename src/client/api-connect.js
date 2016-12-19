"use strict";

import BookkeeperPage from "./ui/page";
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

function defaultErrorHandler(er) {
    console.log("Error in api-connect:", er);
}


module.exports = {login : login };
