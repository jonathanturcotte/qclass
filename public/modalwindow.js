
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
    var $window = $('<div>', { id: this.id, class: 'modal fade', role: 'dialog', tabindex: -1, }),
        $footer = $('<div>', { class: 'modal-footer' }),
        $header = $('<div>', { class: 'modal-header' })
            .append($('<h4>', { class: 'modal-title centered', text: this.title }));
    if (this.closeable) { // append close button to footer
        $footer.append(
            $('<button>', { class: 'btn btn-default',  text: 'Close' })
                .attr('data-dismiss', 'modal')
        );
        $header.append($('<button>', { class: 'close', type: 'button' })
            .attr('data-dismiss', 'modal')
            .attr('aria-label', 'Close')
            .append($('<span>')
                .attr('aria-hidden', 'true')
                .html('&times;')));
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
    
    this.remove = function() {
        return this.getSelf().remove();
    };
    
    this.getSelf = function() {
        return $(`#${this.id}`);
    };
};

module.exports = ModalWindow;