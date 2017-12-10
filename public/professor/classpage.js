var ModalWindow  = require('../modalwindow'),
    SessionTable = require('./sessionTable'),
    Exporter     = require('./exporter'),
    Importer     = require('./importer'),
    Editable     = require('../components/editable');

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
        $nameDiv     = $('<div>'),
        $codeDiv     = $('<div>'),
        $editDiv     = $('<div>', { class: 'class-edit-div' }),
        $attDiv      = $('<div>', { class: 'class-attendance-div' }),
        $attDivLeft  = $('<div>', { class: 'class-attendance-div-left'}),
        $attDivRight = $('<div>', { class: 'class-attendance-div-right'}),
        $tableRow    = $('<div>', { class: 'row' }),
        $sessionDiv  = $('<div>', { class: 'class-session-table-div col' }),
        $studentDiv  = $('<div>', { class: 'class-student-table-div col' });

    // Construct the title and course code, and make them in-line editable
    // Wrap each in a div so that Editable can append an edit icon in-line on hover

    var $titleCode = $('<h2>', { class: 'class-title-code', text: this.course.cCode })
        .css('display', 'inline-block')
        .appendTo($codeDiv);
    var $titleName = $('<h3>', { class: 'class-title-name', text: this.course.cName })
        .css('display', 'inline-block')
        .appendTo($nameDiv);

    this.titleName = new Editable($titleName, this.course.cID, 'name', '/professor/class/editName');
    this.titleCode = new Editable($titleCode, this.course.cID, 'code', '/professor/class/editCode');

    $codeDiv.appendTo($titleDiv);
    $nameDiv.appendTo($titleDiv);
    $titleDiv.appendTo($topDiv);

    // Add the edit button
    $('<button>', { text: 'Edit Administrators', class: 'btn btn-danger btn-square btn-xl' })
        .click(editAdministrators.bind(this))
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

    // The session table and export button
    this.sessionTable = new SessionTable(this.course.cID, $sessionDiv);
    this.sessionTable.startSpinner();

    $('<button>', { class: 'class-export-button btn btn-danger btn-square btn-xl', text: 'Export Attendance' })
        .click(this.exporter.createExportModal.bind(this))
        .appendTo($sessionDiv);

    // The student table and associated buttons
    // TODO: add actual student table and stop setting width/height here
    // this.studentTable = new StudentTable(this.course.cID, $studentDiv);
    var $fakeTable = $('<div>')
        .width(600)
        .height(350)
        .appendTo($studentDiv);

    $('<button>', { text: 'Import Classlist', class: 'class-import-button btn btn-danger btn-square btn-xl' })
        .click(this.importer.createImportModal)
        .appendTo($studentDiv);

    $('<button>', { text: 'Add Student', class: 'class-addstudent-button btn btn-danger btn-square btn-xl' })
        .click(this.importer.createAddStudentModal)
        .appendTo($studentDiv);

    // Conatiner that puts the following tables in a row
    // if the view is large enough, otherwise puts them one below the other
    $tableRow.append($sessionDiv)
        .append($studentDiv);

    this.$element.append($topDiv)
        .append($attDiv)
        .append($tableRow);
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

function editTitle() {
    //TODO: complete
}

function editCode() {
    //TODO: complete
}



module.exports = ClassPage;