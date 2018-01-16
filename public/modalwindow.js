/**
 * Creates a modal window and appends it to the body
 * @param {Object}   options
 * @param {string=}  options.id
 * @param {string=}  options.title
 * @param {boolean=} options.closeable
 * @param {boolean=} options.minimize
 * @param {boolean=} options.initHidden
 */ 
var ModalWindow = function(options) {
    // Initialization with defaults
    this.id         = options.id;
    this.title      = options.title      || '';
    this.closeable  = options.closeable  === undefined ? true  : options.closeable;
    this.minimize   = options.minimize   === undefined ? false : options.minimize;

    // Construction of the elements
    $('#' + this.id).remove();
    this.$window = $('<div>', { class: 'modal fade', role: 'dialog', tabindex: -1, }),
    this.$footer = $('<div>', { class: 'modal-footer' }),
    this.$body   = $('<div>', { class: 'modal-body' }),
    this.$title  = $('<h4>', { class: 'modal-title', text: this.title }),
    this.$header = $('<div>', { class: 'modal-header' })
            .append(this.$title);

    if (this.id) {
        $('#' + this.id).remove();
        this.$window.attr('id', this.id);
    }

    this.$window.append($('<div>', { class: 'modal-dialog', role: 'document' })
        .append($('<div>', { class: 'modal-content' })
            .append(this.$header)
            .append(this.$body)
            .append(this.$footer)))
        .appendTo('body');

    // Append close button to header and footer
    if (this.closeable){
        this.$window.modal({
            backdrop: true,
            keyboard: true
        });
        this.makeCloseable();
    } else {
        // Otherwise, stop other closing methods
        this.$window.modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    // If the minimize option is set to false, make it so that
    // when the modal is closed it is removed from the DOM instead
    // of just being hidden
    if (!this.minimize) {
        this.$window.on('hidden.bs.modal', function (e) {
            this.remove();
        });
    }
};

ModalWindow.prototype.show = function () {
    this.$window.modal('show');
};

ModalWindow.prototype.hide = function () {
    this.$window.modal('hide');
};

ModalWindow.prototype.appendToHeader = function ($toAppend, shouldEmpty) {
    shouldEmpty = (typeof shouldEmpty !== 'undefined') ?  shouldEmpty : false;
    appendToSection.call(this, shouldEmpty, this.$header, $toAppend);
};

ModalWindow.prototype.appendToBody = function ($toAppend, shouldEmpty) {
    shouldEmpty = (typeof shouldEmpty !== 'undefined') ?  shouldEmpty : false;
    appendToSection.call(this, shouldEmpty, this.$body, $toAppend);
};

ModalWindow.prototype.appendToFooter = function ($toAppend, shouldEmpty) {
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
ModalWindow.prototype.error = function (title, message) {
    updateStatus.call(this, title, message, 'modal-header-danger');
    
    if (!this.closeable)
        this.makeCloseable();
};

/**
 * Transitions modal style to a success state.
 * The body is replaced with the message if given, and if a title is given the title is changed.
 * @param {string=} message
 * @param {string=} title
 */
ModalWindow.prototype.success = function (title, message) {
    updateStatus.call(this, title, message, 'modal-header-success');
};

ModalWindow.prototype.makeCloseable = function () {
    // TODO: make this less ugly
    // The close elements
    this.$headerEx = $('<button>', { class: 'close closeable', type: 'button' })
        .attr('data-dismiss', 'modal')
        .attr('aria-label', 'Close')
        .append($('<span>')
            .attr('aria-hidden', 'true')
            .html('&times;'));
    this.$closeButton = $('<button>', { class: 'btn btn-default closeable',  text: 'Close' })
            .attr('data-dismiss', 'modal');

    this.$header.append(this.$headerEx);
    this.$footer.append(this.$closeButton);

    // Make it so that clicking the backdrop closes the modal
    // Note that this doesn't seem to work properly for the keyboard value
    // probably because it's a value only checked when adding the event handler.
    this.$window.data('bs.modal')._config.backdrop = true;

    this.closeable = true;
};

ModalWindow.prototype.remove = function () {
    this.$window.remove();
};

///////////////////////
// Private Functions //
///////////////////////

function appendToSection(shouldEmpty, $section, $toAppend) {
    if (shouldEmpty)
        $section.empty();

    $section.append($toAppend);
}

function updateStatus(title, message, headerClass) {
    if (message) {
        this.$body
            .empty()
            .append($('<p>', { text: message }));
    }

    if (title) {
        this.$title = $('<h4>', { class: 'modal-title', text: title });
        this.$header.empty().append(this.$title);
    }

    this.$header.addClass(headerClass);
}

module.exports = ModalWindow;