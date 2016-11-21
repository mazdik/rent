var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'vertrigo',
    database: 'citybp'
});

function save_post() {
    connection.connect();

    let link_exist = 0;
    connection.query('select count(*) AS count from tbl_parser_links t where t.link=?', ['ss'], function(err, rows, fields) {
        if (err) throw err;
        link_exist = rows[0].count;
        //console.log(rows[0].count + ' rows');
    }).on('end', function() {
        if (link_exist == 0) {
            let post = { id: 1, address: 'Hello MySQL' };
            let query = connection.query('INSERT INTO tbl_post SET ?', post, function(err, result) {
                if (err) throw err;

                console.log('inserted ' + result.affectedRows + ' rows');
            });
            console.log(query.sql);
        }
    });;

    connection.end();

}

save_post();
