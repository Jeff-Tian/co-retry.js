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

let handlers = [{
    error: "Cannot read property 'push' of null",
    handler: initDB
}];

describe('retry', function () {
    it('should succeed', function *() {
        yield retryAction(insertData, 1, handlers);
        should(db).have.length(1);
    });
});