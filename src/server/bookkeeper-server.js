var express = require('express');
var app = express();


var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var router = express.Router();

app.use(router);
app.use(express.static('public'));

router.all('/', function (req, res, next) {
    console.log('Someone made a request!');
    next();
});

router.get('/api/isalive', function (req, res) {
    res.send('OK')
});

router.post('/api/store_expense', function (req, res) {
    //req.query.amount
    console.log("post on store_expends")
    //console.log("amount: " + amount);
    res.end('post OK')
});

// POST method route
router.post('/api/test', function (req, res) {
    console.log("test");
    res.end('POST request to the homepag')
});


app.listen(3000, function () {
    console.log('Tilinpito app listening on port 3000!')
});
