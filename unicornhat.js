var lodash = require('lodash');

var state = { buffer: [] };
var hat = {};

hat.reset = function() {
    state.buffer = [];
}

hat.set_pixel = function(x, y, r, g, b) {
    state.buffer.push({ command: 'set_pixel', parameters: { x:x, y:y, r:r, g:g, b:b } });
}

hat.brightness = function(brightness) {
    state.buffer.push({ command: 'brightness', parameters: { brightness:brightness } });
}

hat.show = function() {
    state.buffer.push({ command: 'show' });
}

hat.clear = function() {
    state.buffer.push({ command: 'clear' });
}

hat.send = function(options) {
    if (state.buffer.length == 0) {
        return;
    }

    let payload = { 'type': 'unicorn', 'actions': lodash.cloneDeep(state.buffer) };
    downlink.send(payload, options);

    hat.reset();
}

module.exports = hat;