'use strict';

var log4js = require('log4js'); 
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('log.log'), 'log');
var logger = log4js.getLogger('log');
logger.setLevel('DEBUG');

module.exports = logger;
