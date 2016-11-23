var db = require('./mysql');

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

/*db.isNotProcessed('sss').then(function(rows) {
    console.log(rows);
}, function(error) {
    console.log(error);
});

for (var i = 10 - 1; i >= 0; i--) {
    db.save_post(post).then(function(rows) {
        console.log(rows);
    }, function(error) {
        console.log(error);
    });
}*/

for (var i = 10 - 1; i >= 0; i--) {
    db.isNotProcessed('ss').then(function(value) {
        console.log(value);
        if (value) {
            db.save_post(post).then(function(rows) {
                console.log(rows);
            }, function(error) {
                console.log(error);
            });
        }
    }, function(error) {
        console.log(error);
    });
}

for (var i = 10 - 1; i >= 0; i--) {
    db.save_post2('sss', post);
}


//db.disconnect();
