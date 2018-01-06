var ModalWindow = require('../modalwindow'),
    regex       = require('../lib/regex');

var CourseDeleter = function () {};

CourseDeleter.prototype.buildAndShowModal = function (course, sessions) {
    
    this.modal = new ModalWindow({ title: 'Delete Course'});
    
    this.$deleteButton = $('<button>', { type: 'submit', class: 'btn btn-danger',  text: 'Delete', id: 'deleteButton' })
        .click(deleteCourse.bind(this, course, sessions));

    this.modal.$body
        .append($('<p>', { text: 'Are you sure you want to delete ' + course.cCode + '?' }))
        .append($('<div>', { class: 'alert alert-warning' })
            .append($('<strong>', { text: 'Warning: ' }))
            .append($('<p>', { text: 'Deleting a course removes all associated session and enrollement information!'})));
    
    this.modal.$footer
        .prepend(this.$deleteButton);
};

function deleteCourse (course, sessions) {

    this.$deleteButton.remove();
    this.modal.$body.empty();
    this.modal.$body
        .spin()
        .addClass('spin-min-height');
    
    // First kill any running sessions
    sessions.terminateSession(course, function (stopped) {
        if (stopped) {
            $.ajax({
                url: '/professor/class/' + course.cID + '/removeCourse',
                method: 'DELETE'
            })
            .done(function (data, status, xhr) {
                this.modal.success('Success', course.cCode + ' successfully deleted!');
                window.app.classList.updateClasses();
            }.bind(this))
            .fail(function (xhr, status, errorThrown) {
                this.modal.error('Error', xhr.responseText);
            }.bind(this))
            .always(function(a, status, b) {
                this.modal.$body.spin(false);
            }.bind(this));
        }
        else {
            this.modal.error('Error', "Unable to end the session running");
        }
    }.bind(this)); 
}

module.exports = CourseDeleter;