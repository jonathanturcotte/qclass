/**
 * Error object to be returned from routes
 * @param {Number} errorCode 
 * @param {String} message 
 */
var RouteError = function (errorCode, message) {
    this.errorCode = errorCode || 0;
    this.message = message || '';
};

module.exports = RouteError;