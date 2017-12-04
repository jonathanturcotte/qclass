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

        // Ensure that these are valid student parameters
        if (!this.netID || typeof(this.netID) !== 'string' || !(/^[0-9]{0,2}[a-z]{2,3}[0-9]{0,3}$/.test(this.netID)))
            throw new Error();
        if (!this.stdNum || typeof(this.stdNum) !== 'string' || this.stdNum.length != 8)
            throw new Error();
        if (!this.firstName || typeof(this.firstName) !== 'string' || this.firstName.length < 1 || this.firstName.length > 100)
            throw new Error();
        if (!this.lastName || typeof(this.lastName) !== 'string' || this.lastName.length < 1 || this.lastName.length > 100)
            throw new Error();
    }
};