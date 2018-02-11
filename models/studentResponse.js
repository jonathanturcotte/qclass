var StudentResponse = function (netID, stdNum, firstName, lastName) {
    this.netID = netID;
    this.stdNum = stdNum;
    this.firstName = firstName;
    this.lastName = lastName;
    this.isProf = false;
};

module.exports = StudentResponse;