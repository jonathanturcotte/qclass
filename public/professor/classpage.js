/*
 * Will contain functions relating to displaying classes in the main DOM window,
 * like buttons for starting attendance, the session table, exporting attendance,
 * adding/removing students, editing the class information, import class list,
 * attendance timer duration selection 
 */

var ModalWindow  = require('../modalwindow'),
    SessionTable = require('./sessionTable'),
    XLSX         = require('xlsx');

/**
 * Creates a class page, responsible for the central window of the professor site
 * @param {Object} course The selected course the page should use to construct itself 
 * @param {string} course.cID
 * @param {string} course.cName
 * @param {string} course.cCode
 */
var ClassPage = function(course) {
    if (!course) throw new Error('ClassPage received empty course');
    this.course = course;  

    /**
     * Builds the classpage, adds it to the DOM, and updates window.app.classPage
     */
    this.build = function() {
        this.$page = $('<div>', { class: 'classpage' })
            .append($('<h2>', { class: 'class-page-title-code', text: course.cCode }))
            .append($('<h3>', { class: 'class-page-title-name', text: course.cName }))
            .append($('<div>', { class: 'block',  style: 'margin-bottom: 50px'})
                .append($('<button>', { class: 'btn btn-danger btn-square btn-xl', text: 'Import Classlist', style: 'margin-right: 15px' })
                .click(createImportModal.bind(this)))
                .append($('<button>', { class: 'btn btn-danger btn-square btn-xl', text: 'Export Attendance' })
                .click(function() {
                    $.get({
                        url: '/professor/' + course.cID + '/exportAttendance'
                    }).done(function(data, status, xhr) {
                        window.location.href = '/professor/' + course.cID + '/exportAttendance';    
                    }).fail(function(xhr, status, errorThrown) {
                        alert('Error downloading attendance information');
                    });
                }))
            )
            .append($('<a>', { class: 'class-page-start-link', href: '#' })
                .append($('<button>', { class: 'btn btn-danger btn-circle btn-xl', text: 'Start' }))
                .click(createSessionModal.bind(this))
            );
        // TODO: Finish table implementation
        this.sessionTable = new SessionTable(this.course.cID).build(this.$page);
        replacePage(this.$page);
        this.sessionTable.$spinDiv.spin(); //TODO: options for spinner to make it in the right spot
        window.app.classPage = this;
    }
};

function replacePage($newPage) {
    var $classPage = $('.classpage');
    if ($classPage.length > 0) 
        $classPage.replaceWith($newPage);
    else 
        $newPage.appendTo($('.main-container'));
}

function startAttendance(data, modal) {
    modal.$header.find($('.modal-title')).text('Running Attendance Session');
    modal.appendToBody([
        $('<p>', { class: '.start-modal-top-info', text: 'Success!' }),
        $('<div>', { class: 'flex flex-start' })
            .append($('<div>', { class: 'start-modal-running-info' })
                .append($('<h3>', { class: 'start-modal-code', text: data.code })))
            .append($('<div>', { class: 'start-modal-timer-container' }))
                .append($('<h2>', { class: 'start-modal-timer' }))
    ], true);
    
    // Countdown Timer
    modal.$body.find($('.start-modal-timer'))
        .countdown(data.endTime, function(e) {
            $(this).text(e.strftime('%-H:%M:%S'));
        }).on('finish.countdown', function(e) {
            modal.success('Complete');
            modal.$body.find('.start-modal-top-info')
                .text('Session complete!')
                .addClass('.start-modal-top-info-finished');
        }).countdown('start');
}

function createSessionModal () {
    var modal = new ModalWindow({ id: 'startModal', title: 'Start Attendance Session', closeable: false });
    modal.show();
    modal.$body.spin()
        .addClass('spin-min-height');
    $.post({
        url: `/professor/class/start/${this.course.cID}`,
        data: { duration: 30000 },
        dataType: 'json'
    }).done(function(data, status, xhr) {
        startAttendance(data, modal);
    }).fail(function(xhr, status, errorThrown) {
        modal.error('Error', 'Error starting attendance session');
    }).always(function(a, status, b) {
        modal.$body.spin(false);
    });
}

function createImportModal () {
    var modal = new ModalWindow({ id: 'importModal', title: 'Import Classlist'}),
        $file = $('<input>', {type: 'file', id: 'fileName', name: 'fileName', class: 'form-control', accept: '.xlsx' }),
        $importButton = $('<button>', { type: 'submit', class: 'btn btn-primary',  text: 'Import', id: 'importButton' });
    modal.$body
        .append($file);
    modal.$footer
        .prepend($importButton);
    $importButton
       .click(function () {
            $importButton.remove();
            modal.$body.empty();
            modal.$body
            .spin()
            .addClass('spin-min-height');
            var file = $file.get(0).files[0];
            var fd = new FormData();
            fd.append('excel', file);
            $.post({
                url: 'professor/class/enroll/' + this.course.cID,
                file: { file: $file.get(0).files[0] },
                processData: false,
                contentType: false,
                data: fd,
             }).done(function(status, xhr) {
                modal.success('Success', 'Classlist successfully added!');
             }).fail(function(xhr, status, errorThrown) {
                modal.error("Error", xhr.responseText);
             }).always(function(a, status, b) {
                modal.$body.spin(false);
             });
        }.bind(this));
            
    modal.show();
}

/*
function createExportModal () {
    var modal      = new ModalWindow({ id: 'exportModal', title: 'Export Attendance Information'}),
        $fileName  = $('<input>', {type: 'text', id: 'fileName', name: 'fileName'}),
        $fileType  = $('<select>', {class: 'btn btn-secondary dropdown-toggle dropdown-toggle-split', id: 'fileType', name: 'fileType'} ),
        $exportButton = $('<button>', { type: 'submit', class: 'btn btn-primary',  text: 'Export', id: 'exportButton' });
    modal.$body
        .append($('<p>', {text: 'Specify output file name and type:'}))
        .append($fileName)
        .append($fileType
            .append($('<option>', { text: 'csv', value: 'csv'}))
            .append($('<option>', { text: 'xslx', value: 'csv'})));
    modal.$footer
        .prepend($exportButton);
     $exportButton
        .click(function () {
            $exportButton.remove();
            modal.$body.empty();
            window.location.href = '/professor/' + this.course.cID + '/exportAttendance';
            modal.$body
            .spin()
            .addClass('spin-min-height');
            $.get({
                url: '/professor/' + this.course.cID + '/exportAttendance'
             }).done(function(status, xhr) {
                modal.success("Success", "File Successfully Downloaded");
             }).fail(function(xhr, status, errorThrown) {
                modal.error("Error", "Error Downloading File");
             }).always(function(a, status, b) {
                modal.$body.spin(false);
             });
             
        }.bind(this));
    
    modal.show();
}
*/





module.exports = ClassPage;