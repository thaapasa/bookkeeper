"use strict";

import request from "superagent";

function login(username, password, callback) {
    const url = 'http://localhost:3000/api/session';

    request.put(url)
        .set('Content-Type', 'application/json')
        .send({username : username, password: password})
        .end((err, res) => console.log("token: ", res.body.token))
}

module.exports = {login : login };
