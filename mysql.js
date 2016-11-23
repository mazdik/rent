var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: 20,
    host: 'localhost',
    user: 'root',
    password: 'vertrigo',
    database: 'citybp'
});

module.exports = {

    isNotProcessed: function(href) {
        let result = true;
        return new Promise(function(resolve, reject) {
            return pool.getConnection(function(err, connection) {
                connection.query('select count(*) AS count from tbl_parser_links t where t.link=?', [href], function(err, rows, fields) {
                    if (err) return reject(err);
                    connection.release();
                    result = (rows[0].count == 0) ? true : false;
                    resolve(result);
                })
            });
        });
    },

    save_post: function(post) {
        return new Promise(function(resolve, reject) {
            return pool.getConnection(function(err, connection) {
                connection.query('INSERT INTO tbl_post SET ?', post, function(err, result) {
                    if (err) return reject(err);
                    connection.release();
                    resolve('inserted ' + result.affectedRows + ' rows');
                });
                //console.log(query.sql);
            });
        });
    },

    save_post2: function(href, post) {
        pool.getConnection(function(err, connection) {
            let link_exist = 0;
            connection.query('select count(*) AS count from tbl_parser_links t where t.link=?', [href], function(err, rows, fields) {
                if (err) throw err;
                link_exist = rows[0].count;
                //console.log(rows[0].count + ' rows');
                connection.release();
            }).on('end', function() {
                if (link_exist == 0) {
                    let query = connection.query('INSERT INTO tbl_post SET ?', post, function(err, result) {
                        if (err) throw err;
                        connection.release();
                        console.log('inserted ' + result.affectedRows + ' rows');
                    });
                    //console.log(query.sql);
                }
            });
        });
    },

    disconnect: function() {
        pool.getConnection(function(err, connection) {
            pool.end(function(err) {
                // all connections in the pool have ended
            });
        });
    }

}
