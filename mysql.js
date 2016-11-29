var mysql = require('mysql');
var settings = require('./settings.json');
var logger = require('./logger');

var pool = mysql.createPool({
    connectionLimit: settings.db_connlimit,
    host: settings.db_host,
    user: settings.db_user,
    password: settings.db_password,
    database: settings.db_database,
    charset : 'utf8mb4'
});

module.exports = {

    isNotProcessed: function(href) {
        let result = true;
        return new Promise(function(resolve, reject) {
            return pool.getConnection(function(err, connection) {
                if (err) return reject(err);
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
                if (err) return reject(err);
                connection.query('INSERT INTO tbl_post SET ?', post, function(err, result) {
                    if (err) return reject(err);
                    connection.release();
                    logger.debug('post inserted ' + result.affectedRows + ' rows');
                    resolve(result.insertId);
                });
                //logger.debug(query.sql);
            });
        });
    },

    savePost2: function(href, post) {
        return new Promise(function(resolve, reject) {
            return pool.getConnection(function(err, connection) {
                if (err) return reject(err);
                let link_exist = 0;
                connection.query('select count(*) AS count from tbl_parser_links t where t.link=?', [href], function(err, rows, fields) {
                    if (err) return reject(err);
                    link_exist = rows[0].count;
                    //logger.debug(rows[0].count + ' rows');
                    connection.release();
                }).on('end', function() {
                    if (link_exist == 0) {
                        let query = connection.query('INSERT INTO tbl_post SET ?', post, function(err, result) {
                            if (err) return reject(err);
                            connection.release();
                            logger.debug('post inserted ' + result.affectedRows + ' rows');
                            resolve(result.insertId);
                        });
                        //logger.debug(query.sql);
                    }
                });
            });
        });
    },

    saveLink: function(post_id, href) {
        return new Promise(function(resolve, reject) {
            return pool.getConnection(function(err, connection) {
                if (err) return reject(err);
                connection.query('INSERT INTO tbl_parser_links SET ?', { link: href, post_id: post_id }, function(err, result) {
                    if (err) return reject(err);
                    connection.release();
                    logger.debug('link inserted ' + result.affectedRows + ' rows');
                    resolve(result.insertId);
                });
            });
        });
    },

    saveImagePosts: function(post_id, image) {
        return new Promise(function(resolve, reject) {
            return pool.getConnection(function(err, connection) {
                if (err) return reject(err);
                connection.query('INSERT INTO tbl_post_images SET ?', { product_id: post_id, title: image, filename: image }, function(err, result) {
                    if (err) return reject(err);
                    connection.release();
                    logger.debug('image inserted ' + result.affectedRows + ' rows');
                    resolve(result.insertId);
                });
            });
        });
    },

    getAreaIdByName: function(city_id, area_name) {
        let result;
        return new Promise(function(resolve, reject) {
            return pool.getConnection(function(err, connection) {
                if (err) return reject(err);
                connection.query('select id from tbl_area t where t.city_id=? and t.name=?', [city_id, area_name], function(err, rows, fields) {
                    if (err) return reject(err);
                    connection.release();
                    result = (rows[0]) ? rows[0].id : null;
                    resolve(result);
                })
            });
        });
    },

    disconnect: function() {
        return pool.getConnection(function(err, connection) {
            pool.end(function(err) {
                // all connections in the pool have ended
            });
        });
    }

}
