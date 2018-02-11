var ModalWindow = require('../components/modalwindow'),
    Table       = require('../components/table');

/**
 * Creates a session table that displays attendance sessions
 * @param {String} classID    The ID of the class whose sessions should be shown
 * @param {Object} $container jQuery object to which the table will be appended
 */
var SessionTable = function(course, $appendTarget) {
    Table.call(this, {
        classList: ['session-table'], 
        height: 300, 
        width: 425,
        columns: [
            ['Date', 156], 
            ['Attendance', 106], 
            ['Rate', 68], 
            ['Actions', 95]
        ], 
        $appendTarget: $appendTarget
    });
    this.course = course;
};
SessionTable.prototype = Object.create(Table.prototype);
SessionTable.prototype.constructor = SessionTable;

SessionTable.prototype.update = function (data) {
    var tableData = [];

    // Persist/update the data
    this.data = data;
    // Disable/enable export button
    if(Object.keys(data.sessions).length > 0) {
        enableExport();
    } else {
        disableExport();
    }
    // Add in reverse order to ensure that the latest sessions
    // are at the top of the table
    for (var i in data.sessions) {
        var session = data.sessions[i];
        
        // Create main row 
        var $date = $('<td>', { title: session.date.toString(), text: session.formattedDate }),
            $expandButton = $('<button>', { class: 'btn btn-default btn-sm', style: 'margin-right: 3px;', title: 'Expand' })
            .append($('<div>', { class: 'table-row-expand', text: '\u21f1' }) // Unicode arrow icon
                    .attr('aria-hidden', 'true')),
            $deleteButton = $('<button>', { class: 'btn btn-default btn-sm', title: 'Delete' })
                .append($('<b>', { class: 'table-row-delete', text: '\u2715' }) // Unicode multiplication icon
                        .attr('aria-hidden', 'true'))
                .click(openDeleteModal.bind(this, session)),
            $actions = $('<td>')
                .append($expandButton)
                .append($deleteButton);

        // Make the expand button only clickable if there actually was attendance
        if (session.attendance !== 0)
            $expandButton.click(openAttendanceModal.bind(this, session.formattedDate, session.students));
        else 
            $expandButton.prop('disabled', true);

        // Add new row to table
        tableData.unshift([
            $date, 
            session.attendanceFormatted, 
            session.attendancePercentFormatted, 
            $actions
        ]);
    }

    // Fill table with formatted data
    this.fill(tableData);
    updateCount(Object.keys(data.sessions).length);
};

function openDeleteModal(session) {
    var modal         = new ModalWindow({ title: 'Remove Session?' }),
        $deleteButton = $('<button>', { text: 'Delete', class: 'btn btn-danger' });

    $deleteButton.click(tryRemoveSession.bind(this, $deleteButton, modal, session));

    modal.$body.append($('<p>', { text: 'Are you sure you want to remove the session run on ' + session.formattedDate +
        ' with ' + session.attendanceFormatted + ' students in attendance?' }));
    modal.$footer.prepend($deleteButton);
    modal.$closeButton.text('Cancel');
}

function tryRemoveSession($deleteButton, modal, session) {
    // TODO: get spinning button working
    $deleteButton.prop('disabled', true);
    modal.$body.empty().spin();
    removeSession.call(this, $deleteButton, modal, session);
}

function removeSession($deleteButton, modal, session) {
    $.ajax({
        url: 'professor/class/' + this.course.cID + '/remove-session/' + session.time,
        type: 'DELETE'
    })
    .done(function(data, status, xhr) {
        modal.$title.text('Session Removed');
        modal.$header.addClass('modal-header-success');
        modal.$body.empty().append($('<p>', { text: 'Session run on ' + session.formattedDate + ' was removed!' }));
        window.app.classPage.refreshTables();
    }.bind(this))
    .fail(function(xhr, status, errorThrown) {
        modal.$title.text('Remove Session Failed');
        modal.$header.addClass('modal-header-danger');
        modal.$body.empty().append($('<p>', { text: xhr.responseStatus !== 500 && xhr.responseText ? xhr.responseText : 'Something went wrong while removing the session' }));
    }.bind(this))
    .always(function(a, status, b) {
        $deleteButton.remove();
        modal.$closeButton.text('Close');
    });
}

function openAttendanceModal(date, sessionStudents) {
    var modal    = new ModalWindow({ id: 'attendance-modal', title: 'Attendance Session' });
    
    modal.$body.append($('<h5>', { 
        text: date, 
        class: 'attendance-modal-date table-modal-bodytitle' 
    }));
    modal.$body.addClass('table-modal-body');
    
    var $table = new Table({ 
        height: 250,
        width: 461,
        columns: [
            ['NetID', 81],
            ['Student #', 90],
            ['First Name', 100],
            ['Last Name', 100],
            ['Attended', 90]
        ],
        $appendTarget: modal.$body
    });
      
    // Create and fill the tbody with the students who attended
    var tableData = [];
    for (var i in sessionStudents) {
        var student      = this.data.students[sessionStudents[i].netID],
            attendedText = sessionStudents[i].attended ? '\u2714' : '\u2716'
        tableData.push([
                student.netID,
                student.stdNum,
                student.fName,
                student.lName, 
                attendedText]);
    }
    $table.fill(tableData);
    modal.show();
}

// Disable export button
function disableExport() {
    var $exportButtonDiv = $('.exp-button-div'),
        $exportButton    = $('.class-export-button');

    $exportButtonDiv.attr({
        'data-toggle'    : 'tooltip',
        'data-placement' : 'top',
        'title'          : 'No session history to export'
    }).tooltip();

    $exportButton.addClass('disabled')
        .css('pointer-events', 'none');

}

// Reenable expot button
function enableExport() {
    var $exportButtonDiv = $('.exp-button-div'),
        $exportButton    = $('.class-export-button');

    $exportButtonDiv.removeAttr('title')
        .removeAttr('data-toggle')
        .removeAttr('data-placement')
        .tooltip('dispose');

    $exportButton.removeClass('disabled')
        .css('pointer-events', 'auto');
}

function updateCount(count) {
    var $totalSession = $('.total-session');

    $totalSession.text('Total: ' + count);
}

module.exports = SessionTable;