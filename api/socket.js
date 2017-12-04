/*
* Experimental socket support, currently not being used.
* Could be implemented for Q&A stretch goal. 
**/

var io            = require('socket.io')(),
    validClassIds = [];

exports.initialize = function() {
    io.on('connection', function(socket) {
        //TODO: Authentication
        console.log('A user connected');
        socket.on('test', function(message) {
            console.log('Received test message');
            socket.emit('test', `Hi, it's the server! You said: \'${message}\'`);
        });

        socket.on('class', function(message) {
            // TODO: Fetch classId from payload somehow and then perform logic against validClassIds  
        });
    });
    return io;
};

exports.startClass = function(classId) {
    validClassIds.push(classId);
};

exports.stopClass = function(classId) {
    validClassIds.pop(classId);
};