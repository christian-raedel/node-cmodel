var WampifyClient = require('wampify').Client;

var clientB = new WampifyClient({
    name: 'clientB',
    url: 'ws://localhost:3000'
});

var messages = [];

clientB.subscribe('model:message:all').then(function () {
    clientB.on('channel:model:message:all', function (data) {
        messages = data;
        clientB.info('initial data received...');
    });

    clientB.publish('model:message:all', {}, 'REQ').then(function () {
        clientB.info('messages requested...');
    });
});

clientB.subscribe('model:message').then(function () {
    clientB.on('channel:model:message', function (data) {
        messages.push(data);
        clientB.info('messages received: %d', messages.length);
    });
});
