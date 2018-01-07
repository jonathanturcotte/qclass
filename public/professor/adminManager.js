var ModalWindow = require('../modalwindow'),
    regex       = require('../lib/regex');
    
var AdminManager = function () {};

AdminManager.prototype.manageAdmins = function (course) {
    var netIDFieldID = 'add-admin-netID-field';

    this.modal = new ModalWindow({ title: 'Edit Administrators' });

    // Add admin form components
    this.$formMessage  = $('<p>', { style: 'display: none;' });
    this.$netIDField    = $('<input>', { 
        id: this.netIDFieldID, 
        type: 'text', 
        class: 'form-control',
        style: 'display: inline; margin-right: 15px;',
        width: 100,
        placeholder: 'NetID'
    });
    this.$addButton     = $('<button>', { class: 'btn btn-primary', text: 'Add' })
        .click(addAdmin.bind(this, course));

    // Construct and append the add admin form
    this.$addForm = $('<div>').append([
        $('<p>', { text: 'Add a new administrator' }),
        this.$formMessage,
        this.$netIDField,
        this.$addButton
    ]).appendTo(this.modal.$body);

    // Add table and its container
    this.$tableMessage = $('<p>', { style: 'display: none;' });
    this.$table = $('<table>', { class: 'table-bordered table-sm table-hover', style: 'text-align: center;' })
        .append($('<thead>')
            .append($('<tr>')
                .append($('<th>', { text: 'NetID' }))
                .append($('<th>', { text: 'Name' }))
                .append($('<th>', { text: 'Actions' }))));
    this.$tBody = $('<tbody>').appendTo(this.$table);
    this.$tableDiv = $('<div>', { style: 'margin-top: 25px;' })
        .append($('<h5>', { text: 'Administrators' }))
        .append(this.$tableMessage)
        .append(this.$table)
        .appendTo(this.modal.$body);        

    updateTable.call(this, course);
};

function updateTable (course) {
    this.$tBody.empty().spin();

    $.get('/professor/class/' + course.cID + '/admins')
        .done(function (data, status, xhr) {
            for (var i = 0; i < data.length; i++) {
                var $deleteButton = $('<button>', { title: 'Remove', class: 'btn btn-default btn-sm' })
                    .append($('<i>', { class: 'fas fa-times' })
                        .attr('aria-hidden', 'true')),
                    name = '-';
                    
                $deleteButton.click(removeAdmin.bind(this, data[i].pNetID, course, $deleteButton));

                if (data[i].fName && data[i].fName.length > 0 && data[i].lName && data[i].lName.length > 0) 
                    name = data[i].fName + ' ' + data[i].lName;

                $('<tr>')
                    .append($('<td>', { text: data[i].pNetID }))
                    .append($('<td>', { text: name }))
                    .append($('<td>')
                        .append($deleteButton))
                    .appendTo(this.$tBody);
            }
        }.bind(this))
        .fail(function (data, status, xhr) {
            showTableMessage.call(this, false, 'Error getting admins');
        }.bind(this))
        .always(function(a, status, b) {
            this.$tBody.spin(false);
        }.bind(this));
}

function addAdmin (course) {
    var netID = this.$netIDField.val();

    // Validate netID
    if (!netID) {
        showFormError.call(this, 'NetID cannot be empty');
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
            showFormSuccess.call(this, 'Admin successfully added');
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
        updateTable.call(this, course);
    }.bind(this));
}

module.exports = AdminManager;