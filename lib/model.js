var _ = require('lodash')
    , util = require('util')
    , EventEmitter = require('events').EventEmitter
    , CConf = require('node-cconf')
    , CLogger = require('node-clogger')
    , tpl = require('node-cplate').format
    , WampifyClient = require('wampify').Client
    , Document = require('./document');

function Model(opts) {
    var config = new CConf('model', ['name', 'url']).load(opts || {});
    config.setDefault('logger', new CLogger({name: config.getValue('name')}));

    config.getValue('logger').extend(this);

    WampifyClient.apply(this, [{
        name: config.getValue('name'),
        url: config.getValue('url'),
        logger: config.getValue('logger')
    }]);

    var self = this;
    this.on('channel:' + this.channelname, function (args) {
        self.debug('onStream');
        self.emit('stream', args[0]);
    });

    this.on('channel:' + this.channelname + ':all', function (args) {
        if (args[0] === 'REQ') {
            self.push();
        } else {
            self.emit('push', args[0]);
        }
    });

    this.subscribe();

    this.config = config;
    this.data = {};
}

util.inherits(Model, WampifyClient);

Model.prototype.__defineGetter__('classname', function () { return 'Model'; });

Model.prototype.__defineGetter__('name', function () { return this.config.getValue('name'); });

Model.prototype.__defineGetter__('DocumentClass', function () { return Document; });

Model.prototype.__defineGetter__('channelname', function () { return tpl('model:{{name}}', {name: this.name}); });

Model.prototype.toString = function() {
    return tpl('{{classname}} [{{instance}}]', {classname: this.classname, instance: this.name});
};

Model.prototype.insert = function (doc) {
    if (doc instanceof this.DocumentClass) {
        var data = this.data;
        if (!data[doc.name]) {
            data[doc.name] = doc;
        } else {
            data[doc.name].update(doc.get());
            this.warn('Overwrote document [%s] on insert!', doc.name);
        }
        this.publish(data[doc.name]);
    } else {
        throw new TypeError(tpl('{{classname}}.insert accept only instances of {{constructor}} as argument!', {
            classname: this.classname,
            constructor: this.DocumentClass.toString()
        }));
    }

    return this;
};

Model.prototype.subscribe = function () {
    return Model.super_.prototype.subscribe.call(this, this.channelname)
        .then(Model.super_.prototype.subscribe.call(this, this.channelname + ':all'));
};

Model.prototype.unsubscribe = function () {
    return Model.super_.prototype.unsubscribe.call(this, this.channelname + ':all')
        .then(Model.super_.prototype.unsubscribe.call(this, this.channelname));
};

Model.prototype.publish = function (doc) {
    if (doc instanceof this.DocumentClass) {
        var name = doc.name, data = doc.get();
        return Model.super_.prototype.publish.call(this, this.channelname, {}, {name: name, data: data});
    } else {
        throw new TypeError(tpl('{{classname}}.publish accept only instances of {{constructor}} as argument!', {
            classname: this.classname,
            constructor: this.DocumentClass.toString()
        }));
    }
};

Model.prototype.push = function () {
    var dataset = {};

    _.forOwn(this.data, function(doc) {
        var name = doc.name, data = doc.get();
        dataset[name] = data;
    }, this);

    return Model.super_.prototype.publish.call(this, this.channelname + ':all', {}, dataset);
};

module.exports = Model;
