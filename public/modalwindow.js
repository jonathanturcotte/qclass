

// If the window is closeable, these elements can be appended
var CloseElements = {
    headerEx: $('<button>', { class: 'close closeable', type: 'button' })
        .attr('data-dismiss', 'modal')
        .attr('aria-label', 'Close')
        .append($('<span>')
            .attr('aria-hidden', 'true')
            .html('&times;')),

    footerButton: $('<button>', { class: 'btn btn-default closeable',  text: 'Close' })
            .attr('data-dismiss', 'modal')
};

/**
 * Creates a modal window and appends it to the body
 * @param {Object} options 
 * @param {string=} options.id 
 * @param {string=} options.title
 * @param {boolean=} options.closeable
 */ 
var ModalWindow = function(options) {
    // Initialization with defaults
    this.id         = options.id        || 'modal-window';
    this.title      = options.title     || '';
    this.closeable  = options.closeable || true;

    // Construction of the elements
    $('#' + this.id).remove();
    var $window = $('<div>', { id: this.id, class: 'modal fade', role: 'dialog', tabindex: -1, }),
        $footer = $('<div>', { class: 'modal-footer' }),
        $body = $('<div>', { class: 'modal-body' }),
        $header = $('<div>', { class: 'modal-header' })
            .append($('<h4>', { class: 'modal-title', text: this.title }));

    // Append close button to header and footer
    if (this.closeable) {
        $footer.append(closeElements.footerButton);
        $header.append(closeElements.headerEx);
    } else {
        // Otherwise, stop other closing methods
        $window.modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $window
        .append($('<div>', { class: 'modal-dialog', role: 'document' })
            .append($('<div>', { class: 'modal-content' })
                .append($header)
                .append($body)
                .append($footer)))
        .appendTo('body');
    
    this.$window = $window;
    this.$header = $header;
    this.$body   = $body;
    this.$footer = $footer;
};

    this.show = function() {
        this.$window.modal('show');
    };

    this.hide = function() {
        this.$window.modal('hide');
    };

    this.appendToHeader = function($toAppend, shouldEmpty) {
        shouldEmpty = (typeof shouldEmpty !== 'undefined') ?  shouldEmpty : false;
        appendToSection.call(this, shouldEmpty, this.$header, $toAppend);
    };

    this.appendToBody = function($toAppend, shouldEmpty) {
        shouldEmpty = (typeof shouldEmpty !== 'undefined') ?  shouldEmpty : false;
        appendToSection.call(this, shouldEmpty, this.$body, $toAppend);
    };

    this.appendToFooter = function($toAppend, shouldEmpty) {
        shouldEmpty = (typeof shouldEmpty !== 'undefined') ?  shouldEmpty : false;
        appendToSection.call(this, shouldEmpty, this.$footer, $toAppend);
    };

    /**
     * Transitions modal style to an error state.
     * The body is replaced with the message if given, and if a title is given the title is changed.
     * Non-closeable modals will become closeable
     * @param {string=} message
     * @param {string=} title
     */
    this.error = function(title, message) {
        updateStatus.call(this, title, message, 'modal-header-danger');
        if (!this.closeable) this.makeCloseable();
    };

    /**
     * Transitions modal style to a success state.
     * The body is replaced with the message if given, and if a title is given the title is changed.
     * Non-closeable modals will become closeable
     * @param {string=} message
     * @param {string=} title
     */
    this.success = function(title, message) {
        updateStatus.call(this, title, message, 'modal-header-success');
        if (!this.closeable) this.makeCloseable();
    };

    this.makeCloseable = function() {
        this.$header.append(closeElements.headerEx);
        this.$footer.append(closeElements.footerButton);
        var data = this.$window.data('bs.modal');
        this.$window.removeData('bs.modal').modal({ 
                backdrop: true,
                keyboard: true
            });
        this.$window.prev($('.modal-backdrop')).remove(); // remove second backdrop created by .modal()
        this.closeable = true;
    };

///////////////////////
// Private Functions //
///////////////////////

function appendToSection(shouldEmpty, $section, $toAppend) {
    if (shouldEmpty) $section.empty();
    $section.append($toAppend);
}

function updateStatus(title, message, headerClass) {
    if (message) {
        this.$body
            .empty()
            .append($('<p>', { text: message }));
    }
    this.$header.addClass(headerClass);
    if (title) 
        this.$header.empty().append($('<h2>', { class: 'modal-title', text: title }));
}

module.exports = ModalWindow;