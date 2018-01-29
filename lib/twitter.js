'use strict';

const UserStream = require('user-stream');

class TwitterStream extends UserStream {
  constructor(params) {
    super(params);

    this.stream_url = (params || {}).stream_url || 'https://userstream.twitter.com/1.1/user.json';
  }

  // overriding parent method
  stream(params) {
    const stream = this;

    if (typeof params != 'object') {
      params = {};
    }

    //required params for lib
    params.stall_warnings = 'true';

    const request = this.oauth.post(
      // override the whole method just for this one line lol
      // PR coming your way soon ;)
      this.stream_url,
      this.params.access_token_key,
      this.params.access_token_secret,
      params,
      null
    );

    /**
     * Destroy socket
     */
    this.destroy = function() {
      request.abort();
    };

    request.on('response', function(response) {
      // Any response code greater then 200 from steam API is an error
      if (response.statusCode > 200) {
        stream.emit('error', { type: 'response', data: { code: response.statusCode } });
      }
      else {
        //emit connected event
        stream.emit('connected');
        response.setEncoding('utf8');

        let data = '';

        response.on('data', function(chunk) {
          data += chunk.toString('utf8');

          //is heartbeat?
          if (data == '\r\n') {
            stream.emit('heartbeat');
            return;
          }

          let index, json;

          while ((index = data.indexOf('\r\n')) > -1) {
            json = data.slice(0, index);
            data = data.slice(index + 2);
            if (json.length > 0) {
              try {
                stream.emit('data', JSON.parse(json));
              }
              catch (e) {
                stream.emit('garbage', data);
              }
            }
          }
        });

        response.on('error', function(error) {
          stream.emit('close', error);
        });

        response.on('end', function() {
          stream.emit('close', 'socket end');
        });

        response.on('close', function() {
          request.abort();
        });
      }
    });

    request.on('error', function(error) {
      stream.emit('error', { type: 'request', data: error });
    });

    request.end();
  }
}

module.exports = TwitterStream;
