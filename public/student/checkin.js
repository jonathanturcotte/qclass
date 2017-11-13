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
        text: "Check-in to a course:"
    }).appendTo($labelDiv);

    $('<input>', {
        class: "student-input",
        type: "text",
        title: "Check-in",
        autocomplete: "off",
        autofocus: true,
        inputmode: "verbatim",
        maxlength: 5,
        minlength: 5,
    }).appendTo($inputDiv);

    $labelDiv.appendTo(this._$element);
    $inputDiv.appendTo(this._$element);
}

module.exports = CheckIn;