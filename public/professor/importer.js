var XLSX         = require('xlsx'),
    IO           = require('./io'),
    ModalWindow  = require('../modalwindow');

var Importer = function () {};

Importer.prototype.createImportModal = function (course) {
    var modal         = new ModalWindow({ id: 'importModal', title: 'Import Classlist'}),
        $file         = $('<input>', {type: 'file', id: 'fileName', name: 'fileName', class: 'form-control', accept: '.xlsx' });

    modal.$importButton = $('<button>', { type: 'submit', class: 'btn btn-primary', text: 'Import', id: 'importButton' });
    modal.$body
        .append($('<p>', { text: "Please submit your .xlsx classlist file:" }))
        .append($file);
    modal.$footer
        .prepend(modal.$importButton);
    modal.$importButton
       .click(importXLSX.bind(this, course, modal, $file));
    modal.show();
};

Importer.prototype.createAddStudentModal = function (course) {
    // TODO: Needs to be broken up

    var modal   = new ModalWindow({ id: 'addStdModal', title: 'Add Student'}),
        $netID  = $('<input>', {type: 'text', name: 'netID', id: 'netID', class: 'form-control' }),
        $stdNum = $('<input>', {type: 'text', name: 'stdNum', id: 'stdNum', class: 'form-control' }),
        $fName  = $('<input>', {type: 'text', name: 'fName', id: 'fName', class: 'form-control'  }),
        $lName  = $('<input>', {type: 'text', name: 'lName', id: 'lName', class: 'form-control'  }),
        $submitButton = $('<button>', { type: 'submit', class: 'btn btn-primary',  text: 'Submit', id: 'submitAddClasses' }),
        //spans
        $netIdSpan  = $('<span>', { class: "text-danger", style: 'margin-left: 120px; display: none'}),
        $stdNumSpan = $('<span>', { class: "text-danger", style: 'margin-left: 120px; display: none'}),
        $fNameSpan  = $('<span>', { class: "text-danger", style: 'margin-left: 120px; display: none'}),
        $lNameSpan  = $('<span>', { class: "text-danger", style: 'margin-left: 120px; display: none'});
    modal.$body
        .append($netIdSpan)
        .append($('<div>', { class: 'form-group has-danger form-inline', style: 'margin-bottom: 5px' })
            .append($('<span>', { text: "NetID:", style: 'width: 100px' }))
            .append($('<div>', { class: 'col-sm-5' })
                .append($netID)))
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
            var netID  = $netID.val(),
                stdNum = $stdNum.val(),
                fName  = $fName.val(),
                lName  = $lName.val(),
                errors = findErrors(netID, stdNum, fName, lName),
                flag = 0;
            
            for(var i = 0; i < errors.length; i++) {
                if(!errors[i]) {
                    switch(i){                        
                        case 0: 
                            $netIdSpan.hide();
                            $netID.removeClass('is-invalid');
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
                            $netID.addClass('is-invalid');
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
                url: '/professor/class/enrollStudent/' + course.cID,
                data: { netID: netID, stdNum: stdNum, firstName: fName, lastName: lName },
                dataType: 'json'
            }).done(function(data, status, xhr) {
                modal.success('Success', 'Student successfully added!'); 
                modal.$window.on('hidden.bs.modal', function (e) {
                    window.app.classPage.refreshTables();
                });     
            }).fail(function(xhr, status, errorThrown) {
                var msg, hasStatus, title = 'Failed';

                if (xhr.status === 409)
                    title += ' - Conflict';

                hasStatus = xhr.responseJSON && xhr.responseJSON.customStatus;
                if (hasStatus && xhr.responseJSON.customStatus === 1) 
                    msg = 'Student is already enrolled';
                else if (hasStatus && xhr.responseJSON.customStatus === 2)
                    msg = 'The provided NetID is already registered to a different student';
                else 
                    msg = 'Something went wrong - student was not added';

                modal.error(title, msg);
            }).always(function(a, status, b) {
                modal.$body.spin(false);
            });
        });

    modal.show();
};

///////////////////////
// Private Functions //
///////////////////////

function importXLSX(course, modal, $file) {
    var file   = $file.get(0).files[0],
        reader = new FileReader(),
        cID    = course.cID;

    modal.$importButton.remove();
    modal.$body.empty();
    modal.$body
        .spin()
        .addClass('spin-min-height');
  
    if (!file){
        modal.error('Error', 'No file submitted');
        return;
    } else if (!IO.checkExtensionXLSX(file)) {
        modal.error('Error', 'Incorrect file type submitted');
        return;
    } else {            
        reader.onload = function(e) {
            var sheetData = new Uint8Array(e.target.result),
                workbook  = null;

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
           
            result = IO.checkClasslistFormat(jsonSheet);
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

function findErrors (netID, stdNum, fName, lName) {
    var result = [false, false, false, false];
    // check netID
    if (!netID || typeof(netID) !== 'string' || !(/^[0-9]{0,2}[a-z]{2,3}[0-9]{0,3}$/.test(netID))) {
        if(!netID)
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

module.exports = Importer;