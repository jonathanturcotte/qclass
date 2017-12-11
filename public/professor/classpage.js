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
    this.course  = course;

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
        $attDiv      = $('<div>', { class: 'class-attendance-div' }),
        $attDivLeft  = $('<div>', { class: 'class-attendance-div-left'}),
        $attDivRight = $('<div>', { class: 'class-attendance-div-right'}),
        $tableRow    = $('<div>', { class: 'class-content row' }),
        $tableCol1   = $('<div>', { class: 'class-session-table-div text-center col' }),
        $tableCol2   = $('<div>', { class: 'class-student-table-div text-center col' });

    // Construct the title and course code, and make them in-line editable
    // Wrap each in a div so that Editable can append an edit icon in-line on hover

    var $titleCode = $('<h2>', { class: 'class-title-code', text: this.course.cCode })
        .css('display', 'inline-block')
        .appendTo($codeDiv);
    var $titleName = $('<h3>', { class: 'class-title-name', text: this.course.cName })
        .css('display', 'inline-block')
        .appendTo($nameDiv);

    this.titleName = new Editable($titleName, this.course.cID, 'name', '/professor/class/editName');
    this.titleCode = new Editable($titleCode, this.course.cID, 'code', '/professor/class/editCode');

    $codeDiv.appendTo($titleDiv);
    $nameDiv.appendTo($titleDiv);
    $titleDiv.appendTo($topDiv);

    // Add the edit button
    $('<button>', { text: 'Edit Administrators', class: 'btn btn-danger btn-square btn-xl' })
        .click(editAdministrators.bind(this))
        .appendTo($editDiv);
    $editDiv.appendTo($topDiv);

    // The attendance div and options
    $('<label>', { text: 'Start an attendance session:', class: 'class-attendance-label' })
    .appendTo($attDiv);

    $('<button>', { class: 'btn btn-danger btn-circle btn-xl', text: 'Start' })
        .click(function () { this.sessions.startSession(this.course); }.bind(this))
        .appendTo($attDivLeft);

    $('<label>', { text: 'Check-in duration:', class: 'class-duration-label' })
        .appendTo($attDivRight);
    $('<select>', { class: 'class-duration-select' }).appendTo($attDivRight);

    $attDivLeft.appendTo($attDiv);
    $attDivRight.appendTo($attDiv);

    // The session table and export button
    var $sessionDiv = $('<div>', { style: 'text-align: right; display: inline-block;' });
    this.sessionTable = new SessionTable(this.course.cID, $sessionDiv);

    $('<button>', { class: 'class-export-button btn btn-danger btn-square btn-xl', text: 'Export Attendance' })
        .click(this.exporter.createExportModal.bind(this))
        .appendTo($sessionDiv);

    $sessionDiv.appendTo($tableCol1);

    // The student table and associated buttons
    // TODO: add actual student table and stop setting width/height here
    // this.studentTable = new StudentTable(this.course.cID, $studentDiv);
    var $studentDiv = $('<div>', { style: 'text-align: right; display: inline-block;' });
    var $fakeTable = $('<div>')
        .width(400)
        .height(300)
        .css({ background: 'white'})
        .appendTo($studentDiv);

    $('<button>', { text: 'Import Classlist', class: 'class-import-button btn btn-danger btn-square btn-xl' })
        .click(this.importer.createImportModal)
        .appendTo($studentDiv);

    $('<button>', { text: 'Add Student', class: 'class-addstudent-button btn btn-danger btn-square btn-xl' })
        .click(this.importer.createAddStudentModal)
        .appendTo($studentDiv);

    $studentDiv.appendTo($tableCol2);

    // Conatiner that puts the following tables in a row
    // if the view is large enough, otherwise puts them one below the other
    $tableRow.append($tableCol1)
        .append($tableCol2);

    this.$element.append($topDiv)
        .append($attDiv)
        .append($tableRow);
}

function editAdministrators() {
    //TODO: complete
}

module.exports = ClassPage;