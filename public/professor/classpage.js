/*
 * Will contain functions relating to displaying classes in the main DOM window,
 * like buttons for starting attendance, the session table, exporting attendance,
 * adding/removing students, editing the class information, import class list,
 * attendance timer duration selection 
 */

var ModalWindow  = require('../modalwindow'),
    SessionTable = require('./sessionTable');

/**
 * Creates a class page, responsible for the central window of the professor site
*/
var ClassPage = function() {
    this.$element = $('.classpage');
};
/**
 * Display's a course page given the course object
 * @param {Object} course The selected course the page should use to construct itself 
 * @param {string} course.cID
 * @param {string} course.cName
 * @param {string} course.cCode
*/
ClassPage.prototype.displayCourse = function (course) {
    this.course = course;

    // Clear the old page
    this.$element.empty();
    build.call(this);

    // Create the appropriate session table
    this.sessionTable = new SessionTable(this.course.cID, this.$element);
    this.sessionTable.startSpinner();
};

///////////////////////
// Private Functions //
///////////////////////

/**
 * Builds the classpage, adds it to the DOM
 */
function build () {
    this.$element
        .append($('<h2>', { class: 'class-page-title-code', text: this.course.cCode }))
        .append($('<h3>', { class: 'class-page-title-name', text: this.course.cName }))
        .append($('<a>', { class: 'class-page-start-link', href: '#' }) // Start button
            .append($('<button>', { class: 'btn btn-danger btn-circle btn-xl', text: 'Start' }))
            .click(startAttendance.bind(this, this.course.cID)));
}

// Creates the attendance modal window, makes the call
// to the server to start a session.
function startAttendance(courseID) {
    var modal = new ModalWindow({ id: 'startModal', title: 'Start Attendance Session' });

    modal.show();
    modal.$body.spin()
        .addClass('spin-min-height');

    $.post({
        url: '/professor/class/start/' + courseID,
        data: { duration: 30000 },
        dataType: 'json'
    }).done(function(data, status, xhr) {
        showAttendanceInfo.call(this, data, modal);
    }.bind(this))
    .fail(function(xhr, status, errorThrown) {
        modal.error('Error', 'Error starting attendance session');
    }).always(function(a, status, b) {
        modal.$body.spin(false);
    });
}

// Updates a modal window with an attendance sessions' info
function showAttendanceInfo(data, modal) {
    var $timerInfo = $('<div>', { class: 'start-modal-running-info' })
            .append($('<h3>', { class: 'start-modal-code', text: "Code: " + data.code.toUpperCase() })),
        $timerText = $('<h3>', { class: 'start-modal-timer' }),
        $timerContainer = $('<div>', { class: 'start-modal-timer-container' })
            .append($timerText);
    
    modal.success('Running Attendance Session');
    modal.appendToBody([
        $('<p>', { class: 'start-modal-top-info' }),
        $('<div>', { class: 'flex flex-start' })
            .append($timerInfo)
            .append($timerContainer)
    ], true);
    modal.$closeButton.hide();
    $finishButton = $('<button>', { class: 'btn btn-danger', text: 'Finish' })
        .click(function() {
            $finishButton.addClass('disabled');
            $timerText.countdown('stop');
            modal.$body.spin();
            $.post({
                url: 'professor/class/stop/' + this.course.cID
            }).done(function(data, status, xhr) {
                $timerContainer.empty().append($('<div>')
                    .html('Ended session successfully'));
            }).fail(function(xhr, status, errorThrown) {
                var text = 'Error ending session';
                if (xhr.responseText) text += ': ' + xhr.responseText;
                else text += '!';
                $timerContainer.empty().append($('<div>', { class: 'text-danger' })
                    .html(text));
            }).always(function(a, status, b) {
                modal.$body.spin(false);
                $finishButton.hide();
                modal.$closeButton.show();
            });
        }.bind(this));
    modal.$footer.append($finishButton);
    
    // Countdown Timer
    $timerText.countdown(data.endTime, function(e) {
            $(this).text(e.strftime('%-H:%M:%S'));
        }).on('finish.countdown', function(e) {
            modal.$title.text('Complete');
            $finishButton.hide();
            modal.$closeButton.show();
            $timerInfo
                .text('Session complete!')
                .addClass('.start-modal-top-info-finished');
        }).countdown('start');
}

module.exports = ClassPage;