var NavBar      = require('./navbar'),
    CheckIn     = require('./student/checkin'),
    ClassList   = require('./professor/classlist'),
    ClassPage   = require('./professor/classpage'),
    ModalWindow = require('./modalwindow');

SITE_NAME = "Q-Class";

var SignInApp = function () {};

/**
 * Build some common DOM items, then determine if we should
 * build the professor site or student sign in site
 */
SignInApp.prototype.init = function () {
    document.title = SITE_NAME;
    this.navbar = new NavBar();

    this.getUserInfo();
};

/**
 * Check if this is netID belongs to a prof
 */
SignInApp.prototype.getUserInfo = function () {
    // TODO: Decide what should happen if this fails.
    // Right now we just sign out
    $.get('/general/info')
        .done(function (info) {
            console.log(info);
            info.isProf ? this.buildProfDOM() : this.buildStudentDOM(); // jshint ignore:line
        }.bind(this)).fail(this.signOut.bind(this));
};

/**
 * Build the professor DOM
 */
SignInApp.prototype.buildProfDOM = function () {
    var $container = $('.main-container');
    $container.empty();

    // Build the required div structure
    $('<div>', { class: "classlist" }).appendTo($container);
    $('<div>', { class: "classpage" }).appendTo($container);

    this.navbar.buildProfNavbar();

    this.classList = new ClassList();
    this.classList.updateClasses();

    this.classPage = new ClassPage();
};

/**
 * Build the student DOM
 */
SignInApp.prototype.buildStudentDOM = function () {
    var $container = $('.main-container');
    $container.empty();

    $('<div>', { class: "student-checkin" }).appendTo($container);
    this.navbar.buildStudentNavbar();
    this.studentCheckin = new CheckIn();
};

/**
 * Sign-out
 */
SignInApp.prototype.signOut = function () {
    // TODO - sign out from SSO and redirect to queen's page maybe?
    console.log('Signing-out.');
};

// When the page is loaded, create our main ui object
$(function () {
    window.app = new SignInApp();
    window.app.init();
});

module.exports = SignInApp;