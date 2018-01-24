/**
 * Connection Interface
 */

var CI = function () {}

/**
 * Provide a unified AJAX call that will handle errors *
 * and redirects properly
 */
CI.prototype.ajax = function (options) {
    var args = {
        method   : options.method   || 'GET',
        dataType : options.dataType || 'json'
    };

    // For each other option, set the same option for the jQuery
    // AJAX call
    for (var property in options){
        // Skip the done, fail, and always functions
        if (! _.contains(['done', 'fail', 'always'], property))
            args[property] = options[property];
    }

    $.ajax(args).done(function(data, status, xhr){
        // Check if the server wants us to redirect
        if (data.redirect)
            window.location.href = data.redirect;
        else
            options.done(data, status, xhr);
    }).fail(function(xhr, status, errorThrown){
        var args = {
            'timeOut': '0',
            'extendedTimeOut': '0',
            'toastClass': 'toast toast-session-error'
        };

        if (xhr.readyState === 4) {
            // HTTP error, usually this is us passing an error along to the front end
            // provided we were expecting that it might fail
            if (options.hasOwnProperty('fail'))
                options.fail(xhr, status, errorThrown);
        } else if (xhr.readyState === 0) {
            // Network error (i.e. connection refused, access denied due to CORS, etc.)
            toastr.error('Check internet connection and refresh the page', 'Error connecting to server', args);
        } else {
            // Otherwise something weird is happening
            toastr.error('Try refreshing the page', 'Unknown error', args);
        }
    }).always(function(a, status, b){
        if (options.hasOwnProperty('always'))
            options.always(a, status, b);
    })
}

module.exports = CI;
