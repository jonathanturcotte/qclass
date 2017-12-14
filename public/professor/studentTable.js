var Table = require('../components/table');

var StudentTable = function (classID, $appendTarget) {

};
StudentTable.prototype = Object.create(Table.prototype);
StudentTable.prototype.constructor = StudentTable;

module.exports = StudentTable;