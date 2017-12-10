var express            = require('express'),
    router             = express.Router(),
    routeHelper        = require('./helper'),
    apiHelper          = require('../api/helper'),
    db                 = require('../api/db'),
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

router.param('classId', function(req, res, next, classId) {
    if (!classId)
        return routeHelper.sendError(res, null, 'Empty classId', 400);

    if (!routeHelper.regex.class.id.test(classId))
        return routeHelper.sendError(res, null, 'Invalid classId', 400);

    db.ownsClass(classId, req.user.netID, function(err, result) {
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

    if (!routeHelper.regex.class.code.test(code)) 
        return routeHelper.sendError(res, null, 'Invalid code format', 400);

    if (name.length < 3 || name.length > 100 || !routeHelper.regex.class.name.test(name)) 
        return routeHelper.sendError(res, null, 'Invalid class name', 400);

    db.getTeachesClasses(req.user.netID, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err);
        for (var i = 0; i < results.length; i++) {
            if (results[i].cCode === code)
                return routeHelper.sendError(res, null, `User already teaches a course with the course code ${code}`, 400);
        }
        db.addClass(req.user.netID, code, name, function(err, id, results, fields) {
            if (err) return routeHelper.sendError(res, err, 'Error adding class');
        });
    });
});

// Edit an existing class name
router.post('/class/editName', function(req, res, next) {
    var name = req.body.name,
        cID  = req.body.cID;

    if (name.length < 3 || name.length > 100 || !routeHelper.regex.class.name.test(name))
        return routeHelper.sendError(res, null, 'Invalid class name', 400);

    db.getTeachesClasses(req.user.netID, function(err, results, fields) {
        var found = false;

        if (err) return routeHelper.sendError(res, err);
        for (var i = 0; i < results.length; i++) {
            if (results[i].cID === cID)
                found = results[i];
        }

        if (!found) return routeHelper.sendError(res, null, `Course not found ${cID}`, 400);
        db.editClass(req.user.netID, cID, found.cCode, name, function(err) {
            if (err) return routeHelper.sendError(res, err, 'Error editing class name');
            else res.send('');
        });
    });
});

// Edit an existing class code
router.post('/class/editCode', function(req, res, next) {
    var code = req.body.code,
        cID  = req.body.cID;

    if (!routeHelper.regex.class.code.test(code))
        return routeHelper.sendError(res, null, 'Invalid code format', 400);

    db.getTeachesClasses(req.user.netID, function(err, results, fields) {
        var found = false;

        if (err) return routeHelper.sendError(res, err);
        for (var i = 0; i < results.length; i++) {
            if (results[i].cID === cID)
                found = results[i];
        }

        if (!found) return routeHelper.sendError(res, null, `Course not found ${cID}`, 400);
        db.editClass(req.user.netID, cID, code, found.cName, function(err) {
            if (err) return routeHelper.sendError(res, err, 'Error editing class code');
            else res.send('');
        });
    });
});

// For enrolling an entire classlist
router.post('/class/enrollClass/:classId', function(req, res, next) {
    enroll(req.body, req.params.classId, res); // Reminder: note this function can throw error without stopping execution
});

// For enrolling a single student
router.post('/class/enrollStudent/:classId', function(req, res, next) {
    var std = [{ 
        netID: req.body.netID,
        stdNum: req.body.stdNum, 
        firstName: req.body.firstName, 
        lastName: req.body.lastName
    }];
    enroll(std, req.params.classId, res);
});

// Start an attendance session for a class, return the code to the professor
router.post('/class/start/:classId', function(req, res, next) {
    var duration = req.body.duration;

    if (!isNaN(duration)) {
        duration = Number(duration);
        attendanceSessions.start({ 
            classId:  req.params.classId,
            duration: duration,
            callback: function(err, code, endTime) {
                if (err) return routeHelper.sendError(res, err, 'Error starting attendance session');
                res.json({ code: code, endTime: endTime });        
            }
        });
    }
});

router.post('/class/stop/:classId', function(req, res, next) {
    var result = attendanceSessions.stopClass(req.params.classId);
    if (!result.success) return routeHelper.sendError(res, null, result.err.message, result.err.status);
    res.status(204).send();
});

/** GET all attendance sessions for a certain class
 * used to fill session table on professor page
 * contains number of enrolled studnets for attendance calculations
 * Each entry in sessions has the session time and a list of students 
 */
router.get('/:classId/attendanceSessions', function(req, res, next) {
    db.getSessionAttInfo(req.params.classId, function(err, sessions, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error retrieving attendance sessions for ' + req.user.netID);
        if (sessions.length === 0) res.json({ numEnrolled: 0, sessions: [] });
        else {
            db.getEnrolledStudents(req.params.classId, function(err, enrolled, fields) {
                if (err) return routeHelper.sendError(res, err);
                var attSessions = organizeAttendanceSession(sessions);
                res.json({ numEnrolled: enrolled.length, sessions: attSessions });
            });
        }
    });
});

// TODO: Figure out how to handle errors in the file download; possible solution to return URL and store file on server, UI then fetches it
// TODO: Cleanup
// Aggregate Info: student | attendance (%)
// Session Info: Total Number of students + Percent Attendance
//               List of students in attendance: name, netID, std#
router.get('/:classId/exportAttendance', function(req, res, next) {
    var classId  = req.params.classId,
        fileName = req.query.fileName,
        fileType = req.query.fileType;

    db.aggregateInfo(classId, function(err, attInfo, fields) {
        if (err) return routeHelper.sendError(res, err, 'Error retrieving attendance information for ' + classId);
        if (attInfo.length === 0)
            return routeHelper.sendError(res, null, 'No Attendance Information for Course');
        
        db.getNumSession(classId, function(err, numSessions, fields) {
            if (err) return routeHelper.sendError(res, err, 'Error retrieving number of sessions');
            if (numSessions.length === 0) 
                return routeHelper.sendError(res, null, 'No Attendance sessions for couse');
            
            // Calculate and append the percentage
            for(var i = 0; i < attInfo.length; i++)
                attInfo[i].attPercent = (attInfo[i].attCount / numSessions.length)*100;
            
            db.getSessionAttInfo(classId, function(err, sessInfo, fields) {
                if (err) return routeHelper.sendError(res, err, 'Error retrieving session information');
                if (sessInfo.length === 0) 
                    return routeHelper.sendError(res, null, 'No Session Information for course');
                
                // General Info Formatting
                result = [];
                result[0] = { col1: "NetID", col2: 'Student #', col3: 'First Name', col4: 'Last Name', col5: 'Attended (Total)', col6: 'Attended (%)' };
                for(var i = 0; i < attInfo.length;i++)
                    result[i + 1] = attInfo[i];
                var index = attInfo.length + 1;
                result[index++] = {};

                // Session Info Formatting
                var j    = 0,
                    date = 0;
                result[index++] = { col1: 'NetID', col2: 'Student #', col3: 'First Name', col4: 'Last Name' };                                           
                while (j < sessInfo.length) {
                    if (date === sessInfo[j].attTime) {
                        result[index++] = { "NetID": sessInfo[j].sNetID, "Student #": sessInfo[j].stdNum, "First Name": sessInfo[j].fName, "Last Name": sessInfo[j].lName };
                        j++;
                    } else {
                        date = sessInfo[j].attTime;
                        result[index++] = {};
                        result[index++] = { "NetID": (new Date(date)).toDateString() };
                    }
                }
                
                if (fileType === 'csv') {
                    if (!fileName)
                        fileName = 'attendance';                 
                    res.setHeader('Content-disposition', 'attachment; filename=\"' + fileName + '.csv\"');
                    res.csv(result);
                } else {
                    res.json(result);
                }               
            });
        });
    });
});

// Pass in ordered session results from db
// Returns json with each entry containing session date + list of students in attendance
function organizeAttendanceSession(sessInfo) {
    var j = 0,
        i = 0,
        k = 0,
        date = sessInfo[0].attTime,
        session = [],
        toReturn = [];
    while (j < sessInfo.length) {
        if (date === sessInfo[j].attTime) {
            if (sessInfo[j].sNetID)
                session[i++] = { NetID: sessInfo[j].sNetID, stdNum: sessInfo[j].stdNum, fName: sessInfo[j].fName, lName: sessInfo[j].lName };
            else 
                // set session to empty if session entry has no student - this indicates a session with no attendances
                session = [];
            j++;
        } else {
            toReturn[k++] = { sessDate: date, studentList: session };
            session = [];
            date = sessInfo[j].attTime;
            i = 0;
        }
    }
    //Add last session
    toReturn[k] = { sessDate: date, studentList: session };
    return toReturn;
}

// Runs the general enroll function that adds (if needed) and enrolls each student
// reqStudents can contain a single student or an entire classList
function enroll(reqStudents, classId, res) {
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

    db.enroll(classId, students, function(err, results, fields) {
        if (err) return routeHelper.sendError(res, err, `Error enrolling students. ${err.errorStudents ? `Students that caused errors: ${apiHelper.printArray(err.errorStudents)}` : ''}`);
        console.log(`Inserted ${results.affectedRows} students`);
        res.status(201).json({ 
            affectedRows: results.affectedRows 
        });
    });
}

module.exports = router;