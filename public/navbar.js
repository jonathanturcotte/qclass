// Items to be added to the NavBar. Items are added in order that they
// appear in the array. Label is the the text that will be displayed
// profOnly indicates if only professors should see this. Text indicates
// whether an item should show up as plain text. If false, it shows as a link.
NAVBAR_ITEMS = [
    // { label: "Signed in as ", id: "greeting",  text: true,  profOnly: true  },
    { label: "Sign-out",      id: "signout",   text: false, profOnly: false }
];

/**
 * Creates the navbar object
 */
var NavBar = function () {
    this._$element = $('.navbar');
};

/**
 * Build the professor navbar
 */
NavBar.prototype.buildProfNavbar = function () {
    buildNavbar.call(this, true);
};

/**
 * Build the student navbar
 */
NavBar.prototype.buildStudentNavbar = function () {
    buildNavbar.call(this, false);
};

///////////////////////
// Private Functions //
///////////////////////

/**
 * Build the simple navbar, and append it to the DOM
 * @param {Boolean} showProf
 */
function buildNavbar (showProf) {
    // Make sure to clear any old navbar
    this._$element.empty();

    // Create the basic structure
    var $siteName = $('<a>', { class: "navbar-brand", href: "#", text: document.title }),
        $linkDiv  = $('<div>', { id: "navbar", class: "justify-content-end" }),
        $linkList = $('<ul>', { class: "nav navbar-nav navbar-right" });

    // Create a list tag for each navbar item
    NAVBAR_ITEMS.forEach(function (item) {
        if (!item.profOnly || showProf){
            var $li = $('<li>', { class: "nav-item" }),
                $el;

            // TODO - Decide if we even want the greeting
            // Special case for the greeting
            // if (item.id === 'greeting') {
            //     $el = $('<p class="navbar-text">');
            // } else {
            $el = $('<a>', { class: "nav-link", id: item.id, text: item.label });
            // }

            // Append the elements
            $el.appendTo($li);
            $li.appendTo($linkList);
        }
    });

    // Add everything together
    $linkList.appendTo($linkDiv);
    this._$element.append($siteName).append($linkDiv);
}

module.exports = NavBar;