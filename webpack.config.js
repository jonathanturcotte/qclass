const path = require('path');

module.exports = {
    entry: './public/core/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public')
    }
};
