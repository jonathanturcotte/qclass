var Table = require('../components/table'),
    ModalWindow = require('../modalwindow');

var StudentTable = function (course, $appendTarget) {
    Table.call(this,
        course,
        ['student-table'], 
        300, 
        485, 
        [
            ['NetID', 67], 
            ['Number', 80], 
            ['First Name', 115], 
            ['Last Name', 140],
            ['Actions', 95]
        ], 
        $appendTarget
    );
};
StudentTable.prototype = Object.create(Table.prototype);
StudentTable.prototype.constructor = StudentTable;

StudentTable.prototype.update = function (data) {
    var tableData = [],
        students = data.students;

    // Persist/update the data
    this.data = data;

    for (var i in students) {
        var $expandButton = $('<button>', { text: 'Exp' })
                .click(expandStudent.bind(this, students[i])),      
            $deleteButton = $('<button>', { text: 'Del' })
                .click(tryRemoveStudent.bind(this, $deleteButton, students[i].netID)),
            $actions = $('<td>')
                .append($expandButton)
                .append($deleteButton);

        tableData.push([
            students[i].netID,
            students[i].stdNum,
            students[i].fName,
            students[i].lName,
            $actions
        ]);
    }

    this.fill(tableData);
};

function tryRemoveStudent($deleteButton, netID) {
    // TODO: get spinning button working
    $deleteButton.prop('disabled', true);
    removeStudent.call(this, $deleteButton, netID);
}

function removeStudent($deleteButton, netID) {
    $.ajax({
        url: 'professor/class/' + this.course.cID + '/remove/' + netID,
        type: 'DELETE'
    })
    .done(function(data, status, xhr) {
        toastr.success(netID + ' was removed from ' + this.course.cCode, 'Student Removed');
        window.app.classpage.refreshTables();
    }.bind(this))
    .fail(function(xhr, status, errorThrown) {
        var errMsg = xhr.responseStatus !== 500 && xhr.responseText ? xhr.responseText : 'Something went wrong while removing ' + netID + ' from ' + this.course.cCode;
        toastr.fail(errMsg, 'Remove Student Failed');
    }.bind(this))
    .always(function(a, status, b) {
        $deleteButton.prop('disabled', false);
    });
}

function expandStudent(student) {
    var modal    = new ModalWindow({ id: 'student-modal', title: 'Student Summary' }),
        sessions = this.data.sessions;

    modal.$body.addClass('table-modal-body');

    // Title
    modal.$body.append($('<h5>', {
        text: student.fName + ' ' + student.lName + ' (' + student.stdNum + ', ' + student.netID + ')', 
        class: 'table-modal-bodytitle' 
    }));

    // Total percent attendance
    var percentAttendance = 0;
    if (this.data.sessionCount !== 0)
        percentAttendance = student.sessions.length / this.data.sessionCount * 100;
    modal.$body.append($('<p>', { 
        style: 'text-align: center;',
        text: 'Total attendance: ' + student.sessions.length + '/' + this.data.sessionCount + ' (' + percentAttendance.toFixed(1) + '%)'
    }))

    // Table
    var $table = $('<table>', { class: 'student-modal-table centered-table table-bordered' })
        .append($('<thead>')
            .append($('<tr>')
                .append($('<th>', { text: 'Date' }))
                .append($('<th>', { text: 'Attendance' }))
                .append($('<th>', { text: 'Rate' }))));

    var $tbody = $('<tbody>').appendTo($table);
    for (var i in student.sessions) {
        $tbody.append($('<tr>')
            .append($('<td>').text(sessions[student.sessions[i]].formattedDate))
            .append($('<td>').text(sessions[student.sessions[i]].attendanceCountFormatted))
            .append($('<td>').text(sessions[student.sessions[i]].attendancePercentFormatted)));
    }

    modal.$body.append($table);
    modal.show();
}

module.exports = StudentTable;