var ModalWindow = require('../modalwindow');

/**
 * Creates a session table that displays attendance sessions
 * @param {String} classID    The ID of the class the table will show sessions of
 * @param {Object} $container jQuery object to which the table will be appended
 */
var SessionTable = function(classID, $container) {
    this.classID  = classID;
    this.$element = $container;
    build.call(this);
    this.updateSessions();
};

SessionTable.prototype.updateSessions = function () {
    $.get('/professor/' + this.classID + '/attendanceSessions')
        .done(updateTable.bind(this))
        .fail(failTable.bind(this));
};

SessionTable.prototype.startSpinner = function () {
    this.$spinDiv.spin();
};

SessionTable.prototype.stopSpinner = function () {
    this.$spinDiv.spin(false);
};

///////////////////////
// Private Functions //
///////////////////////

function build () {
    // Build the table
    this.$spinDiv = $('<div>', { class: 'session-table-spin-div' });
    this.$tablehead = $('<thead>')
        .append($('<th>').html('Date'))
        .append($('<th>').html('Attendance (%)'));

    this.$tablebody = $('<tbody>')
        .append($('<tr>')
            .append($('<td>', { colspan: 2 })
                .append($(this.$spinDiv))));

    this.$table = $('<table>', { class: 'session-table table-bordered table-sm table-hover' })
        .append(this.$tablehead)
        .append(this.$tablebody);

    this.$table.appendTo(this.$element);
}

function updateTable(data, status, xhr) {
    this.$tablebody.empty();
    this.data = data;

    for (var i = 0; i < this.data.sessions.length; i++) {
        var session       = this.data.sessions[i],
            date          = new Date(session.sessDate),
            attendance    = session.studentList.length,
            isEmpty       = attendance < 1,

            // Format the date as dd/mm/yy hh:mm:ss - note that day and month can be 1 or 2 digits
            formattedDate = formatDate(date);

        if (!isEmpty)
            attendance = attendance + ' students (' + (attendance / this.data.numEnrolled * 100).toFixed(1) + '%)';
        else
            attendance = attendance + ' students';
        
        // Create main row 
        session.$td1 = $('<td>', { title: date.toString() }).text(formattedDate); 
        session.$td2 = $('<td>').text(attendance);
        session.$tr  = $('<tr>', { class: 'accordion-toggle', title: 'Click to view students in attendance' })
            .append(session.$td1)
            .append(session.$td2);

        if (!isEmpty) {
            // If there was attendance for this session, make it clickable
            session.$tr.click(openAttendanceModal.bind(this, formattedDate, session.studentList));
        }

        this.$tablebody.append(session.$tr);
        this.data.sessions[i] = session;
    }
    this.$spinDiv.remove();
}

function failTable(xhr, status, errorThrown) {
    this.$table.addClass('table-danger');
    this.$spinDiv.remove();
    this.$tablebody.empty().append($('<p>', { class: 'text-danger', text: 'Error getting attendance sessions: ' + status }));
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