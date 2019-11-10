var webdriver = require('selenium-webdriver'),
    by = webdriver.By,
    chrome = require('selenium-webdriver/chrome'),
    firefox = require('selenium-webdriver/firefox');

var settings = require('./settings.json');
var logger = require('./logger');
var proc = require('./process');
var db = require('./mysql');
var promiseLimit = require('promise-limit');
var fs = require('fs');

var userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1';

//setup custom Chrome capability
var chromedriver_exe = require('chromedriver').path;
var customChrome = webdriver.Capabilities.chrome();
customChrome.set("chrome.binary.path", chromedriver_exe);

//setup custom phantomJS capability
var phantomjs_exe = require('phantomjs-prebuilt').path;
var customPhantom = webdriver.Capabilities.phantomjs();
customPhantom.set("phantomjs.binary.path", phantomjs_exe);
customPhantom.set("phantomjs.page.settings.userAgent", userAgent);
customPhantom.set("phantomjs.page.settings.loadImages", false);
customPhantom.set("phantomjs.page.settings.localToRemoteUrlAccessEnabled", true);
if(settings.proxy !== "") {
    customPhantom.set("phantomjs.cli.args",["--proxy="+settings.proxy,"--proxy-auth="+settings.proxyuserpwd,"--web-security=no","--ignore-ssl-errors=yes"]);
}

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
    let host = new Buffer.from("YXZpdG8", 'base64').toString();
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
    return new webdriver.promise.Promise(function(resolve, reject) {

        let url_mobile = href.replace(/www/, 'm');
        let data = {href};

        driver.get(url_mobile);

        //заголовок
        driver.findElement(by.css('[data-marker="item-description/title"]')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.title = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //адрес
        driver.findElement(by.css('[data-marker="delivery/location"]')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.address = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //описание
        driver.findElement(by.css('[data-marker="item-description/text"]')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.description = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //хлебные крошки
        driver.findElement(by.css('[data-marker="item-properties-item(0)/description"]')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.breadcrumbs = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        //картинки
        let images = [];
        let spans = driver.findElements(webdriver.By.css('[data-marker="image-gallery"] img'));
        webdriver.promise.filter(spans, function(span) {
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
        driver.findElement(by.css('[data-marker="item-description/price"]')).getText().then(function(value) {
            logger.debug('section_txt: ' + value);
            data.price = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        driver.findElement(by.css('a[href^="tel:"]')).getAttribute('href').then(function(value) {
            logger.debug('section_txt: ' + value);
            data.number = value;
        }, function(err) {
            if (err.state) {
                logger.error(err);
            }
        });

        return webdriver.promise.all(href).then(function(results) {
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
	   var base64Data = data.replace(/^data:image\/png;base64,/,"")
	   fs.writeFile(__dirname + "/logs/screenshot.png", base64Data, 'base64', function(err) {
	        if(err) logger.error(err);
	   });
	});
}

function getContentList(url) {
    let links = [];
    let limit = promiseLimit(1);
    driver.get(url);
    let spans = driver.findElements(webdriver.By.css('[data-marker="item/link"]'));
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
    logger.debug(value);
    logger.debug('Всего: ' + count_links + ' Из них спарсено: ' + count_parse + ' Из них сохранено: ' + count_saves);
    driver.quit();
    db.disconnect();
}, function(err) {
    logger.error(err);
});

/*
let uuu = 'https://www.' + new Buffer("YXZpdG8", 'base64').toString() + '.ru/ufa/kvartiry/1-k_kvartira_33_m_1516_et._1502657061';
db.isNotProcessed(uuu).then(function(value) {
    logger.debug('isNotProcessed: ' + value);
    getContentPage(uuu).then(function() {
        logger.debug('sss');
    });
});
*/
