const request = require('request');

function defaults() {
    return {
        baseUrl: 'https://mc.ahst.fr',
        method: 'GET',
        json: true
    };
}

function load(key, next) {
    if (!next) {
        next = function() {};
    }

    let params = defaults();

    request('/memory/' + key, params, function(err, res) {
        if (err) return next(err);
        if (res.statusCode != 200) return next(res.body);
        return next(null, res.body);
    });
}

function save(key, value, next) {
    if (!next) {
        next = function() {};
    }

    let params = defaults();
    params.method = 'POST';
    params.body = value;

    request('/memory/' + key, params, next);
}

function send(payload, options, next) {
    let params = defaults();
    params.method = 'POST';
    params.body = payload;

    request('/send', params, next);
}

module.exports = {
    load: load,
    save: save,
    send: send
};