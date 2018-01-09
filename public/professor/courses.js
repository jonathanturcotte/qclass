var ModalWindow = require('../modalwindow'),
    regex       = require('../lib/regex');

var CourseManager = function () {};

CourseManager.prototype.createCourse = function () {
    var modal         = new ModalWindow({id: "addClassModal", title: "Add Class"}),
        $cCodeInput   = $('<input>', { type: 'text', name: 'cCode', id: 'cCode', class: 'form-control' }),
        $cNameInput   = $('<input>', { type: 'text', name: 'cName', id: 'cName', class: 'form-control' }),
        $submitButton = $('<button>', { type: 'submit', class: 'btn btn-primary',  text: 'Submit', id: 'submitAddClasses' }),
        // spans
        $cCodeSpan    = $('<span>', { class: "text-danger", style: 'margin-left: 120px; display: none'}),
        $cNameSpan    = $('<span>', { class: "text-danger", style: 'margin-left: 120px; display: none'});

    modal.$body
        .append($cCodeSpan)
        .append($('<div>', { class: 'form-group has-danger form-inline', style: 'margin-bottom: 5px' })
            .append($('<span>', { text: "Course Code:", style: 'width: 100px' }))
            .append($('<div>', { class: 'col-sm-5' })
                .append($cCodeInput)))
        .append($cNameSpan)
        .append($('<div>', { class: 'form-group has-danger form-inline', style: 'margin-bottom: 5px' })
            .append($('<span>', { text: "Course Name:", style: 'width: 100px' }))
            .append($('<div>', { class: 'col-sm-5' })
                .append($cNameInput)));      

    modal.$footer
        .prepend($submitButton);

    $submitButton
        .click(function () {
            var cCode  = $cCodeInput.val().toUpperCase(),
                cName  = $cNameInput.val(),
                errors = findErrors(cCode, cName),
                flag   = 0;
            
            for( var i = 0; i < errors.length; i++) {
                if(!errors[i]) {
                    switch(i) {
                        case 0:
                            $cCodeSpan.hide();
                            $cCodeInput.removeClass('is-invalid');
                            break;
                        case 1:
                            $cNameSpan.hide();
                            $cNameInput.removeClass('is-invalid');
                            break;
                    }
                }
                else {
                    switch(i) {
                        case 0:
                            $cCodeSpan.show();
                            $cCodeSpan.text(errors[i]);
                            $cCodeInput.addClass('is-invalid');
                            break;
                        case 1:
                            $cNameSpan.show();
                            $cNameSpan.text(errors[i]);
                            $cNameInput.addClass('is-invalid');
                            break;
                    }
                    flag = 1;
                }
            }
            // check if any errors detected
            if (flag) return;

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
};

CourseManager.prototype.deleteCourse = function (course, sessions) {
    this.modal = new ModalWindow({ title: 'Delete Course'});
    
    this.$deleteButton = $('<button>', { type: 'submit', class: 'btn btn-danger',  text: 'Delete', id: 'deleteButton' })
        .click(removeCourse.bind(this, course, sessions));

    this.modal.$body
        .append($('<p>', { text: 'Are you sure you want to delete ' + course.cCode + '?' }))
        .append($('<div>', { class: 'alert alert-warning' })
            .append($('<strong>', { text: 'Warning: ' }))
            .append($('<p>', { text: 'Deleting a course removes all associated session and enrollment information!'})));
    
    this.modal.$footer
        .prepend(this.$deleteButton);
};

///////////////////////
// Private Functions //
///////////////////////

function removeCourse (course, sessions) {
    this.$deleteButton.remove();
    this.modal.$body.empty();
    this.modal.$body
        .spin()
        .addClass('spin-min-height');

    $.ajax({
        url: '/professor/class/' + course.cID,
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

function findErrors(cCode, cName) {
    var result = [false, false];
    // check course code
    if(!cCode || typeof(cCode) !== 'string' || !regex.class.code.test(cCode)) {
        if(!cCode)
            result[0] = 'No Course Code Provided';
        else
            result[0] = 'Improper Course Code Format (Ex. MATH 101)';
    }
    //check course name
    if(!cName || typeof(cName) !== 'string' || !regex.class.name.test(cName)) {
        if(!cName)
            result[1] = 'No Course Name Provided';
        else if (cName.length > 100)
            result[1] = 'Course Name Too Long';
        else
            result[1] = 'Please Do Not Enter Special Characters';
    }
    return result;
}

module.exports = CourseManager;