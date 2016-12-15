'use strict';

let retryAction = require('../index');
let assert = require('assert');
let should = require('should');

require('co-mocha');

let db = null;

function* initDB() {
    db = [];
}

function* insertData() {
    db.push(1);
}

function *insertAndReturn() {
    db.push(1);

    return db;
}

let handlers = [{
    error: "Cannot read property 'push' of null",
    handler: initDB
}];

describe('retry', function () {
    it('should succeed', function *() {
        yield retryAction(insertData, 1, handlers);
        should(db).have.length(1);
    });

    it('can return the return value after retry', function *() {
        db = null;
        let result = yield retryAction(insertAndReturn, 1, handlers);
        should(db).have.length(1);
        should(result).have.length(1);
    });
});