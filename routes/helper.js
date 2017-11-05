/**
 * Send an error from a route back to the client. 
 * Note that execution is not stopped, but the HTTP response gets sent
 * @param {Response} res
 * @param {Error=} err
 * @param {string|object} body Either an error string or a json package
 * @param {number=} status
 */
exports.sendError = function(res, err, body = 'Internal Server Error', status = 500) {
    if (isNaN(status)) {
        status = 500;
        console.warn('routes/helper.sendError() status not a number, changed to 500');
    } else if (status >= 200 && status <= 299) {
        status = 500;
        console.warn('routes/helper.sendError() status cannot be a 2xx code, changed to 500');
    } 
    if (err && err.customStatus) { // handle custom error object from one of our internal API calls
        body = err.message;
        status = err.customStatus;
        err = null;
    }
    var isBodyString = typeof(body) === 'string'; 
    console.error(`Error: ${isBodyString ? `${body} ;; ` : ''}${err || 'No exception thrown'}`);
    if (isBodyString)
        res.status(status).send(body);
    else
        res.status(status).json(body);
}

/**
 * Common regular expressions
 */
exports.regex = {
    class: {
        id: /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/,
        code: /^[A-Z]{4} [0-9]{3}[A-Z]?$/,
        name: /^[A-Za-z]+(( |-|: |:)[A-Za-z]+){0,}$/ // Note that you should still test for string length {3, 100}
    }
};