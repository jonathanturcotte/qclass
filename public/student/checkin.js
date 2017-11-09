var CheckIn = function () {
    this._$element = $('.student-checkin');
    build.call(this);
};

///////////////////////
// Private Functions //
///////////////////////

function build() {
    $label = $('<label>', { 
        class: "student-label",
        text: "Check-in to a course:"
    }).appendTo(this._$element);
    $input = $('<input>', {
        class: "student-input",
        type: "text",
        title: "Check-in",
        autocomplete: "off",
        autofocus: true,
        inputmode: "verbatim",
        maxlength: 5,
        minlength: 5
    }).appendTo(this._$element);
}

module.exports = CheckIn;