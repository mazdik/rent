var webdriver = require('selenium-webdriver'),
    by = webdriver.By,
    until = webdriver.until,
    chrome = require('selenium-webdriver/chrome'),
    firefox = require('selenium-webdriver/firefox');

var settings = require('./settings.json');
var logger = require('./logger');

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
    let url = href;
    let url_mobile = href.replace(/www/, 'm');

    //Открываем обычную версию сайта
    driver.get(url);

    //заголовок
    driver.findElement(by.css('.title-info-title')).getText().then(function(value) {
        logger.debug('section_txt: ' + value);
        let title = value.trim;
    }, function(err) {
        if (err.state) {
            logger.error(err);
        }
    });

    //адрес
    driver.findElement(by.css(".item-map-address > span[itemprop='address']")).getText().then(function(value) {
        logger.debug('section_txt: ' + value);
        let address = value.trim;
    }, function(err) {
        if (err.state) {
            logger.error(err);
        }
    });

    //описание
    driver.findElement(by.css('.item-description')).getText().then(function(value) {
        //logger.debug('section_txt: ' + value);
        let description = value.trim;
    }, function(err) {
        if (err.state) {
            logger.error(err);
        }
    });

    //хлебные крошки
    driver.findElement(by.xpath('/html/body/div[4]/div[1]/div[2]/div[2]')).getText().then(function(value) {
        logger.debug('section_txt: ' + value);
        let payment = 0;
        let type = 0;
        if (value.indexOf('На длительный срок') >= 0) {
            payment = 2;
        } else if (value.indexOf('Посуточно') >= 0) {
            payment = 1;
        } else if (value.indexOf('Вторичка') >= 0) {
            type = 1;
        } else if (value.indexOf('Новостройки') >= 0) {
            type = 2;
        }
        logger.debug('section_txt: ' + payment);
        logger.debug('section_txt: ' + type);
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
        images.forEach(function(elem, index, array) {
            logger.debug(index + ": " + elem);
        });
    });

    //Открываем мобилнаую версию сайта
    driver.get(url_mobile);

    //цена
    driver.findElement(by.css('.price-value')).getText().then(function(value) {
        logger.debug('section_txt: ' + value);
        let price = value.replace(/[^0-9]/g, '');
        logger.debug('section_txt: ' + price);
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
        let number = value.replace(/[^0-9]/g, '');
        //удалить 8 спереди
        number = number.substr(1);
        logger.debug('section_txt: ' + number);
    }, function(err) {
        if (err.state) {
            logger.error(err);
        }
    });
}

function get_content_list(url) {
    let count_parse = 0;
    let count_saves = 0;
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
            get_content_page(elem);
        });
        logger.debug('Всего: ' + links.length + ' Из них спарсено: ' + count_parse + ' Из них сохранено: ' + count_saves);
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

//get_content_page('/ufa/kvartiry/2-k_kvartira_50_m_99_et._853831519')

get_content_all();

driver.quit();
