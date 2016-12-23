'use strict';

let retryAction = require('../index');
let assert = require('assert');
let should = require('should');

require('co-mocha');

let db = null;
let result = null;
let one = 0;

function* initDB() {
    db = [];
}

function* insertData() {
    if (result) {
        db.push(result);
    } else {
        throw new Error('no result');
    }
}

function* computeResult() {
    if (!one) throw new Error('one should have meaning.');

    result = 2 / one;
}

let handlers = [{
    error: "Cannot read property 'push' of null",
    handler: initDB
}, {
    error: 'no result',
    handler: computeResult
}, {
    error: 'one should have meaning\.',
    handler: function *() {
        one = 1;
    }
}];

describe('retry', function () {
    it('should succeed', function *() {
        yield retryAction(insertData, 3, handlers);
        should(db).have.length(1);
        console.log('=== db ===');
        console.log(db);
    });
});