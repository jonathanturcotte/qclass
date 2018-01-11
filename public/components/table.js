/**
 * Generic implementation for fixed size, scrollable tables
 * @param {Object} options
 * @param {string[]=} options.classList 
 * @param {Number=} options.height
 * @param {Number=} options.width
 * @param {*[]=} options.columns Should be an array of string-number pairs, with the string specifying 
 * the text of the column header and the number denoting its fixed width in pixels
 * @param {Object=} options.$appendTarget
 */
var Table = function (options) {   
    var classes,
        width = options.width || 300;

    // Format class attribute
    classes = 'qtable table-bordered table-sm table-hover ';
    if (options.classList && options.classList.length > 0) {
        options.classList.forEach(function (element) {
            classes += element + ' ';
        });
    }

    // Store references
    this.$element = $('<div>', { class: 'table-container' });
    this.columns  = options.columns;

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
    this.$tbody = $('<tbody>', { height: (options.height || 300) - 36.5  })
        .appendTo(this.$table2);

    // Append to DOM early
    if (options.$appendTarget)
        options.$appendTarget.append(this.$element);

    this.$element.show();
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
        }
        this.$tbody.append($tr);
    }.bind(this));
};

Table.prototype.error = function (message) {
    if (!message) message = 'Error';
    this.$table1.addClass('table-danger');
    this.$table2.addClass('table-danger');
    this.$tbody
        .empty()
        .append($('<p>', { class: 'text-danger', text: message }));
};

Table.prototype.spin = function () {
    this.$tbody.spin();
};

function formatColumnWidth(width) {
    return 'max-width: ' + width + 'px; min-width: ' + width + 'px;';
}

module.exports = Table;