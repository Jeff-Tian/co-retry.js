'use strict';

function logException(ex) {
    console.error(ex);
    console.error('error name: ', ex.name);
    console.error('error message: ', ex.message);
}

/**
 *
 * @param expectedMessage   The error that I can handle
 * @param ex                The real error met
 * @param handler           The handler who can do the job
 * @param retry             The action needs to be taken for retry after error handled
 */
function* tryHandleError(expectedMessage, ex, handler, retry, retryResult) {
    if (typeof expectedMessage === 'string') {
        expectedMessage = new RegExp('^' + expectedMessage + '$');
    }

    console.log('testing "', ex.message, '" by /', expectedMessage, '/...');
    if (!expectedMessage.test(ex.message)) {
        console.log(':( can\'t handle "', ex.message, '" by: ', expectedMessage);
        // I can't handle this
        return false;
    }

    console.log('handling "', ex.message, '" by ', expectedMessage, '...');
    // Handle it
    yield handler();

    if (retry) {
        retryResult.result = yield retry();
    }

    return true;
}

function * handleException(ex, handlers, retry, retryResult) {
    logException(ex);

    let fixed = false;

    try {
        for (let i = 0; i < handlers.length; i++) {
            if (fixed = yield tryHandleError(handlers[i].error, ex, handlers[i].handler, retry, retryResult)) {
                console.log('handled by:', handlers[i].handler);
                break;
            }
        }
    } catch (innerException) {
        logException(innerException);

        throw innerException;
    }

    if (!fixed) {
        throw ex;
    }
}

function* tryAction(action, maxRetryCount, handlers) {
    console.log('(:o) trying Action with maxRetryCount = ', maxRetryCount, '...');
    if (maxRetryCount <= 0) {
        return yield action();
    }

    try {
        return yield action();
    } catch (ex) {
        let retryResult = {};

        yield handleException(ex, handlers, function*() {
            return yield tryAction(action, maxRetryCount - 1, handlers);
        }, retryResult);

        return retryResult.result;
    }
}

module.exports = tryAction;