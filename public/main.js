var NavBar = require('./navbar');

var SignInApp = function () {
    this.SiteName = "Q-Class";
};

/**
 * Build some common DOM items, then determine if we should
 * build the professor site or student sign in site
 */
SignInApp.prototype.init = function () {
    this.navbar = new NavBar();

    this.isProfessor() ? this.buildProfDOM() : this.buildStudentDOM(); // jshint ignore:line
};

/**
 * Returns true if a given user id is a professor
 * In reality, currently not sure if we'd do this or SSO could do this
 * @param {*} id 
 */
SignInApp.prototype.isProfessor = function (id) {
    //TODO - unstub
    return true;
};

/**
 * Build the professor DOM
 */
SignInApp.prototype.buildProfDOM = function () {

};

/**
 * Build the student DOM
 */
SignInApp.prototype.buildStudentDOM = function () {
    
};


/**
 * Build the professors class list
 */
SignInApp.prototype.buildClassList = function () {

};

// When the page is loaded, create our main ui object
$(document).ready(function () {
    window.app = new SignInApp();
    window.app.init();
});

module.exports = SignInApp;