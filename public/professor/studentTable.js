var Table = require('../components/table');

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
    var tableData = [],
        students  = {};
    
    // Flip the data object by associating courses with an array of students
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

    // Create buttons for action column
    var $expandButton = $('<button>', { text: 'Exp' })
        .click(function() {
            
        });
    var $deleteButton = $('<button>', { text: 'Del' });
    var $actions = $('<td>')
        .append($expandButton)
        .append($deleteButton);
    // Format rows for each student
    for (var i in students) {
        tableData.push([
            students[i].NetID,
            students[i].stdNum,
            students[i].fName,
            students[i].lName,
            $actions.clone()
        ]);
    }

    // Fill table with formatted data
    this.fill(tableData);
};

StudentTable.prototype.deleteStudent = function (netID) {
    // TODO: implement
};

StudentTable.prototype.expandStudent = function (netID) {
    // TODO: implement
};

module.exports = StudentTable;