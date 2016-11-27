var express = require('express');
var app = express();


//var bodyParser = require('body-parser');
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));

//var router = express.Router();

//app.use(router);
app.use(express.static('public'));

app.all('/', function (req, res, next) {
    console.log('Someone made a request!');
    next();
});

const users = ["Anu", "Tuukka"];
const expenses = [{id:1, user: "Anu", amount: 100}, {id: 2, user: "Tuukka", amount: 50}, {id: 3, user: "Anu", amount: 1000 }];

app.get('/api/isalive', function (req, res) {
    console.log("isalive");
    res.send('OK')
});

app.get('/api/users', function (req, res) {
    console.log("GET users");
    res.json(users );
});

app.get('/api/expense/list', function (req, res) {
    console.log("GET expense/list");
    res.json(expenses);
});

app.put('/api/expense', function (req, res) {
    //req.query.amount
    console.log("PUT expense")
    //console.log("amount: " + amount);
    res.end('post OK')
});


app.listen(3000, function () {
    console.log('Tilinpito app listening on port 3000!')
});
