var anm = require('./player.js');
var Builder = require('./builder.js');
var NODE = require('./engines/node-engine.node.js');

var b = Builder._$;

anm.switchEngineTo(NODE.Engine);

// var player = anm.createPlayer('fake', { mode: anm.C.M_DYNAMIC });

// var elm1 = b();
// elm1.modify(function(t) {
//     console.log(t);
//     this.x += 1;
// });

// player.load(elm1, 1.5).drawAt(0);

exports.anm = anm;
exports.Builder = Builder;
exports.b = b;