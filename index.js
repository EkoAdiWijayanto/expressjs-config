var express = require('express');

module.exports = function(api) {

    var
        expressValidator = require('express-validator'),
        config = require('config'),
        bodyParser = require('body-parser'),
        methodOverride = require('method-override'),
        helmet = require('helmet'),
        winston = require('winston'),
        expressWinston = require('express-winston-middleware');


    api.use(new expressWinston.request(config.logger.express));


    api.use(helmet());
    api.use(bodyParser.urlencoded({
        'extended': 'true',
        limit: config.server.body_parser.limit
    }));
    api.use(bodyParser.json({
        limit: config.server.body_parser.limit
    }));
    api.use(bodyParser.json({
        type: 'application/vnd.api+json'
    }));

    api.use(expressValidator({
        errorFormatter: function(field, message, value) {
            var namespace = field.split('.'),
                root = namespace.shift(),
                formParam = root;

            while (namespace.length) {
                formParam += '[' + namespace.shift() + ']';
            }
            return {
                field: field,
                message: message,
                value: value
            };
        }
    }));

    api.use(methodOverride());

    api.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Authorization, Content-Type, Accept, enctype");
        next();
    });

    api.options('*', function(req, res) {
        res.sendStatus(200);
    });

    if (config.server.middleware) {
        config.server.middleware.forEach(function(item) {
            if (item.mount)
                api.use(item.mount, require(item.handler));
            else
                api.use(require(item.handler));

        });
    }


    if (config.views) {
        api.set('view engine', config.views.engine);
        api.set('views', config.views.folder);
    }

    if (config.server.statics) {
        config.server.statics.forEach(function(item) {
            api.use(item.mount, express.static(item.folder));
        });
    }
};
