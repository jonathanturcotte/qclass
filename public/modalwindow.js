
/**
 * Creates a modal window and appends it to the body
 * @param {Object} options 
 * @param {string=} options.id 
 * @param {string=} options.title
 * @param {boolean=} options.closeable
 */ 
var ModalWindow = function(options) {
    // Initialization with defaults
    this.id = 'modal-window';
    this.title = '';
    this.closeable = true;
    // Evaluation of options
    if (options) { // not empty
        if (options.id) this.id = options.id;
        if (options.title) this.title = options.title;
        if (typeof(options.closeable) !== 'undefined' && options.closeable !== null) 
            this.closeable = options.closeable;
    }
    // Construction of the elements
    $(`#${this.id}`).remove();
    var $window = $('<div>', { id: this.id, class: 'modal fade', role: 'dialog', tabindex: -1, }),
        $footer = $('<div>', { class: 'modal-footer' }),
        $header = $('<div>', { class: 'modal-header' })
            .append($('<h4>', { class: 'modal-title', text: this.title }));
    if (this.closeable) { // append close button to footer
        $footer.append(closeElements.footerButton);
        $header.append(closeElements.headerEx);
    } else { // stop other closing methods
        $window.modal({
            backdrop: 'static',
            keyboard: false
        });
    } 
    $window
        .append($('<div>', { class: 'modal-dialog', role: 'document' })
            .append($('<div>', { class: 'modal-content' })
                .append($header)
                .append($('<div>', { class: 'modal-body' }))
                .append($footer)))
        .appendTo('body');
    
    this.$window = $(`#${this.id}`);
    
    this.show = function() {
        this.$window.modal('show');
    };

    this.hide = function() {
        this.$window.modal('hide');
    };

    this.appendToHeader = function($toAppend, shouldEmpty = false) {
        appendToSection.call(this, shouldEmpty, 'header', $toAppend);
    };

    this.appendToBody = function($toAppend, shouldEmpty = false) {
        appendToSection.call(this, shouldEmpty, 'body', $toAppend);
    };

    this.appendToFooter = function($toAppend, shouldEmpty = false) {
        appendToSection.call(this, shouldEmpty, 'footer', $toAppend);
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
    }

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
    }

    this.makeCloseable = function() {
        this.$window.find('.modal-header').append(closeElements.headerEx);
        this.$window.find('.modal-footer').append(closeElements.footerButton);
        var data = this.$window.data('bs.modal');
        this.$window.removeData('bs.modal').modal({ 
                backdrop: true,
                keyboard: true
            });
        this.$window.prev($('.modal-backdrop')).remove(); // remove second backdrop created by .modal()
        this.closeable = true;
    };
};

function appendToSection(shouldEmpty, section, $toAppend) {
    $section = this.$window.find($(`.modal-${section}`));
    if (shouldEmpty) $section.empty();
    $section.append($toAppend);
};

function updateStatus(title, message, headerClass) {
    if (message) {
        this.$window.find('.modal-body')
            .empty()
            .append($('<p>', { text: message }));
    }
    var $header = this.$window.find('.modal-header').addClass(headerClass);
    if (title && title instanceof String) 
        $header.empty().append($('<h2', { class: 'modal-title', text: title }));
}

var closeElements = {
    headerEx: $('<button>', { class: 'close closeable', type: 'button' })
        .attr('data-dismiss', 'modal')
        .attr('aria-label', 'Close')
        .append($('<span>')
            .attr('aria-hidden', 'true')
            .html('&times;')),
    footerButton: $('<button>', { class: 'btn btn-default closeable',  text: 'Close' })
            .attr('data-dismiss', 'modal')
};

module.exports = ModalWindow;