const fs = require('fs');
const sdk = require('ahst-sdk');

const hat = require('./unicornhat.js');
const State = require('./state.js');

const statusCacheKey = 'cloud_travis_status';

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

    sdk.mc.send({ type:'unicorn', actions:hat.flush() }, { serial: '00000000dd275177' });
}

(function() {
    sdk.mc.load(statusCacheKey, function(err, data) {
        if (err) return console.log(err);
        
        let payload = JSON.parse(fs.readFileSync('payload.json', { encoding:'utf8' }));
        if (!payload || !payload.hasOwnProperty('payload')) {
            return;
        }

        // Webhooks are delivered with a application/x-www-form-urlencoded content type using HTTP POST, 
        // with the body including a payload parameter that contains the JSON webhook payload in a URL-encoded format.
        payload = payload.payload;
        if (typeof payload != 'object') {
            payload = JSON.parse(payload);
        }
        
        let state = new State(data);
        state.update(payload);
        displayMap(state.buildMap());

        sdk.mc.save(statusCacheKey, state.dump());
    });
})();