var ModalWindow = require('../modalwindow');

var SessionManager = function () {
    this.sessions = [];
};

// Creates the attendance modal window, makes the call
// to the server to start a session.
SessionManager.prototype.startSession = function (course) {
    var session = createSession(course);

    session.modal.show();
    session.modal.$body.spin()
        .addClass('spin-min-height');

    $.post({
        url: '/professor/class/start/' + course.cID,
        data: { duration: 30000 },
        dataType: 'json'
    }).done(function(data, status, xhr) {
        // This is a valid session, so append it's information to the session
        $.extend(session, data);
        this.sessions.push(session);
        buildModal.call(this, session);
        this.showSession(course);
    }.bind(this))
    .fail(function(xhr, status, errorThrown) {
        if (xhr.status === 409)
            session.modal.error('Error - Already Running', 'A session is already running for ' + course.cCode);
        else
            session.modal.error('Error', 'Error starting attendance session');
    }).always(function(a, status, b) {
        session.modal.$body.spin(false);
    });
};

SessionManager.prototype.endSession = function(course){
    // Get the session associated with the course
    var session = getSession(course, this.sessions);

    // Make sure there actually is a session for this course ongoing
    if (session){
        // Display the modal if it's currently hidden
        session.modal.show();

        // TODO: Remove the notification if it's present
        
        var $timerContainer = $('.start-modal-timer-container'),
            $timerText      = $('.start-modal-timer');

        // Tell the server to end the session
        session.modal.$finishButton.addClass('disabled');
        $timerText.countdown('stop');
        session.modal.$body.spin();
        
        $.post({
            url: 'professor/class/stop/' + session.course.cID
        }).done(function(data, status, xhr) {
            // On success, show completion
            displaySessionEnded.call(this, session);
        }).fail(function(xhr, status, errorThrown) {
            // On failure, display the error
            var text = 'Error ending session';
            if (xhr.responseText)
                text += ': ' + xhr.responseText;
            else
                text += '!';

            $timerContainer.empty()
                .append($('<div>', { class: 'text-danger' })
                .html(text));
        }).always(function(a, status, b) {
            // Remove the finish button, remove the hide button
            // Make the modal closeable
            session.modal.$body.spin(false);
        });
    }
};

SessionManager.prototype.hideSession = function (course) {
    // Get the session associated with the course
    var session = getSession(course, this.sessions);

    // Hide the modal window
    session.modal.hide();

    // Make sure that we don't bother opening a notification
    // for a session that is finished
    if (Date.now() < session.endTime){
        // Override the default toastr notifications so that this doesn't
        // automatically get dismissed. On click re-open the attendance modal
        var options = {
            'timeOut': '0',
            'extendedTimeOut': '0',
            'onclick': function () { this.showSession(course); }.bind(this)
        };

        toastr.info('Code: ' + session.code.toUpperCase(), 'Running session for ' + session.course.cCode, options);
    }
};

SessionManager.prototype.showSession = function (course) {
    // Get the session associated with the course
    var session = getSession(course, this.sessions);

    if (session) {      
        session.modal.show();
    }
};

///////////////////////
// Private Functions //
///////////////////////

function buildModal(session) {
    var $timerInfo = $('<div>', { class: 'start-modal-running-info' })
        .append($('<h3>', { class: 'start-modal-code', text: "Code: " + session.code.toUpperCase() })),
    $timerText = $('<h3>', { class: 'start-modal-timer' }),
    $timerContainer = $('<div>', { class: 'start-modal-timer-container' })
        .append($timerText);

    session.modal.success('Running Attendance Session');
    session.modal.appendToBody([
        $('<p>', { class: 'start-modal-top-info' }),
        $('<div>', { class: 'flex flex-start' })
            .append($timerInfo)
            .append($timerContainer)
    ], true);

    // Hide button starts the persistent notification and hides the modal
    session.modal.$hideButton = $('<button>', { class: 'btn', text: 'Hide'});
    session.modal.$hideButton.click(function (s) { this.hideSession(s.course); }.bind(this, session))
        .appendTo(session.modal.$footer);

    session.modal.$finishButton = $('<button>', { class: 'btn btn-danger', text: 'Finish' })
        .click(function (s) { this.endSession(s.course); }.bind(this, session))
        .appendTo(session.modal.$footer);

    // Countdown Timer
    $timerText.countdown(session.endTime, function(e) {
        $(this).text(e.strftime('%-H:%M:%S'));
    }).on('finish.countdown', function (s) { displaySessionEnded.call(this, s); }.bind(this, session))
        .countdown('start');
}

function displaySessionEnded(session) {
    // Display the modal if it's currently hidden
    session.modal.show();
    
    var $timerContainer = $('.start-modal-timer-container');

    // TODO: Remove the notification if it's present


    session.modal.$title.text('Session Complete');
    $timerContainer
        .empty()
        .append($('<div>', { text: 'Ended session successfully.', style: 'padding-top: 5px' }));

    session.modal.$finishButton.hide();
    session.modal.$hideButton.hide();
    session.modal.makeCloseable();

    // Refresh the session table when the attendance modal is closed,
    // if the user is still on that classpage
    session.modal.$closeButton.click(function () {
        if (session.course.cID === window.app.classPage.course.cID){
            window.app.classPage.sessionTable.updateSessions();
        }

        // Always remove the session from the session manager
        this.sessions = _.without(this.sessions, session);
    }.bind(this));
}

function createSession(course) {
    return {
    course  : course,
    modal   : new ModalWindow({ id: 'startModal', title: 'Start Attendance Session', closeable: false }),
    code    : '',
    endTime : 0
    };
}

function getSession(course, sessions) {
    for (var i = 0; i < sessions.length; i++){
        if (sessions[i].course.cID === course.cID){
            return sessions[i];
        }
    }
}

module.exports = SessionManager;