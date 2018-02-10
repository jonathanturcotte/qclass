var SessionManager = require('./sessions'),
    AdminManager   = require('./adminManager'),
    CourseManager  = require('./courses'),
    Table          = require('../components/table'),
    SessionTable   = require('./sessionTable'),
    StudentTable   = require('./studentTable'),
    Exporter       = require('./exporter'),
    Importer       = require('./importer'),
    Editable       = require('../components/editable'),
    Duration       = require('../components/duration'),
    TableUpdater   = require('./tableUpdater');

var durationOptions = [ 
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
    this.$element       = $('.classpage');
    this.exporter       = new Exporter();
    this.importer       = new Importer();
    this.adminManager   = new AdminManager();
    this.courseManager  = new CourseManager();
    this.pageBuildFlag  = false;
    this.sessionManager = new SessionManager();
    
    this.sessionManager.refreshSessions.call(this.sessionManager, function() {
        if (this.pageBuildFlag) {
            if(this.sessionManager.isCourseRunning(this.course)) {
                var $delButton    = $('.class-delete-button'),
                    $delButtonDiv = $('.del-button-div'),
                    $startButton  = $('.start-button');
                sessionOnChanges($delButton, $delButtonDiv, $startButton);
            } 
        }
    }.bind(this));
}

/**
 * Display's a course page given the course object
 * @param {Object} course The selected course the page should use to construct itself 
 * @param {string} course.cID
 * @param {string} course.cName
 * @param {string} course.cCode
 */
ClassPage.prototype.displayCourse = function (course) {
    this.course = course;

    // Clear the old page and build the new one
    this.$element.empty();
    build.call(this);
};

ClassPage.prototype.displayBlankPage = function () {
    this.$element.empty();
};

ClassPage.prototype.refreshTables = function () {
    this.tableUpdater.updateTables();
};

///////////////////////
// Private Functions //
///////////////////////

/**
 * Builds the classpage, adds it to the DOM
 */
function build () {
    var $topDiv       = $('<div>', { class: 'class-top-div row' }),
        $titleDiv     = $('<div>', { class: 'class-title-div col-auto' }),
        $nameDiv      = $('<div>'),
        $codeDiv      = $('<div>'),
        $optionsDiv   = $('<div>', { class: 'class-options-div col' }),
        $adminButton  = $('<button>', { text: 'Edit Administrators', class: 'class-admin-button btn btn-danger btn-square btn-xl' }),
        $delDiv       = $('<div>', { class: "del-button-div", style: "display: inline-block" }),
        $delButton    = $('<button>', { text: 'Delete Course', class: 'class-delete-button btn btn-danger btn-square btn-x1' }),
        $titleCode    = $('<h2>', { class: 'class-title-code title-field', text: this.course.cCode }),
        $titleName    = $('<h3>', { class: 'class-title-name title-field', text: this.course.cName }),
        $attDiv       = $('<div>', { class: 'class-attendance-div' }),
        $attDivLeft   = $('<div>', { class: 'class-attendance-div-left'}),
        $attDivRight  = $('<div>', { class: 'class-attendance-div-right'}),
        $startButton  = $('<button>', { class: 'btn btn-circle btn-danger btn-xl start-button', text: 'Start'}),
        $tableRow     = $('<div>', { class: 'class-content row' }),
        $tableCol1    = $('<div>', { class: 'class-table-column-div col' }),
        $tableCol2    = $('<div>', { class: 'class-table-column-div col' }),
        $sessionDiv   = $('<div>', { class: 'table-div' }),
        $studentDiv   = $('<div>', { class: 'table-div' }),
        $studentTotal = $('<div>', { class: 'btn btn-light  btn-square btn-xl disabled total-student', style: 'margin-top: 10px; float: left;', text: "Total:"} ),
        $sessionTotal = $('<div>', { class: 'btn btn-light  btn-square btn-xl disabled total-session', style: 'margin-top: 10px; float: left;', text: "Total:"} );
        $sessBottom   = $('<div>');
        $studentBottom= $('<div>');
        
    this.$element
        .append($topDiv
            .append($titleDiv
                .append($codeDiv
                    .append($titleCode))
                .append($nameDiv)
                    .append($titleName))
            .append($optionsDiv))
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
    this.titleName = new Editable($titleName, this.course.cID, 'name', '/professor/class/editName/' + this.course.cID);
    this.titleCode = new Editable($titleCode, this.course.cID, 'code', '/professor/class/editCode/' + this.course.cID);

    // Add the edit and delete button if owner
    if (this.course.isOwner) {
        $adminButton.click(this.adminManager.manageAdmins.bind(this, this.course));

        // Need to append button to div to get tooltips
        $delDiv.append($delButton.click(this.courseManager.deleteCourse.bind(this, this.course, this.sessionManager)));
        
        $adminButton.appendTo($optionsDiv);
        $delDiv.appendTo($optionsDiv);
    }

    // Check if this course is currently running a session
    this.pageBuildFlag = true;
    if (this.sessionManager.isCourseRunning(this.course))
        sessionOnChanges($delButton, $delDiv, $startButton);

    // Attendance section
    $('<label>', { text: 'Start an attendance session:', class: 'class-attendance-label' })
        .prependTo($attDiv);

    // Duration selection
    $('<label>', { text: 'Check-in duration:', class: 'class-duration-label' })
        .appendTo($attDivRight);
    this.$duration = getDurationSelect(this.course.cID)
        .appendTo($attDivRight);

    // Bind duration to start button press
    $startButton.click(function () { 
        this.sessionManager.startSession(this.course, this.$duration.val());
    }.bind(this));

    // The session table and export button
    this.sessionTable = new SessionTable(this.course, $sessionDiv);

    $('<h5>', { text: 'Sessions', style: 'text-align: center'})
        .prependTo($sessionDiv);

    $sessBottom.appendTo($sessionDiv);

    $sessionTotal
        .appendTo($sessBottom);

    $('<div>', { class: "exp-button-div", style: "display: inline-block; margin-top: 10px" })
        .append($('<button>', { class: 'class-export-button btn btn-danger btn-square btn-xl', text: 'Export Attendance' })
            .click(this.exporter.createExportModal.bind(this, this.course)))
        .appendTo($sessBottom);

    // The student table and associated buttons
    this.studentTable = new StudentTable(this.course, $studentDiv);

    $('<h5>', { text: 'Students', style: 'text-align: center'})
        .prependTo($studentDiv);

    $studentBottom.appendTo($studentDiv);
    
    $studentTotal
        .appendTo($studentBottom);

    $('<button>', { text: 'Import Classlist', class: 'class-import-button btn btn-danger btn-square btn-xl', style: 'inline-block' })
        .click(this.importer.createImportModal.bind(this, this.course))
        .appendTo($studentBottom);

    $('<button>', { text: 'Add Student', class: 'class-addstudent-button btn btn-danger btn-square btn-xl', style: 'inline-block' })
        .click(this.importer.createAddStudentModal.bind(this, this.course))
        .appendTo($studentBottom);

    // Initialize the tableUpdater and fill the tables
    this.tableUpdater = new TableUpdater(this.course.cID, this.sessionTable, this.studentTable);
    this.tableUpdater.updateTables();

   



}

/**
 * Constructs and returns the jQuery object for the duration drop-down
 * using the pre-defined durationOptions array
 */
function getDurationSelect(classID) {
    var $select = $('<select>', { class: 'class-duration-select' }),
        prevChoiceCookie = Cookies.get('last-duration-' + classID),
        prevChoice = null;

    // Parse the previously selected value
    if (prevChoiceCookie) {
        prevChoice = Number.parseInt(prevChoiceCookie);
        if (isNaN(prevChoice)) {
            prevChoice = null;        
        }
    }

    durationOptions.forEach(function (duration) {
        var $option = $('<option>', { 
            text: duration.text, 
            value: duration.milliseconds 
        });

        if (prevChoice && prevChoice === duration.milliseconds)
            $option.prop('selected', true);
        
        $select.append($option);
    });

    return $select;
}

function sessionOnChanges($delButton, $delDiv, $startButton) {
    // Makes start button green        
    $startButton.removeClass('btn-danger')
        .addClass('btn-success');
    $startButton.text('Show');

    // Makes delete button disable + adds tooltip
    $delDiv.attr({
        'data-toggle'    : 'tooltip',
        'data-placement' : 'top',
        'title'          : 'Stop running session before deleting course'
    }).tooltip();

    $delButton.addClass('disabled')
        .css('pointer-events','none');    
}

module.exports = ClassPage;