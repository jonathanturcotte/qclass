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
                .append($('<button>', { class: 'btn btn-danger btn-square btn-xl', text: 'Add Student', style: 'margin-right: 15px' })
                .click(createAddStudentModal.bind(this)))
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
        .append($('<p>', { text: "Please submit your .xlsx classlist file:" }))
        .append($file);
    modal.$footer
        .prepend($importButton);
    $importButton
       .click(function () {
            var file   = $file.get(0).files[0],
                reader = new FileReader(),
                cID    = this.course.cID;
            
            $importButton.remove();
            modal.$body.empty();
            modal.$body
                .spin()
                .addClass('spin-min-height');
          
            if (!file){
                modal.error('Error', 'No file submitted');
                return;
            } else if (!checkFileExtension(file)) {
                modal.error('Error', 'Incorrect file type submitted');
                return;
            } else {            
                reader.onload = function(e) {
                    var sheetData     = new Uint8Array(e.target.result),
                        workbook = null;

                    try{
                        workbook = XLSX.read(sheetData, { type: 'array' });
                    }catch(error){
                        modal.error('Error', 'Incorrect file type submitted');
                        return;
                    }

                    var sheet          = workbook.Sheets[workbook.SheetNames[0]],
                        jsonSheet      = XLSX.utils.sheet_to_json(sheet, { header: ["stdNum", "name", "email", "dept", "year"] }),
                        result         = {},
                        formattedSheet = [];
                   
                    result = checkFormat    (jsonSheet);
                    //check if any errors caught in the file's format
                    if(result.error) { 
                        modal.error('Error', result.error);
                        return;
                    }                    
                    // if no error, send formatted sheet
                    formattedSheet = result.sheet;
                    $.post({
                        url: 'professor/class/enrollClass/' + cID,
                        data: JSON.stringify(formattedSheet),
                        contentType: 'application/json'
                    }).done(function(status, xhr) {
                        modal.success('Success', 'Classlist successfully added!');
                    }).fail(function(xhr, status, errorThrown) {
                        modal.error("Error", xhr.responseText);
                    }).always(function(a, status, b) {
                        modal.$body.spin(false);
                    });
                };
                reader.readAsArrayBuffer(file);
            }
        }.bind(this));
            
    modal.show();
}

function createAddStudentModal () {
    var modal   = new ModalWindow({ id: 'addStdModal', title: 'Add Student'}),
        $netId  = $('<input>', {type: 'text', name: 'netId', id: 'netId', class: 'form-control' }),
        $stdNum = $('<input>', {type: 'text', name: 'stdNum', id: 'stdNum', class: 'form-control' }),
        $fName  = $('<input>', {type: 'text', name: 'fName', id: 'fName', class: 'form-control'  }),
        $lName  = $('<input>', {type: 'text', name: 'lName', id: 'lName', class: 'form-control'  }),
        $submitButton = $('<button>', { type: 'submit', class: 'btn btn-primary',  text: 'Submit', id: 'submitAddClasses' }),
        //spans man
        $netIdSpan  = $('<span>', { class: "text-danger", style: 'margin-left: 120px; display: none'}),
        $stdNumSpan = $('<span>', { class: "text-danger", style: 'margin-left: 120px; display: none'}),
        $fNameSpan  = $('<span>', { class: "text-danger", style: 'margin-left: 120px; display: none'}),
        $lNameSpan  = $('<span>', { class: "text-danger", style: 'margin-left: 120px; display: none'})
    modal.$body
        .append($netIdSpan)
        .append($('<div>', { class: 'form-group has-danger form-inline', style: 'margin-bottom: 5px' })
            .append($('<span>', { text: "NetID:", style: 'width: 100px' }))
            .append($('<div>', { class: 'col-sm-5' })
                .append($netId)))
        .append($stdNumSpan)
        .append($('<div>', { class: 'form-group has-danger form-inline', style: 'margin-bottom: 5px' })
            .append($('<span>', { text: "Student #:", style: 'width: 100px' }))
            .append($('<div>', { class: 'col-sm-5' })
                .append($stdNum)))
        .append($fNameSpan)
        .append($('<div>', { class: 'form-group has-danger form-inline', style: 'margin-bottom: 5px' })
            .append($('<span>', { text: "First Name:", style: 'width: 100px' }))
            .append($('<div>', { class: 'col-sm-5' })
                .append($fName)))
        .append($lNameSpan)
        .append($('<div>', { class: 'form-group has-danger form-inline', style: 'margin-bottom: 5px' })
            .append($('<span>', { text: "Last Name:", style: 'width: 100px' }))
            .append($('<div>', { class: 'col-sm-5' })
                .append($lName)));
    //is-invalid    
    modal.$footer
        .prepend($submitButton);

    $submitButton
        .click(function() {
            var netId  = $netId.val(),
                stdNum = $stdNum.val(),
                fName  = $fName.val(),
                lName  = $lName.val(),
                errors = findErrors(netId, stdNum, fName, lName),
                flag = 0;

            
            for(var i = 0; i < errors.length; i++) {
                if(!errors[i]) {
                    switch(i){                        
                        case 0: 
                            $netIdSpan.hide();
                            $netId.removeClass('is-invalid');
                            break;
                        case 1:
                            $stdNumSpan.hide();
                            $stdNum.removeClass('is-invalid');
                            break;
                        case 2:
                            $fNameSpan.hide();
                            $fName.removeClass('is-invalid');
                            break;
                        case 3:
                            $lNameSpan.hide();
                            $lName.removeClass('is-invalid');
                            break;
                    }
                }
                else { 
                    switch(i){                        
                        case 0: 
                            $netIdSpan.show();
                            $netIdSpan.text(errors[i]);
                            $netId.addClass('is-invalid');
                            break;
                        case 1:
                            $stdNumSpan.show();
                            $stdNumSpan.text(errors[i]);
                            $stdNum.addClass('is-invalid');
                            break;
                        case 2:
                            $fNameSpan.show();
                            $fNameSpan.text(errors[i]);
                            $fName.addClass('is-invalid');
                            break;
                        case 3:
                            $lNameSpan.show();
                            $lNameSpan.text(errors[i]);
                            $lName.addClass('is-invalid');
                            break;
                    }
                    flag = 1;
                }                
            }
            // check if any errors detected
            if (flag) return;

            $submitButton.remove();
            modal.$body.empty();
            modal.$body
                .spin()
                .addClass('spin-min-height');
            $.post({
                url: '/professor/class/enrollStudent/' + this.course.cID,
                data: { netId: netId, stdNum: stdNum, firstName: fName, lastName: lName },
                dataType: 'json'
            }).done(function(data, status, xhr) {
                modal.success('Success', 'Student successfully added!');        
            }).fail(function(xhr, status, errorThrown) {
                modal.error("Error", 'Error adding student');
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

function checkFileExtension(file) {
    var splitArr  = file.name.split('.'),
        length = splitArr.length,
        extension = splitArr[length-1];
    return "xlsx" === extension;
}

function checkFormat(sheet) {
    var result        = { error: false , sheet: [] },
        processedStds = [],
        name          = [],
        email         = [],
        netId,
        stdNum,
        firstName,
        lastName,
        check;
    // Check correct number of rows/headers    
    for(var i = 0; i < sheet.length; i++) {    
        check = (sheet[i].hasOwnProperty('stdNum') && sheet[i].hasOwnProperty('name') &&
                 sheet[i].hasOwnProperty('email') &&  sheet[i].hasOwnProperty('dept') &&
                 sheet[i].hasOwnProperty('year'));
        if(!check) {
            result.error = "File is incorrectly formatted at row " + i;
            return result;
        }
        // Parse and check email
        email = sheet[i].email.split('@');
        if (email.length != 2 || email[1] !== "queensu.ca" ) {
            result.error = 'Improper email format at row ' + i;
            return result;             
        }
        netId = email[0];
        // Get student Number
        stdNum = sheet[i].stdNum;
        // Check for valid Name
        name = sheet[i].name.split(',');
        if (name.length != 2) {
            result.error = 'Improper name format at row ' + i;
            return result;
        }
        firstName = name[1];
        lastName = name[0];
        // Set entry in valid student list
        processedStds[i] = {netId: netId, stdNum: stdNum, firstName: firstName, lastName: lastName}; 
    }
    result.sheet = processedStds;
    return result;
}

function findErrors (netId, stdNum, fName, lName) {
    var result = [false, false, false, false];
    // check netID
    if (!netId || typeof(netId) !== 'string' || !(/^[0-9]{0,2}[a-z]{2,3}[0-9]{0,3}$/.test(netId))) {
        if(!netId)
            result[0] = "No NetID Provided";
        else
            result[0] = "Improper NetID Format (Ex. 12xyz3)";            
    }
    // check student number
    if (!stdNum || typeof(stdNum) !== 'string' || stdNum.length != 8) {
        if(!stdNum)
            result[1] = "No Student # Provided" ;
        else
            result[1] = "Improper Student # Format (Ex. 10050150)";
    }
    // check first name    
    if (!fName || typeof(fName) !== 'string' || fName.length < 1 || fName.length > 100) {
        if(!fName)
            result[2] = "No First Name Provided";
        else
            result[2] = "First Name Too Long";
    }
    // check last Name
    if (!lName || typeof(lName) !== 'string' || lName.length < 1 || lName.length > 100) {
        if(!lName)
            result[3] = "No Last Name Provided" ;
        else
            result[3] = "Last Name Too Long";
    }
    return result;        
}

module.exports = ClassPage;