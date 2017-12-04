var XLSX         = require('xlsx'),
    ModalWindow  = require('../modalwindow');

var Exporter = function () {};

Exporter.prototype.createExportModal = function () {
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
        
        // TODO: Finish adding the include checkboxes for exporting only the
        // overall information, the individual information, or both
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
};

///////////////////////
// Private Functions //
///////////////////////

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
            exportSuccess.call(this, data, status, xhr, $fileType, $fileName, modal);
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
        netID,
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
        netID = email[0];
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
        processedStds[i] = {netID: netID, stdNum: stdNum, firstName: firstName, lastName: lastName}; 
    }
    result.sheet = processedStds;
    return result;
}

module.exports = Exporter;