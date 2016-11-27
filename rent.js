var webdriver = require('selenium-webdriver'),
    by = webdriver.By,
    until = webdriver.until,
    chrome = require('selenium-webdriver/chrome'),
    firefox = require('selenium-webdriver/firefox');

var settings = require('./settings.json');
var logger = require('./logger');
var proc = require('./process');
var db = require('./mysql');

//setup custom Chrome capability
var chromedriver_exe = require('chromedriver').path;
var customChrome = webdriver.Capabilities.chrome();
customChrome.set("chrome.binary.path", chromedriver_exe);

//setup custom phantomJS capability
var phantomjs_exe = require('phantomjs-prebuilt').path;
var customPhantom = webdriver.Capabilities.phantomjs();
customPhantom.set("phantomjs.binary.path", phantomjs_exe);

var driver = new webdriver.Builder().withCapabilities(customPhantom).build();
//var driver = new webdriver.Builder().forBrowser('firefox').build();
//var driver = new webdriver.Builder().withCapabilities(customChrome).build();

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

function pagi_count(url) {
    let promise = new webdriver.promise.Promise(function(resolve, reject) {
        driver.get(url);
        //пагинатор
        driver.findElement(by.css("div.pagination-pages > a.pagination-page:last-child")).getAttribute('href').then(function(value) {
            //logger.debug('section_txt: ' + value);
            let count = value.match(/p=\d{1,4}/);
            count = count[0].replace(/[^0-9]/g, '');
            logger.debug('pagi_count: ' + count);
            resolve(count);
        }, function(err) {
            reject(err);
        });
    });
    return promise;
}

function get_content_page(href) {
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

        webdriver.promise.all(href).then(function(results) {
            proc.addContent(data).then(function() {
                resolve(1);
            });
        });
    });
}

function get_content_list(url) {
    let links = [];
    driver.get(url);
    let spans = driver.findElements(webdriver.By.css('div.item > div.description > h3.title > a'));
    webdriver.promise.filter(spans, function(span) {
        return span.getAttribute('href').then(function(value) {
            links.push(value);
            return true;
        });
    }).then(function(filteredSpans) {
        links.forEach(function(elem, index, array) {
            logger.debug('link: ' + elem);
            db.isNotProcessed(elem).then(function(value) {
                logger.debug('isNotProcessed: ' + value);
                if (value) {
                    get_content_page(elem).then(function(){
                        
                    });
                }
            });
        });
        count_links += links.length;
    });
}

function get_content_all() {
    let url = createUrl();
    let cnt = 0;
    pagi_count(url).then(function(value) {
        cnt = value;
        let limit = (settings.limit_pages == 0) ? cnt : settings.limit_pages;
        for (let index = 1; index <= limit; index++) {
            //logger.debug('page: ' + index);
            get_content_list(url + '&p=' + index);
        }
    }, function(err) {
        if (err.state) {
            logger.error(err);
        }
        get_content_list(url);
    });;
}

let uuu = 'https://www.' + new Buffer("YXZpdG8", 'base64').toString() + '.ru/ufa/kvartiry/2-k_kvartira_42_m_29_et._876881266';
db.isNotProcessed(uuu).then(function(value) {
    logger.debug('isNotProcessed: ' + value);
    if (value) {
        get_content_page(uuu).then(function() {
            logger.debug('sss');
        });
    }
});

//get_content_all();

/*driver.sleep(settings.sleep_delay);
driver.quit().then(function() {
    logger.debug('Всего: ' + count_links + ' Из них спарсено: ' + count_parse + ' Из них сохранено: ' + count_saves);
    //db.disconnect();    
});*/
