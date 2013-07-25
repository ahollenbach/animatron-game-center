var anm = require('./player.js');
var Builder = require('./builder.js');
var NODE = require('./engines/node-engine.node.js');
var collisions = require('./module/collisions.js');

var b = Builder._$;

anm.switchEngineTo(NODE.Engine);

exports.anm = anm;
exports.Builder = Builder;