
/**
 * Make an element editable
 * @param {Object} $el      jQuery element to make editable
 * @param {Object} ajaxCall The ajaxcall to run
 */
var Editable = function ($el, ajaxCall) {
    this.$el        = $el;
    this.ajaxCall   = ajaxCall;
    this.resetValue = '';

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
    this.$el.parent().append($('<img>', { class: 'editable-icon editable-icon-hidden' }));
    this.$el.hover(showEditIcon.bind(this), hideEditIcon.bind(this));

    // Handle enter and esc keypresses
    this.$el.keydown(handleKeypress.bind(this));
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
        // Try to submit the changes
        this.$el.blur();
    } else if (keyCode === 27) {
        // Esc
        // Undo the changes
        this.$el.blur();
        resetValue.call(this);
    }
}

function showEditIcon () {
    this.$el.parent().children('.editable-icon').removeClass('editable-icon-hidden');
}

function hideEditIcon() {
    var $parent = 
    this.$el.parent().children('.editable-icon').addClass('editable-icon-hidden');
}

module.exports = Editable;