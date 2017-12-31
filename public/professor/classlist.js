var ClassPage   = require('./classpage'),
    ModalWindow = require('../modalwindow');


var ClassList = function () {
    this.$element = $('.classlist');
    this.classes  = [];
    this.updateClasses();
};

/**
 * Fetches the professors classes from the server, builds the
 * classlist and selects the first class
 */
ClassList.prototype.updateClasses = function () {
    $.get('/professor/classes')
        .done(updateSuccess.bind(this))
        .fail(updateFail.bind(this));
};

/**
 * Selects the first class in the list
 */
ClassList.prototype.selectFirstClass = function () {
    if (this.classes.length !== 0)
        selectClass(this.classes[0]);
};

/**
 * Update a classlist item without refreshing the entire list
 * @param {string} id       // Course ID
 * @param {string} field    // The desired field to update: 'name' or 'code'
 * @param {string} value    // The new value
 */
ClassList.prototype.updateClassText = function (id, field, value) {
    for (var i = 0; i < this.classes.length; i++){
        if (id === this.classes[i].cID){
            if (field === 'name')
                this.classes[i].cName = value;
            else if (field === 'code')
                this.classes[i].cCode = value;

            $('#' + id).text(this.classes[i].cCode + ":\n" + this.classes[i].cName);
        }
    }
};

///////////////////////
// Private Functions //
///////////////////////

function buildList () {
    // Clear any old list items
    this.$element.empty();

    // Create the basic sidebar
    var $sidebar = $('<nav>', { class: "d-block bg-list sidebar" });

    // If there are no classes, show an informational message
    if (this.classes.length === 0) {
        var $message = $('<p>', { class: "sidebar-empty-message text-light noselect" });
        $message.append($('<i>', { text: "Add classes to have them show up here."} ));
        $message.appendTo($sidebar);
    } else {
        // Create the container for the list items
        var $list = $('<ul>', { class: "nav nav-pills flex-column" });

        // Create a list tag for each class
        this.classes.forEach(function (course) {
            $('<li>', { class: 'nav-item classlist-item' })
                .append($('<a>', { id: course.cID, class: 'nav-link classlist-link text-truncate text-white noselect', href: '#', text: course.cCode + ":\n" + course.cName }))
                .click(selectClass.bind(this, course))
                .appendTo($list);
        });

        // Add an empty, non-interactive empty element so that
        // we can scroll items above the add class button
        $('<li>', { class: 'nav-item classlist-item classlist-spacer'})
            .appendTo($list);
        
        // Append everything to the sidebar
        $list.appendTo($sidebar);
    }

    // Append the add class button
    var $button = $('<button>', { type: "button", text: "Add Class", class: "add-class-btn btn btn-danger justify-content-end" })
        .click(createAddClassModal);
    $button.appendTo($sidebar);

    // Append the sidebar to the page
    $sidebar.appendTo(this.$element);
}

function selectClass (course) {
    $('.classlist-item').removeClass('classlist-item-selected');
    $('#' + course.cID).parent().addClass('classlist-item-selected');

    window.app.classPage.displayCourse(course);
}

function updateSuccess (data, textStatus, jqXHR) {
    var classes = [];

    // Add indicators on the courses beore merging the lists to be able to identify if a professor owns a course or is just administering it
    for (var i = 0; i < data.classes.length; i++) {
        data.classes[i].isAdmin = false;
        classes.push(data.classes[i]);
    }

    for (var i = 0; i < data.adminClasses.length; i++) {
        data.adminClasses[i].isAdmin = true;
        classes.push(data.adminClasses[i]);
    }
    
    this.classes = _.sortBy(classes, 'cCode');
    buildList.call(this);
    this.selectFirstClass();
}

function updateFail (jqXHR, textStatus, errorThrown) {
    console.log("Error updating class list - " + textStatus + " - " + errorThrown);
    // Build the empty class list anyways, to display the empty
    // classlist message
    buildList.call(this);
}

function createAddClassModal () {
    var modal         = new ModalWindow({id: "addClassModal", title: "Add Class"}),
        $cCodeInput   = $('<input>', { type: 'text', name: 'cCode', id: 'cCode' }),
        $cNameInput   = $('<input>', { type: 'text', name: 'cName', id: 'cName' }),
        $submitButton = $('<button>', { type: 'submit', class: 'btn btn-primary',  text: 'Submit', id: 'submitAddClasses' });

    modal.$body
        .append($('<p>', {text: 'Course Code:'}))
        .append($cCodeInput)
        .append($('<p>', {text: 'Course Name:'}))
        .append($cNameInput);
    modal.$footer
        .prepend($submitButton);
    $submitButton
        .click(function () {
            $submitButton.remove();
            modal.$body.empty();
            modal.$body
                .spin()
                .addClass('spin-min-height');

            $.post({
                url: '/professor/class/add',
                data: { code: $cCodeInput.val(), name: $cNameInput.val() },
                dataType: 'json'
            }).done(function(data, status, xhr) {
                modal.success("Success", $cCodeInput.val() + ' successfully added!');
                window.app.classList.updateClasses();
            }).fail(function(xhr, status, errorThrown) {
                modal.error("Error", xhr.responseText);
            }).always(function(a, status, b) {
                modal.$body.spin(false);
            });
        });
    modal.show();
}

module.exports = ClassList;