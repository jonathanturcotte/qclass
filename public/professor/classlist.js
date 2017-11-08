var ClassPage = require('./classpage');

var ClassList = function () {
    this._$element = $('.classlist');
    this.classes = [];
    this.updateClasses();
};


ClassList.prototype.updateClasses = function () {
    $.get('/professor/classes')
        .done(updateSuccess.bind(this))
        .fail(updateFail.bind(this));
};

///////////////////////
// Private Functions //
///////////////////////

function buildList () {
    // Clear any old list items
    this._$element.empty();

    // Create the basic sidebar
    var $sidebar = $('<nav>', { class: "d-block bg-list sidebar" });

    // If there are no classes, show an informational message
    if (this.classes.length === 0) {
        var $message = $('<p>', { class: "sidebar-empty-message" });
        $message.append($('<i>', { text: "Add classes to have them show up here."} ));
        $message.appendTo($sidebar);
    } else {
        // Create the container for the list items
        var $list = $('<ul>', { class: "nav nav-pills flex-column" });

        // Create a list tag for each class
        this.classes.forEach(function (course) {
            $('<li>', { class: 'nav-item classlist-item' })
                .append($('<a>', { id: course.cID, class: 'nav-link classlist-link', href: '#', text: course.cCode + ":\n" + course.cName })
                    .click(function() {
                        var classPage = new ClassPage(course);
                        classPage.build();
                    }))
            .appendTo($list);
        });
        
        // Append everything to the sidebar
        $list.appendTo($sidebar);
    }

    // Append the add class button
    var $button = $('<button>', { type: "button", text: "Add Class", class: "add-class-btn btn btn-primary justify-content-end" });

    // TODO Button on click
    // $button.onClick(function () {})

    $button.appendTo($sidebar);

    // Append the sidebar to the page
    $sidebar.appendTo(this._$element);
}

function updateSuccess (data, textStatus, jqXHR) {
    this.classes = data;
    buildList.call(this);
}

function updateFail (jqXHR, textStatus, errorThrown) {
    console.log("Error updating class list - " + textStatus + " - " + errorThrown);
    // Build the empty class list anyways, to display the empty
    // classlist message
    buildList.call(this);
}


module.exports = ClassList;