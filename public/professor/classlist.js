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
    var $sidebar = $('<nav class="d-block bg-list sidebar">');

    // If there are no classes, show an informational message
    if (this.classes.length === 0) {
        var $message = $('<p class="sidebar-empty-message">');
        $message.append($('<i>Add classes to have them show up here.</i>'));
        $message.appendTo($sidebar);
    } else {
        // Create the container for the list items
        var $list = $('<ul class="nav nav-pills flex-column">');

        // Create a list tag for each class
        this.classes.forEach(function (course) {
            var $listItem = $('<li class="nav-item">'),
                $listLink = $('<a class="nav-link classlist-link" href="#">');

            // Fill add the course information to it
            $listLink.text(course.cCode + ":\n" + course.cName)
                .attr('id', course.cID).appendTo($listItem);

            // Append it to the list
            $listItem.appendTo($list);
        });

        // Append everything to the sidebar
        $list.appendTo($sidebar);
    }

    // Append the add class button
    var $button = $('<button type="button" class="add-class-btn btn btn-primary justify-content-end">')
        .text("Add Class");

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

// How the html looked in the bootstrap example:
//
// <!-- <div class="row">
//     <nav class="col-sm-3 col-md-2 d-none d-sm-block bg-light sidebar">
//         <ul class="nav nav-pills flex-column">
//             <li class="nav-item">
//             <a class="nav-link active" href="#">Overview <span class="sr-only">(current)</span></a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Reports</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Analytics</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Export</a>
//             </li>
//         </ul>

//         <ul class="nav nav-pills flex-column">
//             <li class="nav-item">
//             <a class="nav-link" href="#">Nav item</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Nav item again</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">One more nav</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Another nav item</a>
//             </li>
//         </ul>

//         <ul class="nav nav-pills flex-column">
//             <li class="nav-item">
//             <a class="nav-link" href="#">Nav item again</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">One more nav</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Another nav item</a>
//             </li>
//         </ul>
//     </nav>
// </div> -->