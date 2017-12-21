var ModalWindow = require('../modalwindow'),
    Table       = require('../components/table');

/**
 * Creates a session table that displays attendance sessions
 * @param {String} classID    The ID of the class whose sessions should be shown
 * @param {Object} $container jQuery object to which the table will be appended
 */
var SessionTable = function(course, $appendTarget) {
    Table.call(this,
        course,
        ['session-table'], 
        300, 
        385, 
        [
            ['Date', 140], 
            ['Attendance', 96], 
            ['Rate', 66], 
            ['Actions', 87]
        ], 
        $appendTarget
    );
};
SessionTable.prototype = Object.create(Table.prototype);
SessionTable.prototype.constructor = SessionTable;

SessionTable.prototype.update = function (data) {
    var tableData = [];

    // Persist/update the data
    this.data = data;

    // Add in reverse order to ensure that the latest sessions
    // are at the top of the table
    for (var i in data.sessions) {
        var session = data.sessions[i];
        
        // Create main row 
        var $date = $('<td>', { title: session.date.toString(), text: session.formattedDate }),
            $button = $('<button>', { class: 'btn btn-default btn-sm', title: 'Expand' })
                .append($('<i>', { class: 'fas fa-external-link-alt' })
                    .attr('aria-hidden', 'true')),
            $actions = $('<td>')
                .append($button); 

        // If there was attendance for this session, make it clickable
        if (session.attendance !== 0)
            $button.click(openAttendanceModal.bind(this, session.formattedDate, session.students));
        else 
            $button.prop('disabled', true);

        // Add new row to table
        tableData.push([
            $date, 
            session.attendanceFormatted, 
            session.attendancePercentFormatted, 
            $actions
        ]);
    }

    // Fill table with formatted data
    this.fill(tableData);
};

function openAttendanceModal(date, sessionStudents) {
    var modal    = new ModalWindow({ id: 'attendance-modal', title: 'Attendance Session' });
    
    modal.$body.append($('<h5>', { 
        text: date, 
        class: 'attendance-modal-date table-modal-bodytitle' 
    }));
    modal.$body.addClass('table-modal-body');
    
    var $table = $('<table>', { class: 'attendance-modal-table centered-table table-bordered' })
        .append($('<thead>')
            .append($('<tr>')
                .append($('<th>', { text: 'NetID' }))
                .append($('<th>', { text: 'Student #' }))
                .append($('<th>', { text: 'First Name' }))
                .append($('<th>', { text: 'Last Name' }))
                .append($('<th>', { text: 'Attended' }))));
    
    // Create and fill the tbody with the students who attended
    var $tbody = $('<tbody>').appendTo($table);
    for (var i in sessionStudents) {
        var student      = this.data.students[sessionStudents[i].netID],
            attendedText = sessionStudents[i].attended ? '\u2714' : '\u2716',
            $tr          = $('<tr>')
                .append($('<td>', { text: student.netID }))
                .append($('<td>', { text: student.stdNum }))
                .append($('<td>', { text: student.fName }))
                .append($('<td>', { text: student.lName }))
                .append($('<td>', { text: attendedText }));

        $tbody.append($tr);
    }

    modal.$body.append($table);
    modal.show();
}

module.exports = SessionTable;