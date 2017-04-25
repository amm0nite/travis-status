const request = require('request');

function defaults() {
    return {
        baseUrl: 'https://mc.ahst.fr',
        method: 'GET',
        json: true
    };
}

function responseHandler(next) {
    if (!next) {
        next = function() {};
    }

    return function(err, res) {
        if (err) return next(err);
        if (res.statusCode != 200) return next(res.body);
        return next(null, res.body);
    };
}

function load(key, next) {
    let params = defaults();
    
    request('/memory/' + key, params, responseHandler(next));
}

function save(key, value, next) {
    let params = defaults();
    params.method = 'POST';
    params.body = value;

    request('/memory/' + key, params, responseHandler(next));
}

function send(message, options, next) {
    if (!options) {
        options = {};
    }

    let wrapped = { message: message };
    if (options.serial) {
        wrapped.serial = options.serial;
    }

    let params = defaults();
    params.method = 'POST';
    params.body = wrapped;

    request('/send', params, responseHandler(next));
}

module.exports = {
    load: load,
    save: save,
    send: send
};