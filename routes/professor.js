var express            = require('express'),
    router             = express.Router(),
    routeHelper        = require('./helper'),
    apiHelper          = require('../api/helper'),
    db                 = require('../api/db'),
    regex              = require('../api/regex'),
    attendanceSessions = require('../api/data/attendanceSessions'),
    EnrollStudent      = require('../models/EnrollStudent');

// Authenticate every request to the professor API against the DB
// If successful, req.user will gain the firstName and lastName of the prof 
router.use(function(req, res, next) {
    db.profExists(req.user.netID, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error checking netID');
        if (results.length === 0) return routeHelper.sendError(res, null, 'Supplied professor netID is not registered', 403);
        
        req.user.firstName = results[0].fName;
        req.user.lastName  = results[0].lName;
        
        // TODO: Redirect to the SSO login page

        next();
    });
});

router.param('classID', function(req, res, next, classID) {
    if (!classID)
        return routeHelper.sendError(res, null, 'Empty classID', 400);

    if (!regex.class.id.test(classID))
        return routeHelper.sendError(res, null, 'Invalid classID', 400);

    db.ownsClass(classID, req.user.netID, function(err, result) {
        if (err) return routeHelper.sendError(res, err, 'Error processing request');
        if (!result) return routeHelper.sendError(res, null, 'User does not own the requested class', 403);
        next();
    });
});

// GET all classes associated with a specific professor 
router.get('/classes', function(req, res, next) {
    db.getTeachesClasses(req.user.netID, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error getting classes');
        res.json(results);
    }); 
});

// Add a new class
router.post('/class/add', function(req, res, next) { 
    var code = req.body.code,
        name = req.body.name;

    if (!regex.class.code.test(code)) 
        return routeHelper.sendError(res, null, 'Invalid code format', 400);

    if (name.length < 3 || name.length > 100 || !regex.class.name.test(name)) 
        return routeHelper.sendError(res, null, 'Invalid class name', 400);

    db.getTeachesClasses(req.user.netID, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err);
        for (var i = 0; i < results.length; i++) {
            if (results[i].cCode === code)
                return routeHelper.sendError(res, null, `User already teaches a course with the course code ${code}`, 400);
        }
        db.addClass(req.user.netID, code, name, function(err, id, results, fields) {
            if (err) return routeHelper.sendError(res, err, 'Error adding class');
            res.status(201).json({ classID: id });
        });
    });
});

// Edit an existing class name
router.put('/class/editName/:classID', function(req, res, next) {
    var name = req.body.name;

    if (name.length < 3 || name.length > 100 || !regex.class.name.test(name))
        return routeHelper.sendError(res, null, 'Invalid class name', 400);

    db.editClassName(req.user.netID, req.params.classID, name, function(err) {
        if (err)
            return routeHelper.sendError(res, err, 'Error editing class name');
        res.status(204).send('');
    });
});

// Edit an existing class code
router.put('/class/editCode/:classID', function(req, res, next) {
    var code = req.body.code;

    if (!code)
        return routeHelper.sendError(res, null, 'No code provided', 400);

    if (!regex.class.code.test(code))
        return routeHelper.sendError(res, null, 'Invalid code format', 400);

    db.editClassCode(req.user.netID, req.params.classID, code, function(err) {
        if (err)
            return routeHelper.sendError(res, err, 'Error editing class code');
        res.status(204).send('');
    });
});

// For enrolling an entire classlist
router.post('/class/enrollClass/:classID', function(req, res, next) {
    enroll(req.body, req.params.classID, res); // Reminder: note this function can throw error without stopping execution
});

// For enrolling a single student
router.post('/class/enrollStudent/:classID', function(req, res, next) {
    var std = [{ 
        netID: req.body.netID,
        stdNum: req.body.stdNum, 
        firstName: req.body.firstName, 
        lastName: req.body.lastName
    }];
    enroll(std, req.params.classID, res);
});

// For deleting a student from a class
router.delete('/class/:classID/remove/:netID', function (req, res, next) {
    if (!req.params.netID)
        return routeHelper.sendError(res, null, 'Empty netID', 400);
    db.removeFromClass(req.params.netID, req.params.classID, function (err, results, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error removing student');

        // Check if deletion actually occurred
        if (results.affectedRows < 1)
            return routeHelper.sendError(res, null, 'No removal occured - student not enrolled', 404);
            
        res.status(204).send('');
    });
});

// Start an attendance session for a class, return the code to the professor
router.post('/class/start/:classID', function(req, res, next) {
    var duration = req.body.duration;

    if (!isNaN(duration)) {
        duration = Number(duration);
        attendanceSessions.start({ 
            classID:  req.params.classID,
            duration: duration,
            callback: function(err, code, endTime) {
                if (err) return routeHelper.sendError(res, err, 'Error starting attendance session');
                res.json({ code: code, endTime: endTime });        
            }
        });
    }
});

router.post('/class/stop/:classID', function(req, res, next) {
    var result = attendanceSessions.stopClass(req.params.classID);
    if (!result.success) return routeHelper.sendError(res, null, result.err.message, result.err.status);
    res.status(204).send();
});

/** 
 * GET session data for a class
 * Used to fill session and student tables on a classpage
 */
router.get('/:classID/session-data', function(req, res, next) {
    db.getSessionAttInfo(req.params.classID, function(err, sessionEntries, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error retrieving attendance sessions for ' + req.user.netID);
        
        db.getEnrolledStudents(req.params.classID, function(err, enrolled, fields) {
            if (err) return routeHelper.sendError(res, err);

            for (var i = 0; i < enrolled.length; i++)
                enrolled[i] = enrolled[i].sNetID;

            res.json({ 
                entries: sessionEntries,
                enrolledIDs: enrolled 
            });
        });
    });
});

// TODO: Figure out how to handle errors in the file download; possible solution to return URL and store file on server, UI then fetches it
// TODO: Cleanup
// Aggregate Info: student | attendance (%)
// Session Info: Total Number of students + Percent Attendance
//               List of students in attendance: name, netID, std#
router.get('/:classID/exportAttendance', function(req, res, next) {
    var classID  = req.params.classID;

    db.aggregateInfo(classID, function(err, attInfo, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error retrieving attendance information for ' + classID);
        if (attInfo.length === 0)
            return routeHelper.sendError(res, null, 'No Attendance Information for Course');
        
        db.getNumSession(classID, function(err, numSessions, fields) {
            if (err) return routeHelper.sendError(res, err, 'Error retrieving number of sessions');
            if (numSessions.length === 0) 
                return routeHelper.sendError(res, null, 'No Attendance sessions for couse');
            
            // Calculate and append the percentage
            for(var i = 0; i < attInfo.length; i++)
                attInfo[i].attPercent = (attInfo[i].attCount / numSessions.length)*100;
            
            db.getSessionAttInfo(classID, function(err, sessInfo, fields) {
                if (err) return routeHelper.sendError(res, err, 'Error retrieving session information');
                if (sessInfo.length === 0) 
                    return routeHelper.sendError(res, null, 'No Session Information for course');
                
                // General Info Formatting
                result = [];
                overallData = [];
                sessionData = [];
                for(var i = 0; i < attInfo.length;i++) {
                    overallData[i] = {"NetID"          : attInfo[i].sNetID,
                                      "Student #"      : attInfo[i].stdNum,
                                      "First Name"     : attInfo[i].fName,
                                      "Last Name"      : attInfo[i].lName,
                                      "Attendance (#)" : attInfo[i].attCount,
                                      "Attendance (%)" : attInfo[i].attPercent};
                }
                
                result[0] = overallData;

                // Session Info Formatting
                var j    = 0,
                    k    = 0,
                    date = 0;
                while (j < sessInfo.length) {
                    if (date === sessInfo[j].attTime) {
                        sessionData[k++] = { 
                            "NetID": sessInfo[j].sNetID, 
                            "Student #": sessInfo[j].stdNum, 
                            "First Name": sessInfo[j].fName, 
                            "Last Name": sessInfo[j].lName,
                            "Attended": sessInfo[j].attended === 0 ? 'No' : 'Yes'
                        };
                        j++;
                    } else {
                        date = sessInfo[j].attTime;
                        sessionData[k++] = {};
                        sessionData[k++] = { "NetID": (new Date(date)).toDateString() };
                    }
                }
                result[1] = sessionData;
                
                res.json(result);    
            });
        });
    });
});

// Runs the general enroll function that adds (if needed) and enrolls each student
// reqStudents can contain a single student or an entire classList
function enroll(reqStudents, classID, res) {
    var students    = [],
        student;

    if (!reqStudents || !Array.isArray(reqStudents) || reqStudents.length < 1)
        return routeHelper.sendError(res, null, 'Student list was either not provided by user or invalid', 400);

    // Validate each entry in the students array
    for (var i = 0; i < reqStudents.length; i++) {
        try {
            student = new EnrollStudent(reqStudents[i]);
        } catch (e) {
            return routeHelper.sendError(res, e, `Invalid student in list at position ${i}`, 400);
        }
        students.push(student);
    }

    db.enroll(classID, students, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err, `Error enrolling students. ${err.errorStudents ? `Students that caused errors: ${apiHelper.printArray(err.errorStudents)}` : ''}`);
        console.log(`Inserted ${results.affectedRows} students`);
        res.status(201).json({ 
            affectedRows: results.affectedRows 
        });
    });
}

module.exports = router;