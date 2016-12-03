

class BookkeeperDB {

    constructor() {
        this.host = 'localhost';
        this.dbuser = 'bookkeeper';
        this.password = 'kakkuloskakahvit';
        this.database = 'bokkkeeper';

    }


    try {
        var mysql = require('mysql');
        var connection = mysql.createConnection({
            host: 'localhost',
            user: 'bookkeeper',
            password: 'kakkuloskakahvit',
            database: 'bookkeeper'
        });

        connection.connect();

        connection.query('SELECT email from users;', function (err, rows, fields) {
            if (err) console.log(err);
            else rows.forEach(r => console.log('User: ', r.email));
        });

        connection.end();
    } catch (er) {
        console.log(er);
    }

}

const db = new BookkeeperDB();

export default db;
