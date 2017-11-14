var SessionTable = function(classID) {
    this.classID = classID;

    /**
     * Construct the table
     * @param {Object=} $appendTo Optional jQuery object to which the table will be appended
     */
    this.build = function($appendTo) {
        this.$head = $('<thead>')
                .append($('<th>').html('Date'))
                .append($('<th>').html('Attendance'))
                .append($('<th>').html('%'));
        this.$body = $('<tbody>'); 
        this.$table = $('<table>', { class: 'table-bordered table-sm table-hover' })
            .append(this.$head)
            .append(this.$body);
        this.$spinDiv = $('<div>', { class: 'to-spin' });
        this.$container = $('<div>', { class: 'session-table-container' })
            .append(this.$table)
            .append(this.$spinDiv);
        if ($appendTo) this.$container.appendTo($appendTo);
        $.get(`/professor/${this.classID}/attendanceSessions`)
            .done(updateTable.bind(this))
            .fail(failTable.bind(this))
        return this; // allows creation and buolding on same line, eg. var table = new SessionTable(...).build();
    }
};

function updateTable(data, status, xhr) {
    this.$spinDiv.remove();
    this.data = data;
    for (var i = 0; i < this.data.sessions.length; i++) {
        var session = this.data.sessions[i],
            date = new Date(session.sessDate);
        var formattedDate = '' + date.getDay() + '/' + (date.getMonth() + 1) + '/' 
            + date.getFullYear().toString().substr(-2) + ' ' 
            + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        session.$td1 = $('<td>', { title: date.toString() }).text(formattedDate); // Date
        session.$td2 = $('<td>').text(session.studentList.length); // Attendance
        session.$td3 = $('<td>').text(session.studentList.length == 0 ? 0 : +(session.studentList.length / this.data.numEnrolled * 100).toFixed(1)); // %
        session.$tr = $('<tr>')
            .append(session.$td1)
            .append(session.$td2)
            .append(session.$td3);
        this.$body.append(session.$tr);
        this.data.sessions[i] = session;
    }
};

function failTable(status) {
    this.$table.addClass('table-danger');
    this.$body.empty();
    this.$spinDiv.empty().append($('<p>', { class: 'text-danger', text: 'Error getting attendance sessions: ' + status }))
};

module.exports = SessionTable;