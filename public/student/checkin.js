var CheckIn = function () {
    this._$element = $('.student-checkin');
    build.call(this);
};

///////////////////////
// Private Functions //
///////////////////////

function build() {
    var $labelDiv = $('<div>', { class: "student-label-div" }),
        $inputDiv = $('<div>', { class: "student-input-div" });

    $('<label>', {
        class: "student-label",
        text: "Enter session code:"
    }).appendTo($labelDiv);
    
    // Hidden alert for success or failure messages
    this.$alert = $('<div>', { class: 'alert-container collapse' })
        .appendTo(this._$element);

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
        if (e.keyCode == 13) { // if Enter
            this.$button.click();
        } 
    }.bind(this)).appendTo($inputDiv);

    // Submit button
    this.$button = $('<button>', { 
        class: 'student-submit-button btn btn-primary',
        text: 'Sign In'
    }).click(function() {
        var code = this.$input.val();
        if (!code) {
            this.displayAlert('Code cannot be empty', true);
        } else if (code.length < 5) {
            this.displayAlert('Code is too short', true);
        } else if (code.length > 5) {
            this.displayAlert('Code is too long', true);
        }
        else {
            ci.ajax({
                method: 'POST',
                url: '/student/sign-in/' + code,
                done: success.bind(this),
                fail: failure.bind(this)
            });
        }
    }.bind(this));

    $labelDiv.appendTo(this._$element);
    $inputDiv.appendTo(this._$element);
    this.$button.appendTo(this._$element);

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