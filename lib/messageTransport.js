"use strict";

const pubsub = require('@google-cloud/pubsub')(),
  { logger } = require('./index');

class MessageTransport {
  constructor(topicName) {
    this.topicName = topicName;
    this.topic = pubsub.topic(this.topicName);
    this.publisher = this.topic.publisher();
  }

  publish(data, attributes) {
    logger.debug('publish message', { data, attributes });

    return this.publisher.publish(new Buffer(JSON.stringify(data)), attributes);
  }
}

module.exports = MessageTransport;
