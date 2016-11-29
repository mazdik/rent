var webdriver = require('selenium-webdriver'),
    by = webdriver.By,
    until = webdriver.until,
    chrome = require('selenium-webdriver/chrome'),
    firefox = require('selenium-webdriver/firefox');

var settings = require('./settings.json');
var logger = require('./logger');
var proc = require('./process');
var db = require('./mysql');
var promiseLimit = require('promise-limit');

//setup custom Chrome capability
var chromedriver_exe = require('chromedriver').path;
var customChrome = webdriver.Capabilities.chrome();
customChrome.set("chrome.binary.path", chromedriver_exe);

//setup custom phantomJS capability
var phantomjs_exe = require('phantomjs-prebuilt').path;
var customPhantom = webdriver.Capabilities.phantomjs();
customPhantom.set("phantomjs.binary.path", phantomjs_exe);

var driver;
if (settings.chrome == 1) {
    driver = new webdriver.Builder().withCapabilities(customChrome).build();
} else if (settings.firefox == 1) {
    driver = new webdriver.Builder().forBrowser('firefox').build();
} else {
    driver = new webdriver.Builder().withCapabilities(customPhantom).build();
}

let count_parse = 0;
let count_saves = 0;
let count_links = 0;

function createUrl() {
    let host = new Buffer("YXZpdG8", 'base64').toString();
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

function pagiCount(url) {
    return new webdriver.promise.Promise(function(resolve, reject) {
        driver.get(url);
        //пагинатор
        return driver.findElement(by.css("div.pagination-pages > a.pagination-page:last-child"))
            .getAttribute('href').then(function(value) {
                //logger.debug('section_txt: ' + value);
                let count = value.match(/p=\d{1,4}/);
                count = count[0].replace(/[^0-9]/g, '');
                logger.debug('pagi_count: ' + count);
                resolve(count);
            }, function(err) {
                reject(err);
            });
    });
}

function getContentPage(href) {
    return new webdriver.promise.Promise(function(resolve, reject) {
        let url = href;
        let url_mobile = href.replace(/www/, 'm');
        let data = {};
        data.href = href;

        //Открываем обычную версию сайта
        driver.get(url);

        //заголовок
        driver.findElement(by.css('.title-info-title')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.title = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //адрес
        driver.findElement(by.css(".item-map-address > span[itemprop='address']")).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.address = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //описание
        driver.findElement(by.css('.item-description')).getText().then(function(value) {
            //logger.debug('section_txt: ' + value);
            data.description = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //хлебные крошки
        driver.findElement(by.css('div.b-catalog-breadcrumbs')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.breadcrumbs = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //картинки
        let images = [];
        let spans = driver.findElements(webdriver.By.css('.gallery-extended-img-frame'));
        webdriver.promise.filter(spans, function(span) {
            return span.getAttribute('data-url').then(function(value) {
                images.push(value);
                return true;
            });
        }).then(function(filteredSpans) {
            //filteredSpans[0].click();
            data.images = images;
            images.forEach(function(elem, index, array) {
                logger.debug(index + ": " + elem);
            });
        });

        //Открываем мобилнаую версию сайта
        driver.get(url_mobile);

        //цена
        driver.findElement(by.css('.price-value')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.price = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //номер телефона
        driver.findElement(by.css('.action-show-number')).click();
        driver.sleep(settings.sleep_delay);
        driver.findElement(by.css('.action-show-number')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.number = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        return webdriver.promise.all(href).then(function(results) {
            return proc.addContent(data).then(function() {
                resolve(1);
            }, function(err) {
                reject(err);
            });
        });
    });
}

function getContentList(url) {
    let links = [];
    let limit = promiseLimit(1);
    driver.get(url);
    let spans = driver.findElements(webdriver.By.css('div.item > div.description > h3.title > a'));
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
                            return getContentPage(link).then(function() {
                                count_saves++;
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

function getContentAll() {
    let url = createUrl();
    let cnt = 0;
    let links = [];
    let limit = promiseLimit(1);
    return pagiCount(url).then(function(value) {
        cnt = value;
        let limit_pages = (settings.limit_pages == 0) ? cnt : settings.limit_pages;
        for (let index = 1; index <= limit_pages; index++) {
            links.push(url + '&p=' + index);
            logger.debug('url_list: ' + url + '&p=' + index);
        }

        return Promise.all(links.map(function(link) {
            return limit(function() {
                return new Promise(function(resolve, reject) {
                    return getContentList(link).then(function() {
                        resolve('finish');
                    });
                });
            });
        }));
    }, function(err) {
        if (err.state) {
            logger.error(err);
        }
        logger.debug('url_list: ' + url);
        return new Promise(function(resolve, reject) {
            return getContentList(url).then(function() {
                resolve('finish');
            });
        });
    });
}

getContentAll().then(function(value) {
    logger.debug(value);
    logger.debug('Всего: ' + count_links + ' Из них спарсено: ' + count_parse + ' Из них сохранено: ' + count_saves);
    driver.quit();
    db.disconnect();
}, function(err) {
    logger.error(err);
});

/*let uuu = 'https://www.' + new Buffer("YXZpdG8", 'base64').toString() + '.ru/ufa/kvartiry/1-k_kvartira_39_m_712_et._878107618';
db.isNotProcessed(uuu).then(function(value) {
    logger.debug('isNotProcessed: ' + value);
    if (value) {
        getContentPage(uuu).then(function() {
            logger.debug('sss');
        });
    }
});*/

/*let url = createUrl();
pagiCount(url).then(function(value) {
    logger.debug(value);
}, function(err) {
    logger.error(err);
});
*/
