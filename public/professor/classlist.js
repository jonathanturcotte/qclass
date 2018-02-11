var ClassPage   = require('./classpage'),
    ModalWindow = require('../components/modalwindow');


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
    ci.ajax({
        url: '/professor/classes',
        method: 'GET',
        done: updateSuccess.bind(this),
        fail: updateFail.bind(this)
    });
};

/**
 * Selects the first class in the list
 */
ClassList.prototype.selectFirstClass = function () {
    if (this.classes.length !== 0)
        selectClass(this.classes[0]);
    else
        window.app.classPage.displayBlankPage();
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
            var $li = $('<li>', { class: 'nav-item classlist-item' })
                .append($('<a>', { 
                    id: course.cID, class: 'nav-link classlist-link text-truncate text-white noselect', 
                    href: '#', 
                    text: course.cCode + ':\n' + course.cName,
                    draggable: false 
                }))
                .click(selectClass.bind(this, course));

            // Add admin indicator if necessary
            if (!course.isOwner) {
                $li
                    .append($('<div>', { style: 'float: right;' })
                        .append($('<p>', { class: 'classlist-admin-indicator', text: 'Admin' })));
            }
                
            $li.appendTo($list);
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
        .click(window.app.classPage.courseManager.createCourse);
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
        data.classes[i].isOwner = true;
        classes.push(data.classes[i]);
    }

    for (i = 0; i < data.adminClasses.length; i++) {
        data.adminClasses[i].isOwner = false;
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

module.exports = ClassList;