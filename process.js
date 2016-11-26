var settings = require('./settings.json');
var logger = require('./logger');
var db = require('./mysql');
var im = require('./image');

module.exports = {

    preparePost: function(data) {

        let city_id = findValue(cities, settings.city);
        let oper_id = findValue(opers, settings.oper);

        let title = data.title;
        console.log(title);
        title = title.trim();

        let address = data.address;
        address = address.trim();

        let price = data.price;
        price = price.replace(/[^0-9]/g, '');

        let description = data.description
        description = description.trim();
        description = title + ' ' + description;

        let number = data.number;
        number = number.replace(/[^0-9]/g, '');
        //удалить 8 спереди
        number = number.substr(1);

        let breadcrumbs = data.breadcrumbs;

        let payment = 0;
        let type = 0;
        if (breadcrumbs.indexOf('На длительный срок') >= 0) {
            payment = 2;
        } else if (breadcrumbs.indexOf('Посуточно') >= 0) {
            payment = 1;
        } else if (breadcrumbs.indexOf('Вторичка') >= 0) {
            type = 1;
        } else if (breadcrumbs.indexOf('Новостройки') >= 0) {
            type = 2;
        }

        let square = title.match(/\d{2}/i)[0];
        let floor_temp = title.match(/\d{1,2}\/\d{1,2}/i)[0];
        let floor = floor_temp.substr(0, floor_temp.indexOf('/'));
        let floornum = floor_temp.substr(floor_temp.indexOf('/') + 1);

        let rooms = title.substr(0, 1);
        let category = getCategoryId(settings.category, rooms);

        let area_full = address.substr(0, address.indexOf(','));
        let area = area_full.substr(4); //удалить [р-н ]
        //TODO!
        //let area_id = getAreaByName(city_id, area);

        let time = new Date().getTime();

        let post = {
            alias: '123',
            city: city_id,
            oper: oper_id,
            realty: category,
            address: address,
            price: price,
            textobj: description,
            totalarea: square,
            phonenum: number,
            floor: floor,
            floornum: floornum,
            area_id: 123,
            status: settings.post_status,
            author_id: settings.post_user,
            payment: payment,
            type: type,
            count_images: 0,
            create_time: time,
            update_time: time
        };
        console.log(post);
        return post;
    },

    addContent: function(data) {
        let href = data.href;
        let images = data.images;
        let post = preparePost(data);

        db.isNotProcessed(href).then(function(value) {
            console.log(value);
            if (value) {
                db.savePost(post).then(function(post_id) {
                    //console.log(post_id);
                    for (let i = images.length - 1; i >= 0; i--) {
                        db.saveImagePosts(post_id, images[i]);
                    }
                    db.saveLink(post_id, href);
                }, function(error) {
                    console.log(error);
                });
            }
        }, function(error) {
            console.log(error);
        });
    }

}

let cities = {
    '3345': 'ufa',
    '4400': 'moskva',
    '4962': 'sankt-peterburg',
    '3472': 'volgograd',
    '5106': 'ekaterinburg',
    '5269': 'kazan',
    '4079': 'krasnodar',
    '3612': 'nizhniy_novgorod',
    '4720': 'perm',
    '4848': 'rostov-na-donu',
    '4917': 'samara',
    '5539': 'chelyabinsk',
    '5646': 'yaroslavl',
    '4036': 'kostroma',
    ///////
    '5545': 'groznyy',
    '5647': 'avtury',
    '5544': 'argun',
    '5652': 'achhoy-martan',
    '5546': 'gudermes',
    '5651': 'kurchaloy',
    '5650': 'mesker-yurt',
    '5649': 'oyshara',
    '5648': 'starye_atagi',
    '5553': 'urus-martan',
    '5554': 'shali',
};

let opers = {
    '4': 'sdam',
    '2': 'prodam',
};

function getCategoryId(category, rooms = null) {
    category_id = 1;
    if (category == 'kvartiry') {
        if (rooms) {
            if (rooms == '2') {
                category_id = 2;
            } else if (rooms == '3') {
                category_id = 3;
            } else if (rooms == '4') {
                category_id = 4;
            }
        }
    } else if (category == 'komnaty') {
        category_id = 6;
    } else if (category == 'doma_dachi_kottedzhi') {
        category_id = 7;
    }
    return category_id;
}

function findValue(o, value) {
    for (let prop in o) {
        if (o.hasOwnProperty(prop) && o[prop] === value) {
            return prop;
        }
    }
    return null;
}
