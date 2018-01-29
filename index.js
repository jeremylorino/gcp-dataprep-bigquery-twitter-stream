"use strict";

const config = require('./config'),
  { logger } = require('./lib'),
  TwitterStream = require('./lib/twitter'),
  StorageProvider = require('./lib/storage'),
  storage = new StorageProvider(config.get('storage'));

function startStream() {
  const maxBuffer = 100;
  const max = maxBuffer * 1000; // 1,000 batches @ 100/batch
  let count = 0;
  let pubsubBuffer = [];
  let promiseBuffer = [];

  logger.info('begin listening to stream');

  const stream = new TwitterStream(config.get("twitter"));
  const params = {
    with: 'user',
    // some keywords to track in the twitter stream
    track: [
      'nfl',
      'super bowl',
      'superbowl',
      'football',
      'minnesota',
      'olympics',
      'winter olympics',
    ]
  };
  //create stream
  stream.stream(params);

  stream.on('error', function(err) {
    logger.error(err);
  });

  // listen stream data
  stream.on('data', function(json) {
    if (count++ < max) {
      if (pubsubBuffer.length < maxBuffer - 1) {
        pubsubBuffer.push(json);
      }
      else {
        let response = pubsubBuffer.concat([]);
        pubsubBuffer = [];

        /* // uncomment if you would like to save this data locally
        fs.writeFileSync(path.resolve(process.cwd(), 'test/artifacts/twitter/',
          `${Date.now()}.bq.json`), response.map((event) => JSON.stringify(event)).join('\n'));
        */

        logger.info('batch buffer full - flush and write batch to storage');
        promiseBuffer.push(storage.save(`twitter_stream/${Date.now()}.bq.json`, response));
      }
    }

    if (count == max) {
      logger.info('over stream events max - wait for write batches to finish then exit');
      stream.destroy();
      Promise.all(promiseBuffer)
        .then((lst) => process.exit());
    }
  });
}
startStream();
