/**
 * Will be used to build and display a class list for the professors
 * will ajax call to get the class list
 * $.get('/professor/classes').done(this.successCallback)
 * .fail(this.failedCallback)
 * .always(this.alwaysCallback)
 *
 * // jqXHR is the big network wad they give back
 * // textStatus is 500 - Internal server error, etc.
 * prototype.successCallback = function (data, textStatus, jqXHR) {}
 *
 * // textStatus and errorThrown are strings
 * prototype.failCallback = function (jqXHR, textStatus, errorThrown) {}
 */