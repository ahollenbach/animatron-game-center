var fs = require('fs');

module.exports = eval(fs.readFileSync("lib/player/lib/hardcore.js", "utf8"));