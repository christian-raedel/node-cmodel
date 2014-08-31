var _ = require('lodash')
    , chai = require('chai')
    , expect = chai.expect
    , spies = require('chai-spies')
    , promised = require('chai-as-promised')
    , Wampify = require('wampify')
    , Document = require('../index').Document
    , Model = require('../index');

chai.use(spies).use(promised);

describe('Model:Constructor', function () {
    var server = null;

    beforeEach(function (done) {
        server = new Wampify({name: 'wampify-test-server', port: 3000});

        setTimeout(function() { done(); }, 500);
    });

    afterEach(function (done) {
        server.close();

        setTimeout(function() { done(); }, 500);
    });

    it('should instanciate', function () {
        var model = new Model({name: '$inge', url: 'ws://localhost:3000'});
        expect(model).to.be.an.instanceof(Model);
        expect(model.classname).to.be.equal('Model');
        expect(model.name).to.be.equal('$inge');
        expect(model.DocumentClass).to.be.equal(Document);
        expect(model.toString()).to.be.equal('Model [$inge]');
        expect(model.channelname).to.be.equal('model:$inge');
    });

    it('should throw an error, if no name is given', function () {
        try {
            new Model();
        } catch (err) {
            expect(err).to.be.an.instanceof(Error);
        }
    });
});

describe('Model:Insert', function () {
    var server = null, model = null;

    beforeEach(function (done) {
        server = new Wampify({name: 'wampify-test-server', port: 3000});
        model = new Model({name: '$inge', url: 'ws://localhost:3000'});
        server.addChannel(model.channelname);
        server.addChannel(model.channelname + ':all');

        setTimeout(function() { done(); }, 500);
    });

    afterEach(function (done) {
        server.close();

        setTimeout(function() { done(); }, 500);
    });

    it('should insert a valid document', function () {
        expect(model.insert(new Document({
            name: '$inge',
            data: {
                dress: '$noir'
            }
        }))).to.be.an.instanceof(Model);
    });

    it('should throw an error on insert a invalid document', function () {
        expect(model.insert.bind(model, {name: '$inge'})).to.throw(TypeError);
    });

    it('should emit on document insert', function (done) {
        function onstream(args) {
            expect(args.name).to.be.equal('$inge');
            expect(args.data).to.be.deep.equal({dress: '$noir', '_version': 0});
        }
        var spy = chai.spy(onstream);
        model.on('stream', spy);

        model.insert(new Document({name: '$inge', data: {dress: '$noir'}}));
        setTimeout(function () {
            expect(spy).to.have.been.called.once;
            done();
        }, 500);
    });

    it('should push all documents', function (done) {
        function onpush(args) {
            expect(args).to.have.property('$inge');
            expect(args['$inge']).to.be.deep.equal({'_version': 0, dress: '$noir'});
        }
        var spy = chai.spy(onpush);
        model.on('push', spy);
        model.insert(new Document({name: '$inge', data: {dress: '$noir'}}));
        model.emit('channel:' + model.channelname + ':all', ['REQ']);

        setTimeout(function () {
            expect(spy).to.have.been.called.once;
            done();
        }, 500);
    });
});
