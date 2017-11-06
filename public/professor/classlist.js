/**
 * Will be used to build and display a class list for the professors
 * will ajax call to get the class list
 * $.get('/professor/classes').done(this.successCallback)
 * .fail(this.failedCallback)
 * .always(this.alwaysCallback)
 *
 * // jqXHR is the big network wad they give back
 * // textStatus is 500 - Internal server error, etc.
 * prototype.successCallback = function (data, textStatus, jqXHR) {}
 *
 * // textStatus and errorThrown are strings
 * prototype.failCallback = function (jqXHR, textStatus, errorThrown) {}
 */

var ClassList = function () {
    this._$element = $('.classlist');
    this.classes = [];
    this.updateClasses();
    buildList.call(this);
};


ClassList.prototype.updateClasses = function () {

};

///////////////////////
// Private Functions //
///////////////////////

function buildList () {

}


module.exports = ClassList;

// How the html looked in the bootstrap example:
//
// <!-- <div class="row">
//     <nav class="col-sm-3 col-md-2 d-none d-sm-block bg-light sidebar">
//         <ul class="nav nav-pills flex-column">
//             <li class="nav-item">
//             <a class="nav-link active" href="#">Overview <span class="sr-only">(current)</span></a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Reports</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Analytics</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Export</a>
//             </li>
//         </ul>

//         <ul class="nav nav-pills flex-column">
//             <li class="nav-item">
//             <a class="nav-link" href="#">Nav item</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Nav item again</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">One more nav</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Another nav item</a>
//             </li>
//         </ul>

//         <ul class="nav nav-pills flex-column">
//             <li class="nav-item">
//             <a class="nav-link" href="#">Nav item again</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">One more nav</a>
//             </li>
//             <li class="nav-item">
//             <a class="nav-link" href="#">Another nav item</a>
//             </li>
//         </ul>
//     </nav>
// </div> -->