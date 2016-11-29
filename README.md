# co-retry.js [![Build Status](https://travis-ci.org/Jeff-Tian/co-retry.js.svg?branch=master)](https://travis-ci.org/Jeff-Tian/co-retry.js)
Retry an action specified times automatically if failed with predefined error handlers.
 
## Installation
```npm
npm install co-retry.js --save
```
 
## Usage
### Simple example:
```javascript
'use strict';

const tryAction = require('co-retry.js');

let action = function *(){
    // your action that might fail
};

let handlers = [{
                   error: 'error1', 
                   handler: yourHandler1
               }, {
                   error: 'error2', 
                   handler: yourHandler2
               }, {
                   error: /error message match/i, 
                   handler: yourHandler3
               }];

yield tryAction(action, 3, handlers);
```
### Full example:
```javascript
'use strict';

const dba = require('../dba');
const timeUuid = require('greenShared/util').timeUuid;
const parse = require('co-body');
const config = require('../config');
const fs = require('fs');
const tryAction = require('co-retry.js');

function * runDbScript(scriptName) {
    let filePath = './db-scripts/' + scriptName + '_' + (process.env.NODE_ENV || 'dev') + '.sql';
    if (!fs.existsSync(filePath)) {
        filePath = './db-scripts/' + scriptName + '.sql';
    }

    let cql = yield function (cb) {
        fs.readFile(filePath, 'utf-8', cb);
    };

    yield dba.execute(cql.replace('{{keyspace}}', config.cassandra.default.keyspace), []);
}

function runDbScriptInvoker(scriptName) {
    return function*() {
        yield runDbScript(scriptName);
    };
}

let handlers = [{
    error: 'Keyspace buzz_test does not exist',
    handler: runDbScriptInvoker('create-keyspace')
}, {
    error: 'unconfigured columnfamily education',
    handler: runDbScriptInvoker('create-education')
}];

module.exports = function (app, router) {
    router
        .put('/users/:member_id/educations', function *(next) {
            let member_id = this.params.member_id;
            let data = yield parse(this.request);

            let insertEducationInfo = function *() {
                yield dba.execute(
                    'Insert Into ' + config.cassandra.default.keyspace + '.education (member_id, education_id, grade, insert_date, update_date, is_deleted) values (?, ?, ?, ?, ?, ?)',

                    [member_id, timeUuid.newId(), data.grade, new Date(), new Date(), false]
                );
            };

            try {
                yield tryAction(insertEducationInfo, 3, handlers);

                this.body = {
                    isSuccess: true,
                    result: {}
                };
            } catch (ex) {
                this.throw(502, ex.message, {error: ex});
            }
        })
    ;
};
```

## Contribution
### run test
```npm
npm test
```