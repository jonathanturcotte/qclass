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

SessionTable.prototype._update = function (data) {
    var tableData = [];

    // Add in reverse order to ensure that the latest sessions
    // are at the top of the table
    for (var i = data.sessions.length - 1; i >= 0; i--) {
        var session = data.sessions[i];
        
        // Create main row 
        var $date = $('<td>', { title: session.date.toString() }).text(session.formattedDate),
            $button = $('<button>', { class: 'btn btn-default', text: 'Expand' }),
            $actions = $('<td>')
                .append($button); 

        // If there was attendance for this session, make it clickable
        if (session.attendanceCount !== 0)
            $button.click(openAttendanceModal.bind(this, session.formattedDate, session.studentList));
        else 
            $button.prop('disabled', true);

        // Add new row to table
        tableData.push([
            $date, 
            session.attendanceCountFormatted, 
            session.attendancePercentFormatted, 
            $actions
        ]);
    }

    // Fill table with formatted data
    this.fill(tableData);
};

function openAttendanceModal(date, studentList) {
    var modal = new ModalWindow({ id: 'attendance-modal', title: 'Attendance Session' });
    
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
                .append($('<th>', { text: 'Last Name' }))));
    
    var $tbody = $('<tbody>').appendTo($table);
    for (var i = 0; i < studentList.length; i++) {
        $tbody.append($('<tr>')
            .append($('<td>').text(studentList[i].NetID))
            .append($('<td>').text(studentList[i].stdNum))
            .append($('<td>').text(studentList[i].fName))
            .append($('<td>').text(studentList[i].lName)));
    }

    modal.$body.append($table);
    modal.show();
}

module.exports = SessionTable;