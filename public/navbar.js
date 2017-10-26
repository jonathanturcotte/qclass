// Items to be added to the NavBar. Items are added in order
// of their index. Label is the the text that will be displayed
// profOnly indicates if only professors should see this
NAVBAR_ITEMS = [
    { label: "Welcome ", index: 0, profOnly: true  },
    { label: "Sign-out", index: 1, profOnly: false }
];

var NavBar = function () {
    this._$element = $('#navbar');
};

/**
 * Initialize the navbar, and enable or disable professor buttons
 */
NavBar.prototype.init = function (enableProfItems) {

};

/**
 * Build the simple navbar
 */
NavBar.prototype.buildNavbar = function () {
    
};

/**
 * Add professor specific items to the navbar
 */
NavBar.prototype.buildProfNavbar = function () {

};

module.exports = NavBar;