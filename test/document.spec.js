var _ = require('lodash')
    , chai = require('chai')
    , expect = chai.expect
    , spies = require('chai-spies')
    , promised = require('chai-as-promised')
    , Document = require('../lib/document');

chai.use(spies).use(promised);

describe('Document:Constructor', function () {
    it('should instanciate', function () {
        var doc = new Document();
        expect(doc).to.be.an.instanceof(Document);
        expect(doc.classname).to.be.equal('Document');
        expect(doc.name).to.be.a('string');
        expect(doc.toString()).to.match(/Document\ \[.*\]/);
    });

    it('should set default name and data', function () {
        var doc = new Document();
        expect(doc.name).to.be.a('string');
        expect(doc.get()).to.be.deep.equal({'_version': 0});
    });

    it('should set given name and data', function () {
        var doc = new Document({name: '$inge', data: {'_version': 2}});
        expect(doc.name).to.be.equal('$inge');
        expect(doc.get()).to.be.deep.equal({'_version': 2});
    });
});

describe('Document:Events', function () {
    it('should emit on version update', function (done) {
        var doc = new Document({name: '$inge'});

        function onupdate(data) {
            expect(data).to.have.property('_version', 1);
            expect(data).to.have.property('description', '$noir');
        }

        var spy = chai.spy(onupdate);
        doc.on('stream', spy);

        doc.update({description: '$noir'});

        setTimeout(function() {
            expect(spy).to.have.been.called.once;
            done();
        }, 500);
    });
});
