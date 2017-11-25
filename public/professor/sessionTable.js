var ModalWindow = require('../modalwindow');

var SessionTable = function(classID) {
    this.classID = classID;

    /**
     * Construct the table
     * @param {Object=} $appendTo Optional jQuery object to which the table will be appended
     */
    this.build = function($appendTo) {
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
        if ($appendTo) this.$table.appendTo($appendTo);
        $.get('/professor/' + this.classID + '/attendanceSessions')
            .done(updateTable.bind(this))
            .fail(failTable.bind(this));
        return this; // allows creation and buolding on same line, eg. var table = new SessionTable(...).build();
    };

    this.startSpinner = function() {
        this.$spinDiv.spin();
    };
};

function updateTable(data, status, xhr) {
    this.$tablebody.empty();
    this.data = data;

    for (var i = 0; i < this.data.sessions.length; i++) {
        // Formatting
        var session       = this.data.sessions[i],
            date          = new Date(session.sessDate),
            attendance    = session.studentList.length,
            isEmpty       = attendance < 1,

            // Format the date as dd/mm/yy hh:mm:ss - note that day and month can be 1 or 2 digits
            formattedDate = date.getDay() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear().toString().substr(-2) +
                ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

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
            // Without this, session gets overridden by subsequent passes
            // of the loop and every .click handler gets the last version of session
            with ({ oldSession: session }) {
                session.$tr.click(function() {
                    openAttendanceModal(formattedDate, oldSession.studentList);
                });
            }
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

module.exports = SessionTable;