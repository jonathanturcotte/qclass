/**
 * Duration object for the duration select dropdown
 * Contains the dropdown text and duration length in ms for one entry
 * @param {string} text 
 * @param {number} miliseconds 
 */
module.exports = function (text, milliseconds) {
    this.text = text;
    this.milliseconds = milliseconds;
};