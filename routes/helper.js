exports.getRenderName = function(prefix, suffix) {
    return `${prefix}/${suffix}`;  
} 

/**
 * Send an error from a route back to the client. 
 * The errMsg is returned to the client, and the http code is specified in status.
 * If err is defined, it will be thrown and the request will stop executing.
 */
exports.sendError = function (res, err, errMsg = 'Error - Unspecified', status = 500) {
    console.log(errMsg);
    res.send(status, errMsg);
    if (err) throw err;
}

/**
 * Run regex test on value, sends HTTP 422 and optional errMsg to client on failure.
 * Returns success of regular expression test.
 */
exports.paramRegex = function(res, value, regex, errMsg = 'Invalid parameter') {
    if (!regex.test(value)) {
        res.send(422, errMsg);
        return false;
    }
    return true;
};

/**
 * Common regular expressions
 */
exports.regex = {
    classId: /^[a-z0-9]{8}-[a-z0-9]{4}-4[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{12}$/
};