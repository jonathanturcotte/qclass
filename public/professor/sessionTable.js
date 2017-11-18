var SessionTable = function(classID) {
    this.classID = classID;

    /**
     * Construct the table
     * @param {Object=} $appendTo Optional jQuery object to which the table will be appended
     */
    this.build = function($appendTo) {
        this.$spinDiv = $('<div>', { class: 'session-table-spin-div' });
        this.$head = $('<thead>')
                .append($('<th>').html('Date'))
                .append($('<th>').html('Attendance (%)'));
        this.$body = $('<tbody>')
            .append($('<tr>')
                .append($('<td>', { colspan: 2 })
                    .append($(this.$spinDiv)))); 
        this.$table = $('<table>', { class: 'session-table table-bordered table-sm table-hover' })
            .append(this.$head)
            .append(this.$body);
        this.$container = $('<div>', { class: 'session-table-container' })
            .append(this.$table);
        if ($appendTo) this.$container.appendTo($appendTo);
        $.get(`/professor/${this.classID}/attendanceSessions`)
            .done(updateTable.bind(this))
            .fail(failTable.bind(this))
        return this; // allows creation and buolding on same line, eg. var table = new SessionTable(...).build();
    };

    this.startSpinner = function() {
        this.$spinDiv.spin();
    };
};

function updateTable(data, status, xhr) {
    this.$body.empty();
    this.data = data;
    for (var i = 0; i < this.data.sessions.length; i++) {
        var session = this.data.sessions[i];
        var date = new Date(session.sessDate);
        var formattedDate = '' + date.getDay() + '/' + (date.getMonth() + 1) + '/' 
            + date.getFullYear().toString().substr(-2) + ' ' 
            + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        var attendance = session.studentList.length;
        if (session.studentList.length > 0)
            attendance = attendance + ' (' + +(attendance / this.data.numEnrolled * 100).toFixed(1) + '%)';
        
        session.$td1 = $('<td>', { title: date.toString() }).text(formattedDate); 
        session.$td2 = $('<td>').text(attendance);
        session.$tr = $('<tr>')
            .append(session.$td1)
            .append(session.$td2);
        this.$body.append(session.$tr);
        this.data.sessions[i] = session;
    }
    this.$spinDiv.remove();
};

function failTable(xhr, status, errorThrown) {
    this.$table.addClass('table-danger');
    this.$spinDiv.remove();
    this.$body.empty().append($('<p>', { class: 'text-danger', text: 'Error getting attendance sessions: ' + status }));
};

module.exports = SessionTable;