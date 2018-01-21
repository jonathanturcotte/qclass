var ModalWindow = require('../components/modalwindow'),
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

    // Add informational alert
    $('<div>', { class: 'alert alert-info alert-dismissible fade show', role: 'alert' })
    .append($('<button>', { class: 'close' })
        .attr('data-dismiss', 'alert')
        .attr('aria-label', 'Close')
        .append($('<span>')
            .attr('aria-hidden', 'true')
            .html('&times;')))
    .append($('<p>', { text:'Administrators are able to start and stop sessions, add or remove students, export attendance, and edit the course name and code.' } ))
    .append($('<div>', { style: 'text-align: center' })
        .append($('<strong>', { text: 'Admins must be registered TAs or professors' })))
    .appendTo(this.modal.$body);

    // Add table and its container
    this.$tableDiv = $('<div>', { class: 'admin-table-div' })
        .appendTo(this.modal.$body);        
    this.table = new Table({ 
        height: 250,
        width: 468,
        columns: [
            ['NetID', 67],
            ['Name', 326],
            ['Actions', 75]
        ],
        $appendTarget: this.$tableDiv
    });

    // Add admin form components
    this.$formMessage = $('<p>', { class: 'admin-add-form-msg' });
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
        .append($('<div>', { class: 'admin-add-form-msg-div' })
            .append(this.$formMessage))
        .append(this.$addForm)
        .appendTo(this.$tableDiv);

    // Fill the table
    updateTable.call(this, course);
};

function updateTable (course) {
    this.table.$tbody.empty().spin();

    $.get('/professor/class/' + course.cID + '/admins')
        .done(function (data, status, xhr) {
            var tableData = [];
            for (var i = 0; i < data.length; i++) {
                var $deleteButton = $('<button>', { title: 'Remove', class: 'btn btn-default btn-sm' })
                    .click(openConfirmRemovalModal.bind(this, data[i].pNetID, course))
                    .append($('<i>', { class: 'fas fa-times' })
                        .attr('aria-hidden', 'true')),
                    name = '-';

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
    this.$netIDField.val('');
}

function showFormError (msg) {
    showMessage(false, msg, this.$formMessage);
    this.$netIDField.addClass('is-invalid');
}

function clearFormError () {
    this.$formMessage.hide();
    this.$netIDField.removeClass('is-invalid');
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

function openConfirmRemovalModal (netID, course) {
    var confirmModal = new ModalWindow({ title: 'Remove Admin' });

    // Moce the backdrop infront of the first modal but behind the second
    confirmModal.$window.css('z-index', 2001);
    $('.modal-backdrop').eq(1).css('z-index', 2000);

    confirmModal.$deleteButton = $('<button>', { class: 'btn btn-danger', text: 'Remove' })
        .prependTo(confirmModal.$footer);

    confirmModal.$deleteButton.click(function() {
        confirmModal.$deleteButton.prop('disabled', true);
        confirmModal.$closeButton.prop('disabled', true);
        removeAdmin.call(this, netID, course, confirmModal);
    }.bind(this));

    confirmModal.$body.append($('<p>', { text: 'Are you sure you want to remove admin ' + netID + '?' }));
    confirmModal.$closeButton.text('Cancel');    
    confirmModal.show();
}

function removeAdmin (netID, course, confirmModal) {
    confirmModal.$deleteButton.prop('disabled', true);

    $.ajax({
        url: '/professor/class/' + course.cID + '/admins/remove/' + netID,
        method: 'DELETE'
    })
    .done(function (data, status, xhr) {
        confirmModal.success(null, 'Successfully removed admin ' + netID);
    }).fail(function (xhr, status, errorStatus) {
        confirmModal.error(null, 'Error deleting admin ' + netID + (xhr.status ? ' - ' + xhr.status : ''));
    }).always(function (a, status, b) {
        // Remove delete button since operation is over, change close text and enable
        confirmModal.$deleteButton.remove();
        confirmModal.$closeButton.text('OK');
        confirmModal.$closeButton.prop('disabled', false);

        // Update table on first modal
        updateTable.call(this, course);
    }.bind(this));
}

module.exports = AdminManager;