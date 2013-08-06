var anm = require('./player.js');
var Builder = require('./builder.js');
var NODE = require('./engines/node-engine.node.js');

var b = Builder._$;

/*var engine = */anm.switchEngineTo(NODE.Engine);

var player = anm.createPlayer('fake', { mode: anm.C.M_DYNAMIC });

var scene = b('scene');
var circle = b('circle')
  .circle([10, 10], 14);

scene.add(circle);


player.load(scene).drawAt(0);