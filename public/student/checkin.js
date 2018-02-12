var CheckIn = function ($appendTarget) {
    this._$element = $('<div>', { class: 'student-checkin' });
    this._$element.appendTo($('body'));
    build.call(this);
    this._$element.appendTo($appendTarget);
};

///////////////////////
// Private Functions //
///////////////////////

function build() {
    var $checkinBox = $('<div>', { class: 'student-checkin-box' }),
        $labelDiv   = $('<div>', { class: "student-label-div" }),
        $inputDiv   = $('<div>', { class: 'student-input-div' }),
        $form       = $('<div>', { class: 'student-checkin-form' });

    $('<label>', {
        class: "student-label",
        text: "Enter session code:"
    }).appendTo($labelDiv);

    // Hidden alert for success or failure messages
    this.$alert = $('<div>', { class: 'alert-container collapse' })
        .appendTo($checkinBox);

    // Text field
    this.$input = $('<input>', {
        class: "student-input",
        type: "text",
        title: "Check-in",
        autocomplete: "off",
        autofocus: true,
        inputmode: "verbatim",
        maxlength: 5,
        minlength: 5
    }).keypress(function(e) {
        // Dismiss the error/success alert if it's there
        this.$alert.collapse('hide');

        if (e.keyCode == 13) { // if Enter
            this.$button.click();
        }
    }.bind(this)).appendTo($inputDiv);

    // Submit button
    this.$button = $('<button>', {
        class: 'student-submit-button btn btn-primary',
        text: 'Sign In'
    }).click(_.debounce(submit.bind(this), 500, true));

    $form
        .append($labelDiv)
        .append($inputDiv)
        .append(this.$button)
        .appendTo($checkinBox);

    $checkinBox.appendTo(this._$element);

    // Functions

    this.displayAlert = function(message, isError) {
        this.$alert.empty();
        this.$alert.append($('<div>', {
            class: 'alert alert-' + (isError === true ? 'danger' : 'success'),
            text: message
        }));
        this.$alert.collapse('show');
    };
}

function submit() {
    var code = this.$input.val();
    if (!code) {
        this.displayAlert('Code cannot be empty', true);
    } else if (code.length < 5) {
        this.displayAlert('Code is too short', true);
    } else if (code.length > 5) {
        this.displayAlert('Code is too long', true);
    } else {
        ci.ajax({
            method: 'POST',
            url: '/student/sign-in/' + code,
            done: success.bind(this),
            fail: failure.bind(this)
        });
    }
}

function success(data, status, xhr) {
    this.displayAlert('Signed in!', false);
}

function failure(xhr, status, errorThrown) {
    if (xhr.status && xhr.status === 409) // Conflict - already signed in
        this.displayAlert('Failed: Already logged in', true);
    else
        this.displayAlert('Failed! ' + (xhr.responseText ? xhr.responseText : ''), true);
}

module.exports = CheckIn;
