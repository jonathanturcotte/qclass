var ProfessorResponse = function (netID, firstName, lastName) {
    this.netID = netID;
    this.firstName = firstName;
    this.lastName = lastName;
    this.isProf = true;
};

module.exports = ProfessorResponse;