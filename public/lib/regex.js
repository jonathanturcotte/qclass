/**
 * Common regular expressions
 */
module.exports = {
    class: {
        id:   /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/,
        code: /^[A-Z]{4} [0-9]{3}[A-Z]?$/,
        name: /^[a-zA-Z0-9 ]{0,100}$/ // Note that you should still test for string length {3, 100}
    },
    user: {
        netID: /^[0-9]{0,2}[a-z]{2,3}[0-9]{0,3}$/,
    }
};