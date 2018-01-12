var ModalWindow = require('../modalwindow'),
    Table       = require('../components/table'),
    regex       = require('../lib/regex');
    
var AdminManager = function () {};

AdminManager.prototype.manageAdmins = function (course) {
    var netIDFieldID = 'add-admin-netID-field';

    this.modal = new ModalWindow({ title: 'Edit Administrators' });
    this.modal.$body.css({
        display: 'flex',
        'align-items': 'center',
        'flex-direction': 'column'
    });

    // Add table and its container
    this.$tableMessage = $('<p>', { style: 'display: none;' });
    this.$tableDiv = $('<div>', { class: 'admin-table-div' })
        .append(this.$tableMessage)
        .appendTo(this.modal.$body);        
    this.table = new Table({ 
        height: 250,
        width: 322,
        columns: [
            ['NetID', 67],
            ['Name', 180],
            ['Actions', 75]
        ],
        $appendTarget: this.$tableDiv
    });

    // Add admin form components
    this.$formMessage = $('<p>', { style: 'display: none; text-align: right;' });
    this.$netIDField = $('<input>', { 
        id: this.netIDFieldID, 
        type: 'text', 
        class: 'form-control',
        style: 'display: inline;',
        width: 100,
        placeholder: 'NetID'
    });
    this.$addButton     = $('<button>', { 
        class: 'btn btn-primary', 
        text: 'Add', 
        style: 'vertical-align: top;' 
    }).click(addAdmin.bind(this, course));

    // Construct and append the add admin form
    this.$addForm = $('<div>', { class: 'admin-add-form' }).append([
        this.$netIDField,
        this.$addButton
    ]);

    this.$belowTableDiv = $('<div>', { class: 'admin-table-below' })
        .append(this.$formMessage)
        .append(this.$addForm)
        .appendTo(this.$tableDiv);

    // Fill the table
    updateTable.call(this, course);
};

function updateTable (course, shouldKeepMessage) {
    if (!shouldKeepMessage)
        this.$tableMessage.hide();
    this.table.$tbody.empty().spin();

    $.get('/professor/class/' + course.cID + '/admins')
        .done(function (data, status, xhr) {
            var tableData = [];
            for (var i = 0; i < data.length; i++) {
                var $deleteButton = $('<button>', { title: 'Remove', class: 'btn btn-default btn-sm' })
                    .append($('<i>', { class: 'fas fa-times' })
                        .attr('aria-hidden', 'true')),
                    name = '-';
                    
                $deleteButton.click(removeAdmin.bind(this, data[i].pNetID, course, $deleteButton));

                if (data[i].fName && data[i].fName.length > 0 && data[i].lName && data[i].lName.length > 0) 
                    name = data[i].fName + ' ' + data[i].lName;

                tableData.push([
                    data[i].pNetID,
                    name,
                    $('<td>').append($deleteButton)
                ]);
            }
            this.table.fill(tableData);
        }.bind(this))
        .fail(function (data, status, xhr) {
            this.table.error('Error getting admins');
        }.bind(this))
        .always(function(a, status, b) {
        }.bind(this));
}

function addAdmin (course) {
    var netID = this.$netIDField.val();

    // Validate netID
    if (!netID) {
        showFormError.call(this, 'Empty NetID');
    } else if (!regex.user.netID.test(netID)) {
        showFormError.call(this, 'Invalid NetID format');
    } else {
        // Disable form
        this.$addButton.prop('disabled', true);
        this.$netIDField.prop('disabled', true);

        $.post({
            url: '/professor/class/' + course.cID + '/admins/add/' + netID
        })
        .done(function (data, status, xhr) {
            showFormSuccess.call(this, 'Added ' + netID);
            updateTable.call(this, course);
        }.bind(this))
        .fail(function (xhr, status, errorThrown) {
            var msg,
                shouldUpdate = true,
                json = xhr.responseJSON;

            if (!json || !json.errorCode)
                msg = 'Error adding admin - ' + xhr.status;
            else { 
                msg = json.message;

                // Don't update table if the error code is known to not affect the DB
                if (json.errorCode > 1)
                    shouldUpdate = false;
            }
            showFormError.call(this, msg);

            if (shouldUpdate)
                updateTable.call(this, course);
        }.bind(this))
        .always(function (a, status, b) {
            // Re-enable form
            this.$addButton.prop('disabled', false);
            this.$netIDField.prop('disabled', false);
        }.bind(this));
    }
}

function showFormSuccess (msg) {
    showMessage(true, msg, this.$formMessage);
    this.$netIDField.removeClass('is-invalid');
}

function showFormError (msg) {
    showMessage(false, msg, this.$formMessage);
    this.$netIDField.addClass('is-invalid');
}

function clearFormError () {
    this.$formMessage.hide();
    this.$netIDField.removeClass('is-invalid');
}

function showTableMessage (success, msg) {
    showMessage(success, msg, this.$tableMessage);
}

function showMessage (success, msg, $element) {
    var remove = success === true ? 'text-danger' : 'text-success',
        add    = success === true ? 'text-success' : 'text-danger';
    $element
        .removeClass(remove)
        .addClass(add)
        .text(msg)
        .show();
}

function removeAdmin (netID, course, $deleteButton) {
    $deleteButton.prop('disabled', true);

    $.ajax({
        url: '/professor/class/' + course.cID + '/admins/remove/' + netID,
        method: 'DELETE'
    })
    .done(function (data, status, xhr) {
        showTableMessage.call(this, true, 'Successfully deleted admin ' + netID);
    }.bind(this))
    .fail(function (xhr, status, errorStatus) {
        showTableMessage.call(this, false, 'Error deleting admin ' + netID + (xhr.status ? ' - ' + xhr.status : ''));
    }.bind(this))
    .always(function (a, status, b) {
        updateTable.call(this, course, true);
    }.bind(this));
}

module.exports = AdminManager;