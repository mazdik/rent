var settings = require('./settings.json');
var logger = require('./logger');
var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });

var dir = settings.images_dir;
var watermark = settings.watermark;

module.exports = {

    saveImage: function(url) {
        return new Promise(function(resolve, reject) {
            let file_name = imageName();
            let extension = '.jpg';
            let img = gm(url)
                .identify(function(err, identify) {
                    if (!err) {
                        //logger.debug(identify);
                        let width = identify['size']['width'];
                        let height = identify['size']['height'];
                        let baseFilename = identify['Base filename'];
                        logger.debug('baseFilename: ' + baseFilename + ' width: ' + width + ' height: ' + height);
                        if (baseFilename) {
                            extension = baseFilename.substring(baseFilename.indexOf('.'));
                            //logger.debug(extension);
                        }
                        img.quality(70)
                            /* Обрезка снизу вверх */
                            .crop(width, (height / 100) * settings.crop, 0, 0)
                            /* Водяной знак */
                            .gravity('SouthEast')
                            .draw(['image Over 0,0 0,0 "' + watermark + '"'])
                            .write(dir + file_name + extension, function(err) {
                                if (err) return console.dir(arguments)
                                    //logger.debug(this.outname + " created  ::  " + arguments[3])
                                    /* Превюшка */
                                gm(this.outname)
                                    .resize(200, 200)
                                    .write(dir + 'thumb_' + file_name + extension, function(err) {
                                        if (err) logger.debug(err);
                                        resolve(file_name + extension);
                                    });
                            });
                    } else {
                        if (err) logger.debug(err);
                    }
                });
        });
    }

}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function imageName() {
    let random = getRandomInt(1, 999);
    let time = Math.floor(new Date() / 1000);
    let yead = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    let fileName = yead + '_' + month + '_' + time + '_' + random + '_' + settings.city;
    fileName = fileName.substr(0, 254);
    return fileName;
}
