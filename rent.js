const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromium = require('chromium-version');
require('chromedriver');
const by = webdriver.By;

const settings = require('./settings.json');
const logger = require('./logger');
const proc = require('./process');
const db = require('./mysql');
const promiseLimit = require('promise-limit');
const fs = require('fs');

let options = new chrome.Options();
options.setChromeBinaryPath(chromium.path);
options.addArguments('--headless');
options.addArguments('--disable-gpu');
options.addArguments('--disable-extensions');
if(settings.proxy !== '') {
    options.addArguments(`--proxy-server=${settings.proxy}`);
}
options.setMobileEmulation({deviceName: 'Pixel 2'});
const driver = new webdriver.Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

let count_parse = 0;
let count_saves = 0;
let count_links = 0;

function createUrl() {
    let host = new Buffer.from('YXZpdG8', 'base64').toString();
    if(settings.proxyuserpwd !== '') {
        host = settings.proxyuserpwd + '@' + host;
    }
    let url = "https://www." + host + ".ru/" + settings.city + "/" + settings.category + "/" + settings.oper;
    if (settings.object_type) {
        url = url + '/' + settings.object_type;
    }
    url = url + "?i=" + settings.with_images + "&pmax=" + settings.pmax + "&pmin=" + settings.pmin;
    if (settings.user > 0) {
        url = url + "&user=" + settings.user;
    }
    if (settings.query) {
        url = url + "&q=" + encodeURI(settings.query);
    }
    return url;
}

function getContentPage(href) {
    return new Promise(function(resolve, reject) {

        let url_mobile = href.replace(/www/, 'm');
        let data = {href};

        driver.get(url_mobile);

        //заголовок
        const p1 = driver.findElement(by.css('[data-marker="item-description/title"]')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.title = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //адрес
        const p2 = driver.findElement(by.css('[data-marker="delivery/location"]')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.address = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //описание
        const p3 = driver.findElement(by.css('[data-marker="item-description/text"]')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.description = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //хлебные крошки
        const p4 = driver.findElement(by.css('[data-marker="item-properties-item(0)/description"]')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.breadcrumbs = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //картинки
        let images = [];
        let spans = driver.findElements(by.css('[data-marker="image-gallery"] img'));
        const p5 = webdriver.promise.filter(spans, function(span) {
            return span.getAttribute('src').then(function(value) {
                images.push(value);
                return true;
            });
        }).then(function(filteredSpans) {
            //filteredSpans[0].click();
            if(settings.limit_images && settings.limit_images > 0) {
                data.images = images.slice(0, settings.limit_images);
            }
            data.images .forEach(function(elem, index) {
                logger.debug(index + ": " + elem);
            });
        });

        //цена
        const p6 = driver.findElement(by.css('[data-marker="item-description/price"]')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.price = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //номер телефона	
        const p7 = driver.findElement(by.css('a[href^="tel:"]')).click().then(function() {
            takeScreenshot();

            return driver.findElement(by.css('[data-marker="phone-popup/phone-number"]')).getText().then(function(value) {
                logger.debug('section_txt: ' + value);
                data.number = value;
            }, function(err) {
                if (err.state) {
                    logger.error(err);
                }
            });
        }, function(err) { 	
        	logger.error(err);	
        	takeScreenshot();
        	reject(err);	
        });

        return Promise.all([p1, p2, p3, p4, p5, p6, p7]).then(function(results) {
            return proc.addContent(data).then(function(value) {
                resolve(value);
            }, function(err) {
                reject(err);
            });
        });
    });
}

function takeScreenshot() {
    driver.takeScreenshot().then(function(data){
	   const base64Data = data.replace(/^data:image\/png;base64,/,"")
	   fs.writeFile(__dirname + "/logs/screenshot.png", base64Data, 'base64', function(err) {
	        if(err) logger.error(err);
	   });
	});
}

function getContentList(url) {
    let links = [];
    let limit = promiseLimit(1);
    driver.get(url);
    let spans = driver.findElements(by.css('[data-marker="item/link"]'));
    return webdriver.promise.filter(spans, function(span) {
        return span.getAttribute('href').then(function(value) {
            links.push(value);
            return true;
        });
    }).then(function(filteredSpans) {
        count_links += links.length;
        return Promise.all(links.map(function(link) {
            return limit(function() {
                return new Promise(function(resolve, reject) {
                    return db.isNotProcessed(link).then(function(value) {
                        logger.debug('link: ' + link);
                        logger.debug('isNotProcessed: ' + value);
                        if (value) {
                            count_parse++;
                            return getContentPage(link).then(function(count) {
                                if (!isNaN(count)) {
                                    count_saves += count;
                                }
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    });
                });
            });
        }));
    });
}

getContentList(createUrl()).then(function(value) {
    logger.debug('Всего: ' + count_links + ' Из них спарсено: ' + count_parse + ' Из них сохранено: ' + count_saves);
    driver.quit();
    db.disconnect();
}, function(err) {
    logger.error(err);
});

/*
let uuu = 'https://www.' + new Buffer('YXZpdG8', 'base64').toString() + '.ru/ufa/kvartiry/2-k_kvartira_47.2_m_210_et._1678889047';
getContentPage(uuu).then(function() {
    console.log('complete');
    driver.quit();
    process.exit();
});
*/
