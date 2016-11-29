var log4js = require('log4js');

log4js.configure({
    appenders: [{
        type: 'file',
        filename: "logs/log.log",
        category: 'log',
        maxLogSize: 20480,
        backups: 2
    }]
});

let logger = log4js.getLogger('log');
logger.setLevel('DEBUG');

module.exports = logger;
