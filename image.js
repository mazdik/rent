const settings = require('./settings.json');
const logger = require('./logger');
const gm = require('gm').subClass({ imageMagick: true });
const request = require('request');
const path = require('path');

const dir = settings.images_dir;
const watermark = settings.watermark;

module.exports = {

    saveImage: function(url) {
        return new Promise(function(resolve, reject) {
            let file_name = imageName();
            let extension = (path.extname(url) == '.' || path.extname(url) == '') ? '.jpg' : path.extname(url);
            //logger.debug(path.extname(url));
            let img = gm(request(url))
                .identify({ bufferStream: true }, function(err, identify) {
                    if(err) {
                        logger.debug(err);
                        reject(err);
                        return;
                    }
                    //logger.debug(identify);
                    let width = identify['size']['width'];
                    let height = identify['size']['height'];
                    let baseFilename = path.basename(url);
                    logger.debug('baseFilename: ' + baseFilename + ' width: ' + width + ' height: ' + height);
                    let watermarkWidth = 0;
                    let watermarkHeight = 0;
                    gm(watermark).size(function(watermarkError, size) {
                        if (!watermarkError) {
                            watermarkWidth = size.width;
                            watermarkHeight = size.height;
                            if(width < size.width) {
                                watermarkWidth = width;
                                //logger.debug('watermarkWidth ' + watermarkWidth + ' watermarkHeight ' + watermarkHeight);
                            }
                        }
                        img.quality(70)
                            /* Обрезка снизу вверх */
                            .crop(width, (height / 100) * settings.crop, 0, 0)
                            /* Водяной знак */
                            .gravity('SouthEast')
                            // WATERMARK - PARAM ORDER: [X Pos, Y Pos, width, height]
                            .draw(['image Over 0,0 '+ watermarkWidth +','+ watermarkHeight +' "' + watermark + '"'])
                            .write(dir + file_name + extension, function(err) {
                                //logger.debug(this.outname + " created  ::  " + arguments[3])
                                if(err) {
                                    logger.debug(err);
                                    reject(err);
                                    return;
                                }
                                /* Превюшка */
                                gm(this.outname)
                                    .resize(200, 200)
                                    .write(dir + 'thumb_' + file_name + extension, function(err) {
                                        if(err) {
                                            logger.debug(err);
                                            reject(err);
                                            return;
                                        }
                                        resolve(file_name + extension);
                                    });
                            });
                    });
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
