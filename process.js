var settings = require('./settings.json');
var logger = require('./logger');
var db = require('./mysql');
var im = require('./image');

module.exports = {

    preparePost: function(title, address, price, textobj, phone, payment, type) {

    },

    addContent: function(href, title, address, price, textobj, phone, payment, type, images) {

        post = preparePost(title, address, price, textobj, phone, payment, type);

        db.isNotProcessed(href).then(function(value) {
            console.log(value);
            if (value) {
                db.savePost(post).then(function(post_id) {
                    //console.log(post_id);
                    for (var i = images.length - 1; i >= 0; i--) {
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

let cityIds = {
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

function findValue(o, value) {
    for (var prop in o) {
        if (o.hasOwnProperty(prop) && o[prop] === value) {
            return prop;
        }
    }
    return null;
}

console.log(findValue(cityIds, 'ufa'));
