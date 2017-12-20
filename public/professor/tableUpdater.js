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
        annotateSessions(data.sessions, data.numEnrolled);
        this.sessionTable.update(data);
        this.studentTable.update(data);
    }.bind(this))
    .fail(function (xhr, status, errorThrown) {
        var msg = 'Error getting attendance sessions: ' + status;
        this.sessionTable.error(msg);
        this.studentTable.error(msg);
    }.bind(this));
}

/**
 * Add necessary calculations and formatting 
 * to data in preparation for use with the tables 
 * @param {*} sessions
 * @param {number} studentCount 
 */
function annotateSessions(sessions, studentCount) {
    for (var i in sessions) {
        sessions[i].date                       = new Date(sessions[i].sessDate);
        sessions[i].formattedDate              = formatDate(sessions[i].date);
        sessions[i].attendanceCount            = sessions[i].netIDs.length;
        sessions[i].attendanceCountFormatted   = sessions[i].attendanceCount + '/' + studentCount;
        sessions[i].attendancePercent          = sessions[i].attendanceCount > 0 ? sessions[i].attendanceCount / studentCount * 100 : 0;
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