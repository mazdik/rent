var db = require('./mysql');

db.isNotProcessed('sss').then(function(rows) {
    console.log(rows);
}, function(error) {
    console.log(error);
});

for (var i = 10 - 1; i >= 0; i--) {
    db.save_post().then(function(rows) {
        console.log(rows);
    }, function(error) {
        console.log(error);
    });
}

for (var i = 10 - 1; i >= 0; i--) {
    db.isNotProcessed('sss').then(function(rows) {
        console.log(rows);
    }, function(error) {
        console.log(error);
    });
}


db.disconnect();
