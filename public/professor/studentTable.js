var Table = require('../components/table'),
    ModalWindow = require('../modalwindow');

var StudentTable = function (classID, $appendTarget) {
    Table.call(this,
        classID,
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

StudentTable.prototype._update = function (data) {
    var students  = getStudentList(data),
        tableData = formatTableData(students);

    this.fill(tableData);
};

function deleteStudent(netID) {
    // TODO: implement
};

function expandStudent(student) {
    var modal = new ModalWindow({ id: 'student-modal', title: 'Student Summary' });

    modal.$body.append($('<h5>', { 
        text: student.fName + ' ' + student.lName + ' (' + student.stdNum + ', ' + student.NetID + ')', 
        class: 'table-modal-bodytitle' 
    }));
    modal.$body.addClass('table-modal-body');

    var $table = $('<table>', { class: 'student-modal-table centered-table table-bordered' })
        .append($('<thead>')
            .append($('<tr>')
                .append($('<th>', { text: 'Date' }))
                .append($('<th>', { text: 'Attendance' }))
                .append($('<th>', { text: 'Rate' }))));

    var $tbody = $('<tbody>').appendTo($table);
    for (var i = 0; i < student.sessions.length; i++) {
        $tbody.append($('<tr>')
            .append($('<td>').text(student.sessions[i].formattedDate))
            .append($('<td>').text(student.sessions[i].attendanceCountFormatted))
            .append($('<td>').text(student.sessions[i].attendancePercentFormatted)));
    }

    modal.$body.append($table);
    modal.show();
};

// Flip the data object by associating courses with an array of students
function getStudentList(data) {
    var students = {};

    for (var i = 0; i < data.sessions.length; i++) {
        var session = data.sessions[i],
            studentList = session.studentList;

        for (var j = 0; j < session.studentList.length; j++) {
            var student = studentList[j];

            if (!students[student.NetID]) {
                students[student.NetID] = student;
                students[student.NetID].sessions = [];
            }

            students[student.NetID].sessions.push(session);
        }
    }

    return students;
};

// Format rows for each student
function formatTableData(students) {
    var tableData = [];

    for (var i in students) {
        var $expandButton = $('<button>', { text: 'Exp' })
                .click(expandStudent.bind(this, students[i])),            
            $deleteButton = $('<button>', { text: 'Del' })
                .click(deleteStudent.bind(this, students[i].netID));
            $actions = $('<td>')
                .append($expandButton)
                .append($deleteButton);

        tableData.push([
            students[i].NetID,
            students[i].stdNum,
            students[i].fName,
            students[i].lName,
            $actions
        ]);
    }

    return tableData;
}

module.exports = StudentTable;