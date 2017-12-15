/**
 * Make an element editable
 * @param {*} $el jQuery element to make editable
 * @param {string} cID 
 * @param {string} field 
 * @param {string} routeBase 
 */
var Editable = function ($el, cID, field, route) {
    this.$el        = $el;   // The element to make editable
    this.cID        = cID;   // The course id that this field is associated with
    this.field      = field; // The name of the field that this element changes on the db side
    this.route      = route; // The route to call using ajax
    this.resetValue = '';    // The last valid version of the text in this element

    makeEditable.call(this);
};

///////////////////////
// Private Functions //
///////////////////////

function makeEditable () {
    // Make the element editable, but disable spellcheck and such
    this.$el.attr({
        'contenteditable': 'true',
        'autocomplete'   : 'off',
        'autocorrect'    : 'off',
        'autocapitalize' : 'off',
        'spellcheck'     : 'false'
    });

    // Store the original value
    storeResetValue.call(this);

    // Add the edit icon, and display/hide it when hovering
    this.$el.parent().append($('<div>', { class: 'editable-icon editable-icon-hidden' }));
    this.$el.hover(showEditIcon.bind(this), hideEditIcon.bind(this));

    // Handle enter and esc keypresses
    this.$el.keydown(handleKeypress.bind(this));

    // Submit when the user clicks away
    this.$el.blur(submitChanges.bind(this));
}

function storeResetValue () {
    this.resetValue = this.$el.text();
}

function resetValue () {
    this.$el.text(this.resetValue);
}

function handleKeypress (e) {
    keyCode = e.which;

    if (keyCode === 13) {
        // Enter
        e.stopPropagation();
        e.preventDefault();

        // Try to submit the changes
        submitChanges.call(this);
    } else if (keyCode === 27) {
        // Esc
        e.stopPropagation();
        e.preventDefault();

        // Undo the changes
        resetValue.call(this);
        this.$el.blur();
        hideEditIcon.call(this);
    }
}

function submitChanges () {
    var newVal = this.$el.text();

    // Only submit if there's actually been changes.
    // Prevents submitting on ESC keypress.
    if (newVal !== this.resetValue){
        var args = {
            url: this.route,
            data: { }
        };
        args.data[this.field] = newVal;

        $.post(args).done(function(status, xhr) {
            this.resetValue = newVal;
            toastr.success('Successfully updated class ' + this.field, 'Saved successfully');

            // Update the classlist listing
            window.app.classList.updateClassText(this.cID, this.field, newVal);
        }.bind(this)).fail(function(xhr, status, errorThrown) {
            resetValue.call(this);
            toastr.error('Failed to update class ' + this.field + ': ' + xhr.responseText, 'Failed to save changes');
        }.bind(this)).always(function(a, status, b) {
            this.$el.blur();
        }.bind(this));
    }

    // Hide the icon whether or not the value has changed
    hideEditIcon.call(this);
}

function showEditIcon () {
    this.$el.parent().children('.editable-icon').removeClass('editable-icon-hidden');
}

function hideEditIcon() {
    // Don't hide the icon if the user is actively editing the field
    if (!this.$el.is(':focus'))
        this.$el.parent().children('.editable-icon').addClass('editable-icon-hidden');
}

module.exports = Editable;