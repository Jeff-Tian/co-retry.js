'use strict';

let retryAction = require('../index');
let assert = require('assert');
let should = require('should');

require('co-mocha');

let db = null;
let result = null;

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
    result = 2;
}

let handlers = [{
    error: "Cannot read property 'push' of null",
    handler: initDB
}, {
    error: 'no result',
    handler: computeResult
}];

describe('retry', function () {
    it('should succeed', function *() {
        yield retryAction(insertData, 2, handlers);
        should(db).have.length(1);
    });
});