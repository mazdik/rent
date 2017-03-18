var settings = require('./settings.json');
var logger = require('./logger');
var db = require('./mysql');
var im = require('./image');

module.exports = {

    preparePost: function(data) {
        return new Promise(function(resolve, reject) {

            let city_id = findValue(cities, settings.city);
            let oper_id = findValue(opers, settings.oper);

            let title = data.title || '';
            title = title.trim();

            let address = data.address || '';
            address = address.trim();

            let price = data.price;
            price = price.replace(/[^0-9]/g, '');

            let description = data.description || '';
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

            let square = title.match(/\d{2}/i);
            square = (square) ? square[0] : null;

            let floor_temp = title.match(/\d{1,2}\/\d{1,2}/i);
            let floor = 0;
            let floornum = 0;
            if(floor_temp) {
                floor_temp = floor_temp[0];
                floor = floor_temp.substr(0, floor_temp.indexOf('/'));
                floornum = floor_temp.substr(floor_temp.indexOf('/') + 1);
            }

            let rooms = title.substr(0, 1);
            let category = getCategoryId(settings.category, rooms);

            let area_full = address.substr(0, address.indexOf(','));
            let area = area_full.substr(4); //удалить [р-н ]

            let time = Math.floor(new Date() / 1000);
            let alias = (urlRusLat(title) + '_' + time).substr(0, 254);

            let count_images = (data.images) ? data.images.length : 0;

            let area_id;
            return db.getAreaIdByName(city_id, area).then(function(value) {
                area_id = value;

                let post = {
                    alias: alias,
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
                    area_id: area_id,
                    status: settings.post_status,
                    author_id: settings.post_user,
                    payment: payment,
                    type: type,
                    count_images: count_images,
                    create_time: time,
                    update_time: time
                };
                logger.debug(post);
                resolve(post);
            }, function(error) {
                reject(error);
            });
        });
    },

    addContent: function(data) {
        if (postExcludes(data.description)) {
            logger.debug('Имеются слова исключения.');
            return Promise.resolve(0);
        }
        let href = data.href;
        let images = data.images;
        return this.preparePost(data).then(function(post) {
            return db.savePost(post).then(function(post_id) {
                return Promise.all(images.map(function(item) {
                    return new Promise(function(resolve, reject) {
                        return im.saveImage(item).then(function(saved_file_name) {
                            return db.saveImagePosts(post_id, saved_file_name).then(function(value) {
                                resolve(1);
                            });
                        });
                    });
                })).then(function(data) {
                    return db.saveLink(post_id, href).then(function(value) {
                        return new Promise(function(resolve, reject) {
                            resolve(1);
                        });
                    });
                });
            }, function(error) {
                logger.debug(error);
                return Promise.reject(error);
            });
        });
    }

}

function postExcludes(description) {
    let isMatch = false;
    if (settings.exclude) {
        let excludes = settings.exclude.split(',');
        isMatch = excludes.some(function(exclude) {
            let regex = new RegExp(exclude.trim(), "i");
            return regex.test(description);
        });
    }
    return (isMatch);
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

//Транслитерация кириллицы в URL
function urlRusLat(str) {
    str = str.toLowerCase(); // все в нижний регистр
    let cyr2latChars = new Array(
        ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'], ['ё', 'yo'], ['ж', 'zh'], ['з', 'z'], ['и', 'i'], ['й', 'y'], ['к', 'k'], ['л', 'l'], ['м', 'm'], ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'], ['с', 's'], ['т', 't'], ['у', 'u'], ['ф', 'f'], ['х', 'h'], ['ц', 'c'], ['ч', 'ch'], ['ш', 'sh'], ['щ', 'shch'], ['ъ', ''], ['ы', 'y'], ['ь', ''], ['э', 'e'], ['ю', 'yu'], ['я', 'ya'],

        ['А', 'A'], ['Б', 'B'], ['В', 'V'], ['Г', 'G'], ['Д', 'D'], ['Е', 'E'], ['Ё', 'YO'], ['Ж', 'ZH'], ['З', 'Z'], ['И', 'I'], ['Й', 'Y'], ['К', 'K'], ['Л', 'L'], ['М', 'M'], ['Н', 'N'], ['О', 'O'], ['П', 'P'], ['Р', 'R'], ['С', 'S'], ['Т', 'T'], ['У', 'U'], ['Ф', 'F'], ['Х', 'H'], ['Ц', 'C'], ['Ч', 'CH'], ['Ш', 'SH'], ['Щ', 'SHCH'], ['Ъ', ''], ['Ы', 'Y'], ['Ь', ''], ['Э', 'E'], ['Ю', 'YU'], ['Я', 'YA'],

        ['a', 'a'], ['b', 'b'], ['c', 'c'], ['d', 'd'], ['e', 'e'], ['f', 'f'], ['g', 'g'], ['h', 'h'], ['i', 'i'], ['j', 'j'], ['k', 'k'], ['l', 'l'], ['m', 'm'], ['n', 'n'], ['o', 'o'], ['p', 'p'], ['q', 'q'], ['r', 'r'], ['s', 's'], ['t', 't'], ['u', 'u'], ['v', 'v'], ['w', 'w'], ['x', 'x'], ['y', 'y'], ['z', 'z'],

        ['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D'], ['E', 'E'], ['F', 'F'], ['G', 'G'], ['H', 'H'], ['I', 'I'], ['J', 'J'], ['K', 'K'], ['L', 'L'], ['M', 'M'], ['N', 'N'], ['O', 'O'], ['P', 'P'], ['Q', 'Q'], ['R', 'R'], ['S', 'S'], ['T', 'T'], ['U', 'U'], ['V', 'V'], ['W', 'W'], ['X', 'X'], ['Y', 'Y'], ['Z', 'Z'],

        [' ', '_'], ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['-', '-']
    );
    let newStr = new String();
    for (let i = 0; i < str.length; i++) {
        ch = str.charAt(i);
        let newCh = '';
        for (let j = 0; j < cyr2latChars.length; j++) {
            if (ch == cyr2latChars[j][0]) {
                newCh = cyr2latChars[j][1];
            }
        }
        // Если найдено совпадение, то добавляется соответствие, если нет - пустая строка
        newStr += newCh;
    }
    // Удаляем повторяющие знаки - Именно на них заменяются пробелы.
    // Так же удаляем символы перевода строки, но это наверное уже лишнее
    return newStr.replace(/[_]{2,}/gim, '_').replace(/\n/gim, '');
}
