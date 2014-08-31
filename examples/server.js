var Wampify = require('wampify');

var server = new Wampify({
    name: 'wampify-test-server',
    port: 3000
})
.addChannel('model:message')
.addChannel('model:message:all');
