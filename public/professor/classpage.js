/*
 * Will contain functions relating to displaying classes in the main DOM window,
 * like buttons for starting attendance, the session table, exporting attendance,
 * adding/removing students, editing the class information, import class list,
 * attendance timer duration selection 
 */

var ModalWindow = require('../modalwindow');

/**
 * Creates a class page, responsible for the central window of the professor site
 * @param {Object} course The selected course the page should use to construct itself 
 * @param {string} course.cID
 * @param {string} course.cName
 * @param {string} course.cCode
 */
var ClassPage = function(course) {
    if (!course) throw new Error('ClassPage received empty course');
    this.course = course;  

    /**
     * Builds the classpage, adds it to the DOM, and updates window.app.classPage
     */
    this.build = function() {
        replacePage(
            $('<div>', { id: 'classpage', class: 'classpage' })
                .append($('<h2>', { class: 'class-page-title-code', text: course.cCode }))
                .append($('<h3>', { class: 'class-page-title-name', text: course.cName }))
                .append($('<a>', { class: 'class-page-start-link', href: '#' })
                    .append($('<button>', { class: 'btn btn-danger btn-circle btn-xl', text: 'Start' }))
                    .click(function() {
                        var modal = new ModalWindow({ id: 'startModal', title: 'Start Attendance Session', closeable: false });
                        modal.show();
                    }))
        );
        window.app.classPage = this;
    }

    /**
     * Replaces #classpage with an empty classpage div
     */
    this.clear = function() {
        replacePage($('<div>', { id: 'classpage', class: 'classpage' }));        
    };
};

function replacePage($newPage) {
    var $classPage = $('#classpage');
    if ($classPage.length > 0) 
        $classPage.replaceWith($newPage);
    else 
        $newPage.appendTo($('#container'));
}

module.exports = ClassPage;