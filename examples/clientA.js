var Model = require('../index')
    , Document = Model.Document;

var clientA = new Model({
    name: 'message',
    url: 'ws://localhost:3000'
});

clientA.subscribe().then(function() {
    clientA.on('stream', function (args) {
        clientA.info(args);
    });

    var i = 0;
    setInterval(function () {
        clientA.insert(new Document({
            'name': 'messageA',
            'data': {
                keyA: ++i,
                keyB: 'valueB'
            }
        }));
    }, 2000);
});
