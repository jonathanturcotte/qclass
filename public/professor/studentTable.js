var Table = require('../components/table'),
    ModalWindow = require('../modalwindow');

var StudentTable = function (course, $appendTarget) {
    Table.call(this,
        course,
        {
            classList: ['student-table'], 
            height: 300, 
            width: 485, 
            columns: [
                ['NetID', 67], 
                ['Number', 80], 
                ['First Name', 115], 
                ['Last Name', 140],
                ['Actions', 95]
            ], 
            $appendTarget: $appendTarget
        }
    );
};
StudentTable.prototype = Object.create(Table.prototype);
StudentTable.prototype.constructor = StudentTable;

StudentTable.prototype.update = function (data) {
    var tableData = [],
        students  = data.students,
        enrolled  = data.enrolled;

    // Persist/update the data
    this.data = data;

    // Add a student row for each enrolled student
    for (var i = 0; i < enrolled.length; i++) {
        var student       = students[enrolled[i].sNetID],
            $expandButton = $('<button>', { 
                title: 'Expand', 
                class: 'btn btn-default btn-sm',
                style: 'margin-right: 3px;'
            }).append($('<i>', { class: 'fas fa-external-link-alt' })
                    .attr('aria-hidden', 'true'))
                .click(expandStudent.bind(this, student)),      
            $deleteButton = $('<button>', { title: 'Delete', class: 'btn btn-default btn-sm' })
                .append($('<i>', { class: 'fas fa-times' })
                        .attr('aria-hidden', 'true'))
                .click(openDeleteModal.bind(this, student)),
            $actions      = $('<td>')
                .append($expandButton)
                .append($deleteButton);

        tableData.push([
            student.netID,
            student.stdNum,
            student.fName,
            student.lName,
            $actions
        ]);
    }

    this.fill(tableData);
};

function openDeleteModal(student) {
    var modal         = new ModalWindow({ title: 'Remove ' + student.fName + '?' }),
        $deleteButton = $('<button>', { text: 'Delete', class: 'btn btn-danger' });
            
    $deleteButton.click(tryRemoveStudent.bind(this, $deleteButton, modal, student));

    modal.$body.append($('<p>', { text: 'Are you sure you want to remove ' + student.fName + ' ' + student.lName 
        + ' (' + student.stdNum + ', ' + student.netID + ')?' }));
    modal.$footer.prepend($deleteButton);
    modal.$closeButton.text('Cancel');

    // Remove the hidden modal from the DOM when we're done
    modal.$window.on('hidden.bs.modal', function (e) {
        modal.remove();
    });
}

function tryRemoveStudent($deleteButton, modal, student) {
    // TODO: get spinning button working
    $deleteButton.prop('disabled', true);
    modal.$body.empty().spin();
    removeStudent.call(this, $deleteButton, modal, student);
}

function removeStudent($deleteButton, modal, student) {
    $.ajax({
        url: 'professor/class/' + this.course.cID + '/remove-student/' + student.netID,
        type: 'DELETE'
    })
    .done(function(data, status, xhr) {
        modal.$title.text('Student Removed');
        modal.$header.addClass('modal-header-success');
        modal.$body.empty().append($('<p>', { text: student.fName + ' was removed!' }));
        window.app.classPage.refreshTables();
    }.bind(this))
    .fail(function(xhr, status, errorThrown) {
        modal.$title.text('Remove Student Failed');
        modal.$header.addClass('modal-header-danger');
        modal.$body.empty().append($('<p>', { text: xhr.responseStatus !== 500 && xhr.responseText ? xhr.responseText : 'Something went wrong while removing ' + netID }));
    }.bind(this))
    .always(function(a, status, b) {
        $deleteButton.remove();
        modal.$closeButton.text('Close');
    });
}

function expandStudent(student) {
    var modal    = new ModalWindow({ id: 'student-modal', title: 'Student Summary' }),
        sessions = this.data.sessions,
        sessionCount = this.data.sessionCount;

    modal.$body.addClass('table-modal-body');

    // Title
    modal.$body.append($('<h5>', {
        text: student.fName + ' ' + student.lName + ' (' + student.stdNum + ', ' + student.netID + ')', 
        class: 'table-modal-bodytitle' 
    }));

    // Total percent attendance of the student
    var percentAttendance = 0;
    if (sessionCount !== 0)
        percentAttendance = student.totalAttendance / sessionCount * 100;
    modal.$body.append($('<p>', { 
        style: 'text-align: center;',
        text: 'Total attendance: ' + student.totalAttendance + '/' + sessionCount + ' (' + percentAttendance.toFixed(1) + '%)'
    }));

    // Table
    var $table = $('<table>', { class: 'student-modal-table centered-table table-bordered' })
        .append($('<thead>')
            .append($('<tr>')
                .append($('<th>', { text: 'Date' }))
                .append($('<th>', { text: 'Attendance' }))
                .append($('<th>', { text: 'Rate' }))));

    var $tbody = $('<tbody>').appendTo($table);
    for (var i in student.sessions) {
        var session = sessions[student.sessions[i]];
        if (session.students[student.netID].attended) {
            $tbody.append($('<tr>')
                .append($('<td>').text(sessions[student.sessions[i]].formattedDate))
                .append($('<td>').text(sessions[student.sessions[i]].attendanceFormatted))
                .append($('<td>').text(sessions[student.sessions[i]].attendancePercentFormatted)));
        }
    }

    // Remove the hidden modal from the DOM when we're done
    modal.$window.on('hidden.bs.modal', function (e) {
        modal.remove();
    });

    modal.$body.append($table);
    modal.show();
}

module.exports = StudentTable;