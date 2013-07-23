define([], function () {
var common = {};


//=============================================================================
// Game Variables
//=============================================================================
common = {
  fps            : 60,                      // how many 'update' frames per second
  drawDistance   : 300,                     // number of segments to draw
  roadWidth      : 2000,                    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
  segmentLength  : 200,                     // length of a single segment
  rumbleLength   : 3,                       // number of segments per red/white rumble strip
  numLaps        : 3,
  numRacers      : 8,
  playerSegment  : {},
  segments       : [],                      // array of road segments
  cars           : [],                      // array of cars on the road
  trackLength    : null,                    // z length of entire track (computed)
  lanes          : 3,                       // number of lanes
  centrifugal    : 4,                       // The centrifugal force going around turns
  raceActive     : false,
  input          : {
      keyLeft        : false,
      keyRight       : false,
      keyFaster      : false,
      keySlower      : false,
      keyDrift       : false
  }
}
common.step         = 1/common.fps;                          // how long is each frame (in seconds)
common.maxSpeed     = common.segmentLength/common.step;      // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
common.accel        =  common.maxSpeed/5;                    // acceleration rate - tuned until it 'felt' right
common.breaking     = -common.maxSpeed;                      // deceleration rate when braking
common.decel        = -common.maxSpeed/5;                    // 'natural' deceleration rate when neither accelerating, nor braking
common.offRoadDecel = -common.maxSpeed/2;                    // off road deceleration is somewhere in between
common.offRoadLimit =  common.maxSpeed/4;                    // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)


// CAR REFERENCE, all cars on the road should have a .car attribute with this object.
// Make sure to use jQuery.extend(true, {}, common.carDefault) or your values will be global!



//=============================================================================
// Graphic constants
//=============================================================================
const COLORS = {
  SKY:  '#72D7EE',
  TREE: '#005108',
  FOG:  '#005108',
  LIGHT:  { road: '#6B6B6B', grass: '#10AA10', rumble: '#555555', lane: '#CCCCCC'  },
  DARK:   { road: '#696969', grass: '#009A00', rumble: '#BBBBBB'                   },
  START:  { road: 'white',   grass: 'white',   rumble: 'white'                     },
  FINISH: { road: 'black',   grass: 'black',   rumble: 'black'                     }
};

const BACKGROUND = {
  HILLS: { x:   5, y:   5, w: 1280, h: 480 },
  SKY:   { x:   5, y: 495, w: 1280, h: 480 },
  TREES: { x:   5, y: 985, w: 1280, h: 480 }
};

const SPRITES = {
    BILLBOARD: { x:  2 , y:  4370 , w:  712 , h:  520  },
    BOULDER1: { x:  2 , y:  3872 , w:  336 , h:  496  },
    BOULDER2: { x:  2 , y:  1836 , w:  596 , h:  280  },
    BOULDER3: { x:  2 , y:  3430 , w:  640 , h:  440  },
    BUSH1: { x:  2 , y:  2706 , w:  480 , h:  310  },
    BUSH2: { x:  2 , y:  2400 , w:  464 , h:  304  },
    CACTUS: { x:  2 , y:  1598 , w:  470 , h:  236  },
    CAR_DRIFT_LEFT: { x:  488 , y:  451 , w:  240 , h:  225  },
    CAR_DRIFT_LEFT_DOWN: { x:  260 , y:  2 , w:  242 , h:  221  },
    CAR_DRIFT_LEFT_UP: { x:  489 , y:  906 , w:  236 , h:  227  },
    CAR_DRIFT_RIGHT: { x:  486 , y:  1135 , w:  238 , h:  228  },
    CAR_DRIFT_RIGHT_DOWN: { x:  245 , y:  451 , w:  241 , h:  224  },
    CAR_DRIFT_RIGHT_UP: { x:  480 , y:  1365 , w:  234 , h:  231  },
    CAR_LEFT: { x:  2 , y:  451 , w:  241 , h:  224  },
    CAR_LEFT_2: { x:  480 , y:  678 , w:  241 , h:  226  },
    CAR_LEFT_2_DOWN: { x:  14 , y:  2 , w:  244 , h:  221  },
    CAR_LEFT_2_UP: { x:  2 , y:  678 , w:  237 , h:  225  },
    CAR_LEFT_DOWN: { x:  248 , y:  226 , w:  245 , h:  223  },
    CAR_LEFT_UP: { x:  241 , y:  678 , w:  237 , h:  226  },
    CAR_RIGHT: { x:  242 , y:  1135 , w:  242 , h:  228  },
    CAR_RIGHT_2: { x:  246 , y:  906 , w:  241 , h:  227  },
    CAR_RIGHT_2_DOWN: { x:  2 , y:  226 , w:  244 , h:  223  },
    CAR_RIGHT_2_UP: { x:  241 , y:  1365 , w:  237 , h:  230  },
    CAR_RIGHT_DOWN: { x:  495 , y:  226 , w:  245 , h:  223  },
    CAR_RIGHT_UP: { x:  2 , y:  1365 , w:  237 , h:  230  },
    CAR_STRAIGHT: { x:  2 , y:  906 , w:  242 , h:  226  },
    CAR_STRAIGHT_DOWN: { x:  504 , y:  2 , w:  245 , h:  222  },
    CAR_STRAIGHT_UP: { x:  2 , y:  1135 , w:  238 , h:  228  },
    COLUMN: { x:  304 , y:  4892 , w:  400 , h:  630  },
    DEAD_TREE1: { x:  2 , y:  5524 , w:  270 , h:  664  },
    DEAD_TREE2: { x:  2 , y:  4892 , w:  300 , h:  520  },
    EXPLOSION0: { x:  364 , y:  3068 , w:  360 , h:  360  },
    EXPLOSION1: { x:  2 , y:  3068 , w:  360 , h:  360  },
    EXPLOSION2: { x:  484 , y:  2706 , w:  360 , h:  360  },
    PALM_TREE: { x:  2 , y:  6954 , w:  430 , h:  1080  },
    STUMP: { x:  2 , y:  2118 , w:  390 , h:  280  },
    TREE1: { x:  2 , y:  6232 , w:  720 , h:  720  },
    TREE2: { x:  274 , y:  5524 , w:  526 , h:  706  }
};

SPRITES.SCALE = .3 * (1/SPRITES.CAR_STRAIGHT.w) // the reference sprite width should be 1/3rd the (half-)roadWidth

SPRITES.CAR_ORIENT = [[ SPRITES.CAR_DRIFT_LEFT_DOWN, SPRITES.CAR_LEFT_2_DOWN, SPRITES.CAR_LEFT_DOWN,  SPRITES.CAR_STRAIGHT_DOWN, SPRITES.CAR_RIGHT_DOWN, SPRITES.CAR_RIGHT_2_DOWN, SPRITES.CAR_DRIFT_RIGHT_DOWN],
                      [ SPRITES.CAR_DRIFT_LEFT,      SPRITES.CAR_LEFT_2   ,   SPRITES.CAR_LEFT   ,    SPRITES.CAR_STRAIGHT   ,   SPRITES.CAR_RIGHT   ,   SPRITES.CAR_RIGHT_2   ,   SPRITES.CAR_DRIFT_RIGHT],
                      [ SPRITES.CAR_DRIFT_LEFT_UP,   SPRITES.CAR_LEFT_2_UP,   SPRITES.CAR_LEFT_UP,    SPRITES.CAR_STRAIGHT_UP,   SPRITES.CAR_RIGHT_UP,   SPRITES.CAR_RIGHT_2_UP,   SPRITES.CAR_DRIFT_RIGHT_UP]];

//SPRITES.BILLBOARDS = [SPRITES.BILLBOARD01, SPRITES.BILLBOARD02, SPRITES.BILLBOARD03, SPRITES.BILLBOARD04, SPRITES.BILLBOARD05, SPRITES.BILLBOARD06, SPRITES.BILLBOARD07, SPRITES.BILLBOARD08, SPRITES.BILLBOARD09];
SPRITES.BILLBOARDS = [SPRITES.BILLBOARD];
SPRITES.PLANTS     = [SPRITES.TREE1, SPRITES.TREE2, SPRITES.DEAD_TREE1, SPRITES.DEAD_TREE2, SPRITES.PALM_TREE, SPRITES.BUSH1, SPRITES.BUSH2, SPRITES.CACTUS, SPRITES.STUMP, SPRITES.BOULDER1, SPRITES.BOULDER2, SPRITES.BOULDER3];
//SPRITES.CARS       = [SPRITES.CAR01, SPRITES.CAR02, SPRITES.CAR03, SPRITES.CAR04, SPRITES.SEMI, SPRITES.TRUCK];
SPRITES.CARS       = [SPRITES.CAR_STRAIGHT];

common.COLORS      = COLORS;
common.BACKGROUND  = BACKGROUND;
common.SPRITES     = SPRITES;

return common;
});