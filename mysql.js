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

    savePost: function(post) {
        return new Promise(function(resolve, reject) {
            return pool.getConnection(function(err, connection) {
                connection.query('INSERT INTO tbl_post SET ?', post, function(err, result) {
                    if (err) return reject(err);
                    connection.release();
                    console.log('inserted ' + result.affectedRows + ' rows');
                    resolve(result.insertId);
                });
                //console.log(query.sql);
            });
        });
    },

    savePost2: function(href, post) {
        return new Promise(function(resolve, reject) {
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
                            console.log('post inserted ' + result.affectedRows + ' rows');
                            resolve(result.insertId);
                        });
                        //console.log(query.sql);
                    }
                });
            });
        });
    },

    saveLink: function(post_id, href) {
        return new Promise(function(resolve, reject) {
            pool.getConnection(function(err, connection) {
                connection.query('INSERT INTO tbl_parser_links SET ?', { link: href, post_id: post_id }, function(err, result) {
                    if (err) return reject(err);
                    connection.release();
                    console.log('link inserted ' + result.affectedRows + ' rows');
                    resolve(result.insertId);
                });
            });
        });
    },

    saveImagePosts: function(post_id, image) {
        return new Promise(function(resolve, reject) {
            pool.getConnection(function(err, connection) {
                connection.query('INSERT INTO tbl_post_images SET ?', { product_id: post_id, title: image, filename: image }, function(err, result) {
                    if (err) return reject(err);
                    connection.release();
                    console.log('image inserted ' + result.affectedRows + ' rows');
                    resolve(result.insertId);
                });
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
