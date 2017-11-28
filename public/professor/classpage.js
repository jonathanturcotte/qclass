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
*/
var ClassPage = function() {
    this.$element = $('.classpage');
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

    // Create the appropriate session table
    this.sessionTable = new SessionTable(this.course.cID, this.$element);
    this.sessionTable.startSpinner();
};

///////////////////////
// Private Functions //
///////////////////////

/**
 * Builds the classpage, adds it to the DOM
 */
function build () {
    this.$element
        .append($('<h2>', { class: 'class-page-title-code', text: this.course.cCode }))
        .append($('<h3>', { class: 'class-page-title-name', text: this.course.cName }))
        .append($('<div>', { class: 'block',  style: 'margin-bottom: 50px'})
            .append($('<button>', { class: 'btn btn-danger btn-square btn-xl', text: 'Import Classlist', style: 'margin-right: 15px' })
                .click(createImportModal.bind(this)))
            .append($('<button>', { class: 'btn btn-danger btn-square btn-xl', text: 'Add Student', style: 'margin-right: 15px' })
                .click(createAddStudentModal.bind(this)))
            .append($('<button>', { class: 'btn btn-danger btn-square btn-xl', text: 'Export Attendance' })
                .click(createExportModal.bind(this))))
        .append($('<a>', { class: 'class-page-start-link', href: '#' }) // Start button
            .append($('<button>', { class: 'btn btn-danger btn-circle btn-xl', text: 'Start' }))
            .click(startAttendance.bind(this, this.course.cID)));
}

// Creates the attendance modal window, makes the call
// to the server to start a session.
function startAttendance(courseID) {
    var modal = new ModalWindow({ id: 'startModal', title: 'Start Attendance Session' });

    modal.show();
    modal.$body.spin()
        .addClass('spin-min-height');

    $.post({
        url: '/professor/class/start/' + courseID,
        data: { duration: 30000 },
        dataType: 'json'
    }).done(function(data, status, xhr) {
        showAttendanceInfo.call(this, data, modal);
    }.bind(this))
    .fail(function(xhr, status, errorThrown) {
        modal.error('Error', 'Error starting attendance session');
    }).always(function(a, status, b) {
        modal.$body.spin(false);
    });
}

// Updates a modal window with an attendance sessions' info
function showAttendanceInfo(data, modal) {
    var $timerInfo = $('<div>', { class: 'start-modal-running-info' })
            .append($('<h3>', { class: 'start-modal-code', text: "Code: " + data.code.toUpperCase() })),
        $timerText = $('<h3>', { class: 'start-modal-timer' }),
        $timerContainer = $('<div>', { class: 'start-modal-timer-container' })
            .append($timerText);
    
    modal.success('Running Attendance Session');
    modal.appendToBody([
        $('<p>', { class: 'start-modal-top-info' }),
        $('<div>', { class: 'flex flex-start' })
            .append($timerInfo)
            .append($timerContainer)
    ], true);
    modal.$closeButton.hide();
    $finishButton = $('<button>', { class: 'btn btn-danger', text: 'Finish' })
        .click(function() {
            $finishButton.addClass('disabled');
            $timerText.countdown('stop');
            modal.$body.spin();
            $.post({
                url: 'professor/class/stop/' + this.course.cID
            }).done(function(data, status, xhr) {
                $timerContainer.empty().append($('<div>')
                    .html('Ended session successfully'));
            }).fail(function(xhr, status, errorThrown) {
                var text = 'Error ending session';
                if (xhr.responseText) text += ': ' + xhr.responseText;
                else text += '!';
                $timerContainer.empty().append($('<div>', { class: 'text-danger' })
                    .html(text));
            }).always(function(a, status, b) {
                modal.$body.spin(false);
                $finishButton.hide();
                modal.$closeButton.show();
            });
        }.bind(this));
    modal.$footer.append($finishButton);
    
    // Countdown Timer
    $timerText.countdown(data.endTime, function(e) {
        $(this).text(e.strftime('%-H:%M:%S'));
    }).on('finish.countdown', function(e) {
        modal.$title.text('Complete');
        $finishButton.hide();
        modal.$closeButton.show();
        $timerInfo
            .text('Session complete!')
            .addClass('.start-modal-top-info-finished');
    }).countdown('start');
}

function createImportModal () {
    var modal = new ModalWindow({ id: 'importModal', title: 'Import Classlist'}),
        $file = $('<input>', {type: 'file', id: 'fileName', name: 'fileName', class: 'form-control', accept: '.xlsx' });
    this.$importButton = $('<button>', { type: 'submit', class: 'btn btn-primary', text: 'Import', id: 'importButton' });
    
    modal.$body
        .append($('<p>', { text: "Please submit your .xlsx classlist file:" }))
        .append($file);
    modal.$footer
        .prepend(this.$importButton);
    this.$importButton
       .click(importXLSX.bind(this, modal, $file));
    modal.show();
}

function importXLSX(modal, $file) {
    var file   = $file.get(0).files[0],
        reader = new FileReader(),
        cID    = this.course.cID;
    
    this.$importButton.remove();
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

            try {
                workbook = XLSX.read(sheetData, { type: 'array' });
            } catch(error) {
                modal.error('Error', 'Incorrect file type submitted');
                return;
            }

            var sheet          = workbook.Sheets[workbook.SheetNames[0]],
                jsonSheet      = XLSX.utils.sheet_to_json(sheet, { header: ["stdNum", "name", "email", "dept", "year"] }),
                result         = {},
                formattedSheet = [];
           
            result = checkFormat(jsonSheet);
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
}

function createAddStudentModal () {
    var modal   = new ModalWindow({ id: 'addStdModal', title: 'Add Student'}),
        $netId  = $('<input>', {type: 'text', name: 'netId', id: 'netId', class: 'form-control' }),
        $stdNum = $('<input>', {type: 'text', name: 'stdNum', id: 'stdNum', class: 'form-control' }),
        $fName  = $('<input>', {type: 'text', name: 'fName', id: 'fName', class: 'form-control'  }),
        $lName  = $('<input>', {type: 'text', name: 'lName', id: 'lName', class: 'form-control'  }),
        $submitButton = $('<button>', { type: 'submit', class: 'btn btn-primary',  text: 'Submit', id: 'submitAddClasses' }),
        //spans
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
        
    modal.$footer
        .prepend($submitButton);

    $submitButton
        .click(function() { // Not a separate function due to how many objects it requires in this scope
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

function createExportModal () {
    var modal         = new ModalWindow({ id: 'exportModal', title: 'Export Attendance Information'}),
        $fileName     = $('<input>', {type: 'text', id: 'fileName', name: 'fileName', style: 'margin-bottom: 20px'}),
        $fileType     = $('<select>', {class: 'btn btn-secondary dropdown-toggle dropdown-toggle-split', id: 'fileType', name: 'fileType'} ),
        $overallCheck = $('<input>', {type: 'checkbox', id: 'overall', name: 'overall'}),
        $indivCheck   = $('<input>', {type: 'checkbox', id: 'session', name: 'session'}),
        $checkDiv     = $('<div>', {style: 'display: none'});
    this.$exportButton = $('<button>', { type: 'submit', class: 'btn btn-primary',  text: 'Export', id: 'exportButton' });
    modal.$body
        .append($('<p>', {text: 'Specify output file name and type:'}))
        .append($fileName)
        .append($fileType
            .append($('<option>', { text: 'csv', value: 'csv'}))
            .append($('<option>', { text: 'xslx', value: 'xlsx'})));
        /*
        .append($checkDiv
            .append($('<h5>', { text: 'Include:' }))
            .append($('<div>', {class: 'block'})
                .append($overallCheck)
                .append($('<label>', {text: 'Overall Attendance Information', style: 'margin-left: 5px;'})))
            .append($('<div>', {class: 'block'})
                .append($indivCheck)
                .append($('<label>', {text: 'Individual Session Information', style: 'margin-left: 6px;'}))));
        */
        
    modal.$footer
        .prepend(this.$exportButton);
    
    /*
    $fileType.change(function () {
        if($fileType.val() === 'xlsx') 
            $checkDiv.show();
        else
            $checkDiv.hide();
    });
    */

    this.$exportButton
        .click(exportClick.bind(this, modal, $fileName, $fileType));
    modal.show();
}

function exportClick(modal, $fileName, $fileType) {
    var cID = this.course.cID;
    this.$exportButton.remove();
    modal.$body.empty();
    modal.$body
        .spin()
        .addClass('spin-min-height');
    $.get({
        url: '/professor/' + cID + '/exportAttendance',
        data: {fileName: $fileName.val(), fileType: $fileType.val()}
     }).done(function (data, status, xhr) {
         exportSuccess.call(this, data, status, xhr, $fileType, $fileName, modal)
     }).fail(function(xhr, status, errorThrown) {
        modal.error("Error", xhr.responseText);
     }).always(function(a, status, b) {
        modal.$body.spin(false);
     });   
}

function exportSuccess(data, status, xhr, $fileType, $fileName, modal) {
    if ($fileType.val() === 'csv') { 
        window.location.href = this.url;  
        modal.success("Success", "File Successfully Downloaded");
    } else {
        // Need to write to workbook, only have sheet
        var workbook = createSheets(data);
        /* bookType can be any supported output type */
        var wopts = { bookType: 'xlsx', bookSST: false, type: 'binary' };
        var wbout = XLSX.write(workbook,wopts);
        /* the saveAs call downloads a file on the local machine */
        var blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
        var xlName;
        if(!$fileName.val())
            xlName = "attendance.xlsx";
        else 
            xlName = $fileName.val() + ".xlsx";
        saveData(blob, xlName);
        modal.success("Success", "File Successfully Downloaded");
    }
 }

function saveData (data, fileName) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    url = window.URL.createObjectURL(data);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

function createSheets(json) {
    var sheet1 = [],
        sheet2 = [],
        wb     = { SheetNames:[], Sheets:{} },
        i      = 1,
        j      = 0;
    while (json[i].hasOwnProperty('sNetID')) {
        sheet1[j++] = json[i];
        i++;
    }
    j = 0;
    for(i = i + 2; i < json.length; i++)
        sheet2[j++] = json[i];
    
    wb.SheetNames.push('Overall Att');
    wb.Sheets['Overall Att'] = XLSX.utils.json_to_sheet(sheet1, { header: ["sNetID", "attCount", "attPercent"] });
    
    wb.SheetNames.push('Session Info');
    wb.Sheets['Session Info'] = XLSX.utils.json_to_sheet(sheet2, { header: ["NetID", "Student #", "First Name", "Last Name"], dateNF: 'dd"."mm"."yyyy'});

    return wb;
}

function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
}

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
            result[1] = "No Student # Provided";
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