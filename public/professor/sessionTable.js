var SessionTable = function(classID) {
    this.classID = classID;

    /**
     * Construct the table
     * @param {Object=} $appendTo Optional jQuery object to which the table will be appended
     */
    this.build = function($appendTo) {
        this.$head = $('<thead>')
            .append($('<tr>'))
                .append($('<th>').html('Date'))
                .append($('<th>').html('Attendance'))
                .append($('<th>').html('%'));
        this.$body = $('<tbody>')
            .append($('<tr>')
                .append($('<td>', { class: 'session-table-initial-td' })
                    .spin()));
        this.$footer = $('<tfooter>');
        this.$table = $('<table>', { class: '.table-bordered .table-sm .table-hover' })
            .append(this.$head)
            .append(this.$body)
            .append(this.$footer);
        if ($appendTo) this.$table.appendTo($appendTo);
        return this; // allows creation and buolding on same line, eg. var table = new SessionTable(...).build();
    }
};

module.exports = SessionTable;