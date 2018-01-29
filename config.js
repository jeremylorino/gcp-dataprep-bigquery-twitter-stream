'use strict';

// Hierarchical node.js configuration with command-line arguments, environment
// variables, and files.
const nconf = module.exports = require('nconf');
const path = require('path');

nconf
  // 1. Command-line arguments
  .argv()
  // 2. Environment variables
  .env([
    'NODE_ENV',
    'PORT',
    'GCLOUD_PROJECT',
    'GOOGLE_APPLICATION_CREDENTIALS',
  ])
  // 3. Config file
  .file({ file: path.join(__dirname, 'config.json') })
  // 4. Defaults
  .defaults({
    PORT: 8080,
    // This is the id of your project in the Google Cloud Developers Console.
    GCLOUD_PROJECT: '',
  });

// Check for required settings
checkConfig('GCLOUD_PROJECT');
checkConfig('twitter');
checkConfig('bigquery');
checkConfig('storage');

function checkConfig (setting) {
  if (!nconf.get(setting)) {
    throw new Error(`You must set ${setting} as an environment variable or in config.json!`);
  }
}