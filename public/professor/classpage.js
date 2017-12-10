var ModalWindow  = require('../modalwindow'),
    SessionTable = require('./sessionTable'),
    Exporter     = require('./exporter'),
    Importer     = require('./importer');

/**
 * Creates a class page, responsible for the central window of the professor site
*/
var ClassPage = function() {
    this.$element = $('.classpage');
    this.exporter = new Exporter();
    this.importer = new Importer();
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
};

///////////////////////
// Private Functions //
///////////////////////

/**
 * Builds the classpage, adds it to the DOM
 */
function build () {
    var $topDiv      = $('<div>', { class: 'class-top-div' }),
        $titleDiv    = $('<div>', { class: 'class-title-div' }),
        $editDiv     = $('<div>', { class: 'class-edit-div' }),
        $attDiv      = $('<div>', { class: 'class-attendance-div' }),
        $attDivLeft  = $('<div>', { class: 'class-attendance-div-left'}),
        $attDivRight = $('<div>', { class: 'class-attendance-div-right'}),
        $exportDiv   = $('<div>', { class: 'class-export-div' }),
        $sessionDiv  = $('<div>', { class: 'class-session-table-div' });

    // Construct the title and course code
    $('<h2>', { class: 'class-title-code', text: this.course.cCode }).appendTo($titleDiv);
    $('<h3>', { class: 'class-title-name', text: this.course.cName }).appendTo($titleDiv);
    $titleDiv.appendTo($topDiv);

    // Add the edit button
    $('<button>', { class: 'edit-btn btn btn-danger btn-square btn-xl', text: 'Edit Class' })
        .click(editClass.bind(this))
        .appendTo($editDiv);
    $editDiv.appendTo($topDiv);

    // The attendance div and options
    $('<label>', { text: 'Start an attendance session:', class: 'class-attendance-label' })
    .appendTo($attDiv);

    $('<button>', { class: 'btn btn-danger btn-circle btn-xl', text: 'Start' })
        .click(startAttendance.bind(this))
        .appendTo($attDivLeft);

    $('<label>', { text: 'Check-in duration:', class: 'class-duration-label' })
        .appendTo($attDivRight);
    $('<select>', { class: 'class-duration-select' }).appendTo($attDivRight);


    $attDivLeft.appendTo($attDiv);
    $attDivRight.appendTo($attDiv);

    // The export button
    $('<button>', { class: 'class-export-button btn btn-danger btn-square btn-xl', text: 'Export Attendance' })
        .click(this.exporter.createExportModal.bind(this))
        .appendTo($exportDiv);

    // The session table
    this.sessionTable = new SessionTable(this.course.cID, $sessionDiv);

    this.$element.append($topDiv)
        .append($attDiv)
        .append($sessionDiv)
        .append($exportDiv);
}


// Opens the edit class modal, allowing the professor to
// change the class name/code, view enrolled students,
// remove an enrolled student, add a new student, and 
// import a classlist.
function editClass() {
    var modal = new ModalWindow({ id: 'editModal', title: 'Edit Class' });
    $cCodeInput   = $('<input>', { type: 'text', name: 'cCode', id: 'cCode' }),
    $cCodeDiv     = $('<div>', { class: 'edit-code-div' }),
    $cNameInput   = $('<input>', { type: 'text', name: 'cName', id: 'cName' }),
    $cNameDiv     = $('<div>', { class: 'edit-name-div' }),
    $buttonDiv    = $('<div>', { class: 'edit-button-div container' }),
    $submitButton = $('<button>', { type: 'submit', class: 'btn btn-primary',  text: 'Submit', id: 'submitEditClasses' });

    $cCodeDiv.append($('<label>', { text: 'Course code: ' }))
        .append($cCodeInput);
    $cNameDiv.append($('<label>', { text: 'Course name: ' }))
        .append($cNameInput);

    // Add the row of buttons
    var $row = $('<div>', { class: 'row' });

    // Import classlist button
    $('<div>', { class: 'col' }).append(
        $('<button>', { text: 'Import Classlist', class: 'btn btn-danger btn-square btn-xl' })
            .click(this.importer.createImportModal)
    ).appendTo($row);

    // Add student button
    $('<div>', { class: 'col' }).append(
        $('<button>', { text: 'Add Student', class: 'btn btn-danger btn-square btn-xl' })
            .click(this.importer.createAddStudentModal)
    ).appendTo($row);

    // Edit course administrators button
    $('<div>', { class: 'col' }).append(
    $('<button>', { text: 'Administrators', class: 'btn btn-danger btn-square btn-xl' })
        .click(editAdministrators.bind(this))
    ).appendTo($row);
    $buttonDiv.append($row);

    modal.$body.append($cCodeDiv)
        .append($cNameDiv)
        .append($buttonDiv);

    modal.$footer
        .prepend($submitButton);

    // $submitButton
    //     .click(function () {
    //         $submitButton.remove();
    //         modal.$body.empty();
    //         modal.$body
    //             .spin()
    //             .addClass('spin-min-height');

    //         $.post({
    //             url: '/professor/class/add',
    //             data: { code: $cCodeInput.val(), name: $cNameInput.val() },
    //             dataType: 'json'
    //         }).done(function(status, xhr) {
    //             modal.success("Success", $cCodeInput.val() + ' successfully added!');
    //             window.app.classList.updateClasses();
    //         }).fail(function(xhr, status, errorThrown) {
    //             modal.error("Error", xhr.responseText);
    //         }).always(function(a, status, b) {
    //             modal.$body.spin(false);
    //         });
    //     });
    modal.show();
}

// Creates the attendance modal window, makes the call
// to the server to start a session.
function startAttendance() {
    var modal  = new ModalWindow({ id: 'startModal', title: 'Start Attendance Session' }),
        course = this.course;

    modal.show();
    modal.$body.spin()
        .addClass('spin-min-height');

    $.post({
        url: '/professor/class/start/' + course.cID,
        data: { duration: 30000 },
        dataType: 'json'
    }).done(function(data, status, xhr) {
        showAttendanceInfo.call(this, data, modal);
    }.bind(this))
    .fail(function(xhr, status, errorThrown) {
        if (xhr.status === 409)
            modal.error('Error - Running', 'A session is already running for ' + course.cCode);
        else modal.error('Error', 'Error starting attendance session');
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
    modal.$closeButton.text('Hide');

    $finishButton = $('<button>', { class: 'btn btn-danger', text: 'Finish' })
        .click(function() {
            $finishButton.addClass('disabled');
            $timerText.countdown('stop');
            modal.$body.spin();
            $.post({
                url: 'professor/class/stop/' + this.course.cID
            }).done(function(data, status, xhr) {
                $timerContainer
                    .empty()
                    .append($('<div>', { text: 'Ended session successfully.', style: 'padding-top: 5px' }));
            }).fail(function(xhr, status, errorThrown) {
                var text = 'Error ending session';
                if (xhr.responseText) text += ': ' + xhr.responseText;
                else text += '!';
                $timerContainer
                    .empty()
                    .append($('<div>', { class: 'text-danger' })
                    .html(text));
            }).always(function(a, status, b) {
                modal.$body.spin(false);
                $finishButton.hide();
                modal.$closeButton
                    .text('Close')
                    .show();
            });
        }.bind(this));
    modal.$footer.append($finishButton);
    
    // Countdown Timer
    $timerText.countdown(data.endTime, function(e) {
        $(this).text(e.strftime('%-H:%M:%S'));
    }).on('finish.countdown', function(e) {
        modal.$title.text('Complete');
        $finishButton.hide();
        $timerInfo
            .text('Session complete!')
            .addClass('.start-modal-top-info-finished');
    }).countdown('start');

    // Refresh the session table when the attendance session is closed
    modal.$closeButton.click(this.sessionTable.updateSessions.bind(this.sessionTable));
}

function editAdministrators() {
    //TODO: complete
}

module.exports = ClassPage;