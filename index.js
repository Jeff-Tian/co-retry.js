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
function* tryHandleError(expectedMessage, ex, handler, retry) {
    if (typeof expectedMessage === 'string') {
        expectedMessage = new RegExp('^' + expectedMessage + '$');
    }

    if (!expectedMessage.test(ex.message)) {
        // I can't handle this
        return false;
    }

    // Handle it
    yield handler();

    if (retry) {
        yield retry();
    }

    return true;
}

function * handleException(ex, handlers, retry) {
    logException(ex);

    let fixed = false;

    try {
        for (let i = 0; i < handlers.length; i++) {
            if (fixed = yield tryHandleError(handlers[i].error, ex, handlers[i].handler, retry)) {
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
    if (maxRetryCount <= 0) {
        return yield action();
    }

    try {
        return yield action();
    } catch (ex) {
        yield handleException(ex, handlers, function*() {
            return yield tryAction(action, maxRetryCount - 1, handlers);
        });
    }
}

module.exports = tryAction;