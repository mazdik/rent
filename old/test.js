const db = require('./mysql');
const im = require('./image');
const path = require('path');

var capabilities = {
    browserName: 'chrome',
    'goog:chromeOptions': {
        args: [
            'headless',
            'disable-gpu',
            'disable-extensions'
        ],
        mobileEmulation: {
            deviceName: 'Pixel 2'
        }
    }
};

let post = {
    alias: '123',
    city: 123,
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
    db.savePost(post).then(function(rows) {
        console.log(rows);
    }, function(error) {
        console.log(error);
    });
}*/

/*for (var i = 10 - 1; i >= 0; i--) {
    db.isNotProcessed('ss').then(function(value) {
        console.log(value);
        if (value) {
            db.savePost(post).then(function(post_id) {
                //console.log(post_id);
                db.saveImagePosts(post_id, 'sss');
                db.saveLink(post_id, 'ddd');
            }, function(error) {
                console.log(error);
            });
        }
    }, function(error) {
        console.log(error);
    });
}

for (var i = 10 - 1; i >= 0; i--) {
    db.savePost2('sss', post);
}*/

db.getAreaIdByName(3345, 'Советский').then(function(rows) {
    console.log('AreaId: ' + rows);
}, function(error) {
    console.log(error);
});

/*let url = 'https://ru.wikipedia.org/static/images/project-logos/ruwiki.png';
im.saveImage(url).then(function(saved_file_name) {
    console.log('saved_file_name: ' + saved_file_name);
});
*/

//db.disconnect();
