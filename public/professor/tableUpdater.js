var TableUpdater = function (classID, sessionTable, studentTable) {
    this.classID = classID;
    this.sessionTable = sessionTable;
    this.studentTable = studentTable;
};

TableUpdater.prototype.updateTables = function () {
    this.sessionTable.spin();
    this.studentTable.spin();
    $.get('/professor/' + this.classID + '/session-data')
    .done(function(data, status, xhr) {
        _.defer(function (data) {
            processData(data);
            annotateSessions(data.sessions);
            _.defer(this.sessionTable.update.bind(this.sessionTable, data));
            _.defer(this.studentTable.update.bind(this.studentTable, data));
        }.bind(this, data));
    }.bind(this))
    .fail(function (xhr, status, errorThrown) {
        toastr.error(status, 'Error getting attendance sessions: ');
        this.sessionTable.error();
        this.studentTable.error();
    }.bind(this));
};

/**
 * Process the data object to aggregate the provided entries into a list of 
 * students and a list of sessions, each entry having a list of IDs to 
 * the entries of the other to which it is related.
 * @param {Object} data
 * @param {[]} data.entries
 */
function processData(data) {
    var sessions     = {},
        students     = {},
        sessionCount = 0,
        studentCount = 0;

    // Add every enrolled student to students
    for (var i = 0; i < data.enrolled.length; i++) {
        var student = data.enrolled[i];
        students[student.sNetID] = {
            netID: student.sNetID,
            stdNum: student.stdNum,
            fName: student.fName,
            lName: student.lName,
            totalAttendance: 0,
            sessions:        []
        };
        studentCount++;
    }

    // Iterate session entries to fill sessions and create session-student links 
    for (var j in data.entries) {
        var entry = data.entries[j];
        if (!sessions[entry.attTime]) {
            sessions[entry.attTime] = {
                time:          entry.attTime,
                date:          new Date(entry.attTime),
                duration:      entry.attDuration,
                totalEnrolled: 0,
                attendance:    0,
                students:      []
            };
            sessionCount++;
        }

        // Create link between student and session if the entry was not for an empty session
        if (entry.sNetID) {
            // Create the student entry if not present already
            if (!students[entry.sNetID]) {
                students[entry.sNetID] = {
                    netID:           entry.sNetID,
                    stdNum:          entry.stdNum,
                    fName:           entry.fName,
                    lName:           entry.lName,
                    totalAttendance: 0,
                    sessions:        []
                };
                studentCount++;
            }

            // Up the enrollment counters for this session
            sessions[entry.attTime].totalEnrolled++;
            sessions[entry.attTime].attendance += entry.attended;

            // Update student attendance counter
            var attended = entry.attended === 1;
            if (attended)
                students[entry.sNetID].totalAttendance++;

            // Relate sessions and students
            sessions[entry.attTime].students[entry.sNetID] = { 
                netID: entry.sNetID, 
                attended: attended
            };
            students[entry.sNetID].sessions.push(entry.attTime);
        }
    }

    // Append values to data object
    data.sessions     = sessions;
    data.students     = students;
    data.sessionCount = sessionCount;
    data.studentCount = studentCount;
}

/**
 * Add necessary calculations and formatting 
 * to data in preparation for use with the tables 
 * @param {*} sessions
 */
function annotateSessions(sessions) {
    for (var i in sessions) {
        sessions[i].formattedDate              = formatDate(sessions[i].date);
        sessions[i].attendanceFormatted        = sessions[i].attendance + '/' + sessions[i].totalEnrolled;
        sessions[i].attendancePercent          = sessions[i].attendance > 0 ? sessions[i].attendance / sessions[i].totalEnrolled * 100 : 0;
        sessions[i].attendancePercentFormatted = (sessions[i].attendancePercent).toFixed(1) + ' %';
    }
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

module.exports = TableUpdater;