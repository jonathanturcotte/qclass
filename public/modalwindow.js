
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
    
    this.show = function() {
        return this.getSelf().modal('show');
    };

    this.hide = function() {
        return this.getSelf().modal('hide');
    };
    
    /**
     * Fetches its top-level div and returns the jQuery object
     */
    this.getSelf = function() {
        return $(`#${this.id}`);
    };

    this.appendToHeader = function($toAppend, shouldEmpty = false) {
        appendToSection.bind(this)(shouldEmpty, 'header', $toAppend);
    };

    this.appendToBody = function($toAppend, shouldEmpty = false) {
        appendToSection.bind(this)(shouldEmpty, 'body', $toAppend);
    };

    this.appendToFooter = function($toAppend, shouldEmpty = false) {
        appendToSection.bind(this)(shouldEmpty, 'footer', $toAppend);
    };

    /**
     * Transitions modal style to an error state.
     * The body is replaced with the message if given, and if a title is given the title is changed.
     * Non-closeable modals will become closeable
     * @param {string=} message
     * @param {string=} title
     */
    this.error = function(title, message) {
        updateStatus.bind(this)(title, message, 'modal-header-danger');
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
        updateStatus.bind(this)(title, message, 'modal-header-success');
        if (!this.closeable) this.makeCloseable();
    }

    this.makeCloseable = function() {
        var $window = this.getSelf();
        $window.find('.modal-header').append(closeElements.headerEx);
        $window.find('.modal-footer').append(closeElements.footerButton);
        var data = $window.data('bs.modal');
        $window.removeData('bs.modal').modal({ 
                backdrop: true,
                keyboard: true
            });
        $window.prev($('.modal-backdrop')).remove(); // remove second backdrop created by .modal()
        this.closeable = true;
    };
};

function appendToSection(shouldEmpty, section, $toAppend) {
    $section = this.getSelf().find($(`.modal-${section}`));
    if (shouldEmpty) $section.empty();
    $section.append($toAppend);
};

function updateStatus(title, message, headerClass) {
    var $window = this.getSelf();
    if (message) {
        $window.find('.modal-body')
            .empty()
            .append($('<p>', { text: message }));
    }
    var $header = $window.find('.modal-header').addClass(headerClass);
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