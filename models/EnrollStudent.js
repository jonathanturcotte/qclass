/**
 * Valid student request entry for enrollment purposes
 */
module.exports = class EnrollStudent {
    constructor(student) {
        if (!student) throw new Error();

        this.netID     = student.netID;
        this.stdNum    = student.stdNum;
        this.firstName = student.firstName;
        this.lastName  = student.lastName;

        // TODO - Be more specific in the errors being thrown
        if (!this.netID || typeof(this.netID) !== 'string' || this.netID.length < 3 || this.netID.length > 20)
            throw new Error();
        if (!this.stdNum || typeof(this.stdNum) !== 'string' || this.stdNum.length < 3 || this.stdNum.length > 20)
            throw new Error();
        if (!this.firstName || typeof(this.firstName) !== 'string' || this.firstName.length < 1 || this.firstName.length > 100)
            throw new Error();
        if (!this.lastName || typeof(this.lastName) !== 'string' || this.lastName.length < 1 || this.lastName.length > 100)
            throw new Error();
    }
};