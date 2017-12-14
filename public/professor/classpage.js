var SessionManager    = require('./sessions'),
    SessionTable      = require('./sessionTable'),
    Exporter          = require('./exporter'),
    Importer          = require('./importer'),
    Editable          = require('../components/editable'),
    Duration          = require('../components/duration');

const durationOptions = [ 
    new Duration('30 sec', 30000), 
    new Duration('45 sec', 45000), 
    new Duration('1 min', 60000),
    new Duration('1.5 min', 90000), 
    new Duration('2 min', 120000),
    new Duration('3 min', 180000), 
    new Duration('5 min', 300000), 
    new Duration('10 min', 600000), 
    new Duration('30 min', 1800000), 
    new Duration('1 hour', 3600000), 
    new Duration('3 hours', 10800000)
];

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
        $startButton = $('<button>', { class: 'btn btn-danger btn-circle btn-xl', text: 'Start' }),
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
            .append($attDivLeft
                .append($startButton))
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

    // Duration selection
    $('<label>', { text: 'Check-in duration:', class: 'class-duration-label' })
        .appendTo($attDivRight);
    this.$duration = getDurationSelect()
        .appendTo($attDivRight);

    // Bind duration to start button press
    $startButton.click(function () { 
        this.sessions.startSession(this.course, this.$duration.val()); 
    }.bind(this));
        

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

/**
 * Constructs and returns the jQuery object for the duration drop-down
 * using the pre-defined durationOptions array
 */
function getDurationSelect() {
    var $select = $('<select>', { class: 'class-duration-select' });
    durationOptions.forEach(function (duration) {
        $select.append($('<option>', { 
            text: duration.text, 
            value: duration.milliseconds 
        }));
    });
    return $select;
}

module.exports = ClassPage;