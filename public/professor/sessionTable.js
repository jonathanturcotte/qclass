var ModalWindow = require('../modalwindow'),
    Table = require('../components/table');

/**
 * Creates a session table that displays attendance sessions
 * @param {String} classID    The ID of the class the table will show sessions of
 * @param {Object} $container jQuery object to which the table will be appended
 */
var SessionTable = function(classID, $appendTarget) {
    this.classID  = classID;
    this.table = new Table(['session-table'], 300, 200, ['Date', 'Attendance', 'Rate', 'Actions'], $appendTarget);
    this.updateSessions();
};

SessionTable.prototype.updateSessions = function () {
    $.get('/professor/' + this.classID + '/attendanceSessions')
        .done(updateTable.bind(this))
        .fail(failTable.bind(this));
}

///////////////////////
// Private Functions //
///////////////////////

function updateTable(data, status, xhr) {
    var tableData = [];
    this.data = data;

    // Add in reverse order to ensure that the latest sessions
    // are at the top of the table
    for (var i = this.data.sessions.length - 1; i >= 0; i--) {
        var session = this.data.sessions[i];

        session.date               = new Date(session.sessDate);
        session.attendanceCount    = session.studentList.length;
        session.attendancePercent  = 0,
        session.formattedDate = formatDate(session.date);

        var isEmpty = session.attendanceCount < 1;
        if (!isEmpty)
            session.attendancePercent = session.attendance / this.data.numEnrolled * 100;
        else
            session.attendancePercent = 0;
        
        // Create main row 
        var $date = $('<td>', { title: session.date.toString() }).text(session.formattedDate),
            $button = $('<button>', { class: 'btn btn-default', text: 'Expand' }),
            $actions = $('<td>')
                .append($button); 

        // If there was attendance for this session, make it clickable
        if (!isEmpty) {
            $button.click(openAttendanceModal.bind(this, session.formattedDate, session.studentList));
        } else {
            $button.prop('disabled', true);
        }

        // Store session data for future use
        this.data.sessions[i] = session;

        // Add new row to table
        tableData.push([
            $date, 
            session.attendanceCount + '/' + session.studentList.length, 
            session.attendancePercent.toFixed(1) + ' %', 
            $actions
        ]);
    }
    // Fill table with formatted data
    this.table.fill(tableData);
}

function failTable(xhr, status, errorThrown) {
    this.table.error('Error getting attendance sessions: ' + status);
}

function openAttendanceModal(date, studentList) {
    var id = 'attendance-modal';
    var modal = new ModalWindow({ id: id, title: 'Attendance Session' });
    modal.$body.append($('<h5>', { text: date, class: 'attendance-modal-date' }));
    modal.$body.addClass('attendance-modal-body');
    var $table = $('<table>', { class: 'attendance-modal-table centered-table table-bordered' })
        .append($('<thead>')
        .append($('<tr>')
            .append($('<th>', { text: 'NetID' }))
            .append($('<th>', { text: 'Student #' }))
            .append($('<th>', { text: 'First Name' }))
            .append($('<th>', { text: 'Last Name' }))));
    var $tbody = $('<tbody>');
    for (var i = 0; i < studentList.length; i++) {
        $tbody.append($('<tr>')
            .append($('<td>').text(studentList[i].NetID))
            .append($('<td>').text(studentList[i].stdNum))
            .append($('<td>').text(studentList[i].fName))
            .append($('<td>').text(studentList[i].lName)));
    }
    modal.$body.append($table.append($tbody));
    modal.show();
}

/**
 * Formats the date into DD/MM/YY hh:mm:ss
 * @param {Date} date 
 */
function formatDate(date) {
    var day    = formatDateEntry(date.getDate()),
        month  = formatDateEntry(date.getMonth() + 1),
        year   = date.getFullYear().toString().substr(-2),
        hour   = formatDateEntry(date.getHours()),
        minute = formatDateEntry(date.getMinutes()),
        second = formatDateEntry(date.getSeconds());
    return day + '/' + month + '/' + year + ' ' + hour + ':' + minute + ':' + second;
}

/**
 * Converts a number to a string and prepends a 0 if the value is not already 2-digit
 * @param {number} num 
 */
function formatDateEntry(num) {
    if (num < 10) return '0' + num;
    else return '' + num;
}

module.exports = SessionTable;