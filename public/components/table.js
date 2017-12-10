/**
 * Generic implementation for fixed size, scrollable tables
 * @param {string[]=} classList 
 * @param {Number=} height
 * @param {Number=} width
 * @param {string[]=} headers
 * @param {*} $appendTarget
 */
var Table = function (classList, height, width, headers, $appendTarget) {    
    // Validate size inputs
    height = height || 300;
    width = width || 300;

    // Format class attribute
    var classes = '.table-bordered .table-sm .table-hover ';
    if (classList && classList.length > 0) {
        classList.forEach(function (element) {
            classes += '.' + element + ' ';
        });
    }
    
    this.$element = $('<div>', { class: 'session-table-container' });

    // Set table as two separate tables to allow for fixed headers while scrolling
    this.$table1 = $('<table>', { 
        class: classes + '.table1', 
        width: width
    }).appendTo(this.$element);
    this.$table2 = $('<table>', { 
        class: classes + '.table2', 
        width: width, 
        height: height - 36.5,
    }).appendTo(this.$element);

    // Add headers
    var $tr = $('<tr>'),
        colCount = 1;
    if (headers && headers.length > 0) {
        colCount = headers.length;
        headers.forEach(function (element) {
            $tr.append($('<th>').html(element));
        });
    }
    this.$thead = $('<thead>')
        .append($tr)
        .appendTo(this.$table1);

    // Basic body structure    
    this.$spinDiv = $('<div>', { class: 'spin-div' });
    this.$tbody = $('<tbody>')
        .append($('<tr>')
            .append($('<td>', { colspan: colCount })
                .append($(this.$spinDiv))))
        .appendTo(this.$table2);

    // Append to DOM early
    $appendTarget.append(this.$element);

    this.$spinDiv.spin();
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
    this.$tbody.empty();
    data.forEach(function (row) { 
        var $tr = $('<tr>');
        row.forEach(function (col) {
            if (col instanceof $) 
                $tr.append(col);
            else
                $tr.append($('<td>', { text: col }));
        }.bind(this));
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

module.exports = Table;