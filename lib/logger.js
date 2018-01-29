'use strict';

const env = process.env.NODE_ENV || 'dev';

let loggingTransportConfig = {
  level: ['dev', 'test', 'local'].includes(env) ? 'debug': 'error',
  handleExceptions: ['local', 'test'].includes(env) ? false : true,
};

// populate values if running this package locally
if (env === 'local') {
  loggingTransportConfig.logName = `projects/${process.env.GCLOUD_PROJECT}/logs/myservice-local_log`;
  loggingTransportConfig.resource = {
    type: 'global'
  };
}

const winston = require('winston'),
  transport = require('@google-cloud/logging-winston').LoggingWinston;

class Logger extends winston.Logger {
  constructor(options) {
    super(options);

    this.add(transport, loggingTransportConfig);
    this.add(winston.transports.Console, {
      timestamp: true,
      colorize: true,
      level: ['dev', 'test', 'local'].includes(env) ? 'debug': 'error'
    });
  }
}

module.exports = Logger;
