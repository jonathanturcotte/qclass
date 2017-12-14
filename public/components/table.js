/**
 * Generic implementation for fixed size, scrollable tables
 * @param {string[]=} classList 
 * @param {Number} height
 * @param {Number} width
 * @param {*[]} columns Should be an array of string-number pairs, with the string specifying 
 * the text of the column header and the number denoting its fixed width in pixels
 * @param {*} $appendTarget
 */
var Table = function (classID, classList, height, width, columns, $appendTarget) {    
    // Format class attribute
    var classes = 'qtable table-bordered table-sm table-hover ';
    if (classList && classList.length > 0) {
        classList.forEach(function (element) {
            classes += element + ' ';
        });
    }

    // Store references
    this.$element = $('<div>', { class: 'table-container' });
    this.classID  = classID;
    this.columns  = columns;

    // Set table as two separate tables to allow for fixed headers while scrolling
    this.$table1 = $('<table>', { 
        class: classes + 'qtable1', 
        width: width
    }).appendTo(this.$element);
    this.$table2 = $('<table>', { 
        class: classes + 'qtable2', 
        width: width   
    }).appendTo(this.$element);

    // Add headers
    var $tr = $('<tr>');
    this.columns.forEach(function (column) {
        $tr.append($('<th>', {
            text: column[0], 
            style: formatColumnWidth(column[1]) 
        }));
    });
    this.$thead = $('<thead>')
        .append($tr)
        .appendTo(this.$table1);

    // Basic body structure
    this.$tbody = $('<tbody>', { height: height - 36.5  })
        .appendTo(this.$table2);

    // Append to DOM early
    $appendTarget.append(this.$element);

    this.$element.show();
    this.$tbody.spin();
};

/**
 * Updates the table. If no response object is provided, the
 * database will be queried for the information. When present, 
 * response should be an object with the three parameters of
 * a successful ajax request
 * @param {*} response
 * @param {*} response.data
 * @param {*} response.status
 * @param {*} response.jqXHR 
 */
Table.prototype.updateContent = function (data) {
    if (data) 
        this._update(data);
    else {
        $.get(Table.getContentURL(this.classID))
            .done(this._update)
            .fail(fail.bind(this));
    }
};

/**
 * Format the URL used in get requests associated with tables
 * @param {string} classID 
 */
Table.getContentURL = function (classID) {
    return '/professor/' + classID + '/attendanceSessions';
};

/**
 * Fills the table based on the nested data object.
 * 
 * Each element of data should be an array that represents a row, with each row element
 * being the value of that column. If the value is a jquery object it will be inserted 
 * directly, otherwise it will be converted into a basic <td> as a string
 * @param {*[][]} data 
 */
Table.prototype.fill = function (data) {
    // Clear body and spinner
    this.$tbody.empty();
    
    data.forEach(function (row) { 
        var $tr = $('<tr>');
        for (var i = 0; i < row.length; i++) {
            if (row[i] instanceof $) {
                $tr.append(row[i]
                    .css('min-width', this.columns[i][1])
                    .css('max-width', this.columns[i][1]));
            } else {
                $tr.append($('<td>', { 
                    text: row[i], 
                    style: formatColumnWidth(this.columns[i][1]) 
                }));
            }
        };
        this.$tbody.append($tr);
    }.bind(this));
};

Table.prototype.error = function (message) {
    this.$table1.addClass('table-danger');
    this.$table2.addClass('table-danger');
    this.$tbody
        .empty()
        .append($('<p>', { class: 'text-danger', text: message }));
};

Table.prototype.spin = function () {
    this.$tbody.spin();
};

Table.prototype._update = function (data) {
    console.log('Error - abstract update called - should have been overridden');
}

/**
 * Formats the date into DD/MM/YY hh:mm:ss
 * @param {Date} date 
 */
Table.formatDate = function (date) {
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

function fail(xhr, status, errorThrown) {
    this.error('Error getting attendance sessions: ' + status);
}

function formatColumnWidth(width) {
    return 'max-width: ' + width + 'px; min-width: ' + width + 'px;'
}

module.exports = Table;