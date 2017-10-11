/**
 * Prints an array to a single string, with elements delimited by the delimiter string
 */
exports.printArray = function(array, delimiter = ', ') {
    var print = '';
    for (let i = 0; i < array.length; i++) {
        print += `${array[i]}${delimiter}`;
    }
    return print.substring(0, print.length - delimiter.length); 
};

exports.randomInt = function(min, max)
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}
