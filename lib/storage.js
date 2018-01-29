"use strict";

const storage = require('@google-cloud/storage')(),
  { logger } = require('./index'),
  _ = require('lodash');

/**
 * Recursively rename properties in to meet BigQuery field name requirements.
 *
 * @param {*} obj Value to examine.
 */
function fixNames(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(fixNames);
  }
  else if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      fixNames(value);
      const fixedKey = key.replace('-', '_')
        .replace('@', '_at_')
        .replace('.', '_')
        .replace(/(^[^a-zA-Z_])/, '_$1');
      if (fixedKey !== key) {
        obj[fixedKey] = value;
        delete obj[key];
      }
    });
  }
}

class StorageProvider {
  /**
   * @param {object} options?
   * @param {string} options.bucketName - The default bucket where files will be saved.
   * @param {boolean} options.forBigQuery - Format data for the consumption
   * of BigQuery before save. Default: false
   **/
  constructor(options) {
    this.options = _.merge({
      forBigQuery: false,
    }, options);
  }

  /**
   * Save data to the remote storage provider.
   * 
   * @param {string} filename - The filename as it will appear on the remote storage provider.
   * @param {object} data - Data to be saved.
   * @param {object} options?
   * @param {string} options.bucketName? - The bucket where files will be saved; this will
   * override the default bucketName set during instantiation.
   * @param {boolean} options.forBigQuery? - Format data for the consumption
   * of BigQuery before save. Default: false
   **/
  save(filename, data, options) {
    options = _.merge({}, this.options, options);
    let payload = _.merge([], data);

    if (!options.bucketName) {
      throw new Error(`'options.bucketName' must be provided`);
    }

    if (options.forBigQuery === true) {
      fixNames(payload);
      payload = (Array.isArray(payload) ? payload : [payload])
        .map((event) => JSON.stringify(event))
        .join('\n');
    }

    const bucketName = options.bucketName;
    const file = storage.bucket(bucketName).file(filename);

    logger.info(`Saving events to ${filename} in bucket ${bucketName}`);

    return file.save(payload)
      .then(() => {
        logger.info(`JSON written to gs://${bucketName}/${filename}`);
        return {
          success: true,
          payload,
        };
      })
      .catch((err) => {
        logger.error(err);
        return Promise.reject(err);
      });
  }
}

module.exports = StorageProvider;
