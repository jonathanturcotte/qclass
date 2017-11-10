/*
 * Will contain functions relating to displaying classes in the main DOM window,
 * like buttons for starting attendance, the session table, exporting attendance,
 * adding/removing students, editing the class information, import class list,
 * attendance timer duration selection 
 */

var ModalWindow = require('../modalwindow'),
    SessionTable = require('./sessionTable');

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
        this.$page = $('<div>', { class: 'classpage' })
            .append($('<h2>', { class: 'class-page-title-code', text: course.cCode }))
            .append($('<h3>', { class: 'class-page-title-name', text: course.cName }))
            .append($('<a>', { class: 'class-page-start-link', href: '#' })
                .append($('<button>', { class: 'btn btn-danger btn-circle btn-xl', text: 'Start' }))
                .click(function() {
                    var modal = new ModalWindow({ id: 'startModal', title: 'Start Attendance Session', closeable: false });
                    modal.show();
                    modal.$body.spin()
                        .addClass('spin-min-height');
                    $.post({
                        url: `/professor/class/start/${course.cID}`,
                        data: { duration: 30000 },
                        dataType: 'json'
                    }).done(function(data, status, xhr) {
                        startAttendance(data, modal);
                    }).fail(function(xhr, status, errorThrown) {
                        modal.error('Error', 'Error starting attendance session');
                    }).always(function(a, status, b) {
                        modal.$body.spin(false);
                    });
                }));
        // TODO: Finish table implementation
        // this.sessionTable = new SessionTable().build(this.$page);
        replacePage(this.$page);
        window.app.classPage = this;
    }
};

function replacePage($newPage) {
    var $classPage = $('.classpage');
    if ($classPage.length > 0) 
        $classPage.replaceWith($newPage);
    else 
        $newPage.appendTo($('.main-container'));
}

function startAttendance(data, modal) {
    modal.$header.find($('.modal-title')).text('Running Attendance Session');
    modal.appendToBody([
        $('<p>', { class: '.start-modal-top-info', text: 'Success!' }),
        $('<div>', { class: 'flex flex-start' })
            .append($('<div>', { class: 'start-modal-running-info' })
                .append($('<h3>', { class: 'start-modal-code', text: data.code })))
            .append($('<div>', { class: 'start-modal-timer-container' }))
                .append($('<h2>', { class: 'start-modal-timer' }))
    ], true);
    
    // Countdown Timer
    modal.$body.find($('.start-modal-timer'))
        .countdown(data.endTime, function(e) {
            $(this).text(e.strftime('%-H:%M:%S'));
        }).on('finish.countdown', function(e) {
            modal.success('Complete');
            modal.$body.find('.start-modal-top-info')
                .text('Session complete!')
                .addClass('.start-modal-top-info-finished')
        }).countdown('start');
}

module.exports = ClassPage;