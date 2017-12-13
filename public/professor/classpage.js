var SessionManager    = require('./sessions'),
    SessionTable      = require('./sessionTable'),
    Exporter          = require('./exporter'),
    Importer          = require('./importer'),
    Editable          = require('../components/editable');

/**
 * Creates a class page, responsible for the central window of the professor site
*/
var ClassPage = function() {
    this.$element = $('.classpage');
    this.exporter = new Exporter();
    this.importer = new Importer();
    this.sessions = new SessionManager();
};

/**
 * Display's a course page given the course object
 * @param {Object} course The selected course the page should use to construct itself 
 * @param {string} course.cID
 * @param {string} course.cName
 * @param {string} course.cCode
*/
ClassPage.prototype.displayCourse = function (course) {
    this.course = course;

    // Clear the old page
    this.$element.empty();
    build.call(this);
};

///////////////////////
// Private Functions //
///////////////////////

/**
 * Builds the classpage, adds it to the DOM
 */
function build () {
    var $topDiv      = $('<div>', { class: 'class-top-div' }),
        $titleDiv    = $('<div>', { class: 'class-title-div' }),
        $nameDiv     = $('<div>'),
        $codeDiv     = $('<div>'),
        $editDiv     = $('<div>', { class: 'class-edit-div' }),
        $titleCode   = $('<h2>', { class: 'class-title-code title-field', text: this.course.cCode }),
        $titleName   = $('<h3>', { class: 'class-title-name title-field', text: this.course.cName }),
        $attDiv      = $('<div>', { class: 'class-attendance-div' }),
        $attDivLeft  = $('<div>', { class: 'class-attendance-div-left'}),
        $attDivRight = $('<div>', { class: 'class-attendance-div-right'}),
        $tableRow    = $('<div>', { class: 'class-content row' }),
        $tableCol1   = $('<div>', { class: 'class-table-column-div col' }),
        $tableCol2   = $('<div>', { class: 'class-table-column-div col' }),
        $sessionDiv  = $('<div>', { class: 'table-div' }),
        $studentDiv  = $('<div>', { class: 'table-div' });

    this.$element
        .append($topDiv
            .append($titleDiv
                .append($codeDiv
                    .append($titleCode))
                .append($nameDiv)
                    .append($titleName))
            .append($editDiv))
        .append($attDiv
            .append($attDivLeft)
            .append($attDivRight))
        .append($tableRow
            .append($tableCol1
                .append($sessionDiv))
            .append($tableCol2
                .append($studentDiv)));

    // Wrap the title and course code in divs so that Editable can append an edit icon in-line on hover
    this.titleName = new Editable($titleName, this.course.cID, 'name', '/professor/class/editName');
    this.titleCode = new Editable($titleCode, this.course.cID, 'code', '/professor/class/editCode');

    // Add the edit button
    $('<button>', { text: 'Edit Administrators', class: 'btn btn-danger btn-square btn-xl' })
        .click(editAdministrators.bind(this))
        .appendTo($editDiv);

    // Attendance section
    $('<label>', { text: 'Start an attendance session:', class: 'class-attendance-label' })
        .prependTo($attDiv);
    
    // Start button
    $('<button>', { class: 'btn btn-danger btn-circle btn-xl', text: 'Start' })
        .click(function () { this.sessions.startSession(this.course); }.bind(this))
        .appendTo($attDivLeft);

    // Duration selection
    $('<label>', { text: 'Check-in duration:', class: 'class-duration-label' })
        .appendTo($attDivRight);
    $('<select>', { class: 'class-duration-select' })
        .appendTo($attDivRight);

    // The session table and export button
    this.sessionTable = new SessionTable(this.course.cID, $sessionDiv);

    $('<button>', { class: 'class-export-button btn btn-danger btn-square btn-xl', text: 'Export Attendance' })
        .click(this.exporter.createExportModal.bind(this))
        .appendTo($sessionDiv);

    // The student table and associated buttons
    // TODO: add actual student table and stop setting width/height here
    // this.studentTable = new StudentTable(this.course.cID, $studentDiv);
    var $fakeTable = $('<div>', { width: 400, height: 300 })
        .css({ background: 'white'})
        .appendTo($studentDiv);

    $('<button>', { text: 'Import Classlist', class: 'class-import-button btn btn-danger btn-square btn-xl' })
        .click(this.importer.createImportModal)
        .appendTo($studentDiv);

    $('<button>', { text: 'Add Student', class: 'class-addstudent-button btn btn-danger btn-square btn-xl' })
        .click(this.importer.createAddStudentModal)
        .appendTo($studentDiv);
}

function editAdministrators() {
    //TODO: complete
}

module.exports = ClassPage;