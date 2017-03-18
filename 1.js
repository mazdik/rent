var settings = require('./settings.json');
var logger = require('./logger');

let textobj_add = 'sssda Сдает собственник sdas dfdfdsf Работаем dfdfd Агенство sdsdasd dsfdfd sdd';

function postExcludes(description) {
    return new Promise(function(resolve, reject) {
        let isMatch = false;
        if (settings.exclude) {
            let excludes = settings.exclude.split(',');
            isMatch = excludes.some(function(exclude) {
                let regex = new RegExp(exclude.trim(), "i");
                return regex.test(description);
            });
        }
        if (isMatch) {
            reject('reject');
        } else {
            resolve('resolve');
        }
    });
}

function tes1() {
    return new Promise(function(resolve, reject) {
        return postExcludes(textobj_add).then(function(v) {
            resolve(v);
        }, function(err) {
            reject(err);
        });
    });
}

function tes2() {
    if (1 == 2) {
        return Promise.resolve(1);
    }
    return new Promise(function(resolve, reject) {
        return postExcludes(textobj_add).then(function(v) {
            return tes1();
        }).then(function(){
            return tes1();
        })
        .then(function(v) {
            resolve(v);
        }, function(err) {
            reject(err);
        });
    });
}

tes2().then(function(v) {
    console.log(v);
}, function(err) {
    console.log('tes2: ' + err);
});
