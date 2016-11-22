var mysql = require('mysql');

var connectionPromise = new Promise(function(resolve, reject) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'vertrigo',
        database: 'citybp'
    });
    connection.connect(function(err) {
        if (err) {
            console.error(err);
            reject(err);
        } else {
            resolve(connection);
        }
    });

});

module.exports = {

    isNotProcessed: function(href) {
        return connectionPromise.then(function(connection) {
            return new Promise(function(resolve, reject) {
                connection.query('select count(*) AS count from tbl_parser_links t where t.link=?', [href], function(err, rows, fields) {
                    if (err) return reject(err);

                    resolve(rows[0].count);
                });
            });
        });
    },

    save_post: function() {
        let post = {
            alias: '123',
            oper: 123,
            realty: 123,
            address: 'Hello MySQL',
            price: 123,
            textobj: '',
            totalarea: 123,
            phonenum: 123,
            floor: 123,
            floornum: 123,
            area_id: 123,
            status: 123,
            author_id: 123,
            payment: 123,
            type: 123,
            count_images: 123,
            create_time: 123,
            update_time: 123
        };
        return connectionPromise.then(function(connection) {
            return new Promise(function(resolve, reject) {
                isNotProcessed('sss').then(function(rows) {
                        if (rows == 0) {
                            let query = connection.query('INSERT INTO tbl_post SET ?', post, function(err, result) {
                                if (err) throw err;

                                console.log('inserted ' + result.affectedRows + ' rows');
                                resolve();
                            });
                            //console.log(query.sql);
                        }
                    },
                    function(error) {
                        if (err) return reject(err);
                    });
            });
        });
    },

    disconnect: function() {
        return connectionPromise.then(function(connection) {
            connection.end(function(err) {
                console.error('error:' + err);
            });
            //connectionPromise = Promise.reject('database has been disconnected');
        });
    }

}
