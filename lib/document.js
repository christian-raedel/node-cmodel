var _ = require('lodash')
    , util = require('util')
    , EventEmitter = require('events').EventEmitter
    , shortid = require('shortid')
    , tpl = require('node-cplate').format
    , CConf = require('node-cconf')
    , CLogger = require('node-clogger');

function Document(opts) {
    var config = new CConf('document', [
        'name',
        'data:_version'
    ], {
        'name': shortid.generate(),
        'data': {
            '_version': 0
        }
    });

    config.load(opts || {});
    config.setDefault('logger', new CLogger({name: config.getValue('name')}));

    config.getValue('logger').extend(this);

    EventEmitter.apply(this);

    var self = this;
    config.on('valuechanged:data:_version', function (newValue, oldValue) {
        self.debug('Version increment to [%d]', newValue);
        self.emit('stream', self.config.getValue('data'));
    });

    this.config = config;
}

util.inherits(Document, EventEmitter);

Document.prototype.__defineGetter__('classname', function () { return 'Document'; });

Document.prototype.__defineGetter__('name', function () { return this.config.getValue('name'); });

Document.prototype.toString = function () {
    return tpl('{{classname}} [{{instance}}]', {classname: this.classname, instance: this.name});
};

Document.prototype.get = function () {
    return this.config.getValue('data');
};

Document.prototype.update = function(data) {
    this.debug('Update document to [%j]', data);

    var config = this.config
        , version = config.getValue('data:_version');

    config.setValue('data', data);
    config.setValue('data:_version', ++version);

    this.debug('Updated document to [%j]', config.getValue('data'));
    return this;
};

module.exports = Document;
