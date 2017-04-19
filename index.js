const redis = require('redis');
const logger = require('winston');

const hat = require('./unicornhat.js');
const travisState = require('./state.js');

const statusCacheRedisKey = 'mc_travis_status';

var redisClient = redis.createClient({ host: config.redis.host });
redisClient.on("error", function (err) {
    logger.error(err);
});
var travisState = null;
withPersistence();

function withPersistence(next) {
    if (!next) {
        next = function() {};
    }

    if (!travisState) {
        redisClient.get(statusCacheRedisKey, function(err, value) {
            if (err) logger.error(err);
            let loaded = (value) ? JSON.parse(value) : null;
            travisState = new travisData.State(loaded);
            return next();
        });
    } else {
        return next();
    }
}

function main(name, payload) {
    if (!payload) {
        return;
    }

    // Webhooks are delivered with a application/x-www-form-urlencoded content type using HTTP POST, 
    // with the body including a payload parameter that contains the JSON webhook payload in a URL-encoded format.
    if (!payload.hasOwnProperty('payload')) {
        return;
    }
    payload = payload.payload;
    if (typeof payload != 'object') {
        payload = JSON.parse(payload);
    }

    let state = travisState;
    if (!state) {
        state = new travisData.State();
    }
    
    state.update(payload);
    redisClient.setex(statusCacheRedisKey, 24 * 3600, JSON.stringify(state.dump()));
    displayMap(state.buildMap());
}

function displayMap(map) {
    hat.reset();
    map.forEach(function(position) {
        let color = { r:0, g:0, b:0 };
        if (position.color) {
            color = position.color;
        }
        hat.set_pixel(position.x, position.y, color.r, color.g, color.b);
    });
    hat.brightness(0.5);
    hat.show();
    hat.send({ serial: '00000000dd275177' });
}

module.exports = { main: main };