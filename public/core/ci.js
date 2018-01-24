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
        method: options.method || 'GET',
        dataType: options.dataType || 'json'
    };

    // For each other option, set the same option for the jQuery
    // AJAX call
    for (var property in options){
        // Skip the done, fail, and always functions
        if (!_.contains['done', 'fail', 'always'], property)
            args[property] = options[property];
    }
    console.log(args);

    $.ajax(args).done(function(data, status, xhr){
        console.log(data);
        // Check if the server wants us to redirect
        if (data.redirect)
            window.location.href = data.redirect;
        else
            options.done(data, status, xhr);
    }).fail(function(xhr, status, errorThrown){
        // Add generic toastr error
        if (options.hasOwnProperty('fail'))
            options.fail(xhr, status, errorThrown);
    }).always(function(a, status, b){
        if (options.hasOwnProperty('always'))
            options.always(a, status, b);
    })
}

module.exports = CI;
