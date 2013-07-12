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
  keyLeft        : false,
  keyRight       : false,
  keyFaster      : false,
  keySlower      : false,
  raceActive     : true,
  lanes          : 3                        // number of lanes
}
common.step      = 1/common.fps;                     // how long is each frame (in seconds)
common.maxSpeed  = common.segmentLength/common.step; // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)

// CAR REFERENCE, all cars on the road should have a .car attribute with this object.
// Make sure to use jQuery.extend(true, {}, common.car) or your values will be global!
var car = {
  x                : 0,                     // car x offset from center of road (-1 to 1 to stay independent of roadWidth)
  z                : 0,                     // car's absolute Z position
  _z               : 0,                     // last z position
  dx               : 0,                     // current horizontal velocity
  speed            : 0,                     // current speed
  currentLapTime   : 0,                     // current lap time
  lastLapTime      : null,                  // last lap time
  lap              : 1,                     // current lap
  percent          : 0,                     // useful for interpolation during rendering phase
}
common.carDefault = car;


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

const OLD_SPRITES = {
  PALM_TREE:              { x:    5, y:    5, w:  215, h:  540 },
  BILLBOARD08:            { x:  230, y:    5, w:  385, h:  265 },
  TREE1:                  { x:  625, y:    5, w:  360, h:  360 },
  DEAD_TREE1:             { x:    5, y:  555, w:  135, h:  332 },
  BILLBOARD09:            { x:  150, y:  555, w:  328, h:  282 },
  BOULDER3:               { x:  230, y:  280, w:  320, h:  220 },
  COLUMN:                 { x:  995, y:    5, w:  200, h:  315 },
  BILLBOARD01:            { x:  625, y:  375, w:  300, h:  170 },
  BILLBOARD06:            { x:  488, y:  555, w:  298, h:  190 },
  BILLBOARD05:            { x:    5, y:  897, w:  298, h:  190 },
  BILLBOARD07:            { x:  313, y:  897, w:  298, h:  190 },
  BOULDER2:               { x:  621, y:  897, w:  298, h:  140 },
  TREE2:                  { x: 1205, y:    5, w:  282, h:  295 },
  BILLBOARD04:            { x: 1205, y:  310, w:  268, h:  170 },
  DEAD_TREE2:             { x: 1205, y:  490, w:  150, h:  260 },
  BOULDER1:               { x: 1205, y:  760, w:  168, h:  248 },
  BUSH1:                  { x:    5, y: 1097, w:  240, h:  155 },
  CACTUS:                 { x:  929, y:  897, w:  235, h:  118 },
  BUSH2:                  { x:  255, y: 1097, w:  232, h:  152 },
  BILLBOARD03:            { x:    5, y: 1262, w:  230, h:  220 },
  BILLBOARD02:            { x:  245, y: 1262, w:  215, h:  220 },
  STUMP:                  { x:  995, y:  330, w:  195, h:  140 },
  SEMI:                   { x: 1365, y:  490, w:  122, h:  144 },
  TRUCK:                  { x: 1365, y:  644, w:  100, h:   78 },
  CAR03:                  { x: 1383, y:  760, w:   88, h:   55 },
  CAR02:                  { x: 1383, y:  825, w:   80, h:   59 },
  CAR04:                  { x: 1383, y:  894, w:   80, h:   57 },
  CAR01:                  { x: 1205, y: 1018, w:   80, h:   56 },
  PLAYER_UPHILL_LEFT:     { x: 1383, y:  961, w:   80, h:   45 },
  PLAYER_UPHILL_STRAIGHT: { x: 1295, y: 1018, w:   80, h:   45 },
  PLAYER_UPHILL_RIGHT:    { x: 1385, y: 1018, w:   80, h:   45 },
  PLAYER_LEFT:            { x:  995, y:  480, w:   80, h:   41 },
  PLAYER_STRAIGHT:        { x: 1085, y:  480, w:   80, h:   41 },
  PLAYER_RIGHT:           { x:  995, y:  531, w:   80, h:   41 }
};

const SPRITES = {
BILLBOARD: { x:  1548 , y:  634 , w:  700 , h:  510  },
BOULDER1: { x:  1558 , y:  2 , w:  336 , h:  496  },
BOULDER2: { x:  3425 , y:  2 , w:  596 , h:  280  },
BOULDER3: { x:  1896 , y:  2 , w:  640 , h:  440  },
BUSH1: { x:  2 , y:  1084 , w:  480 , h:  310  },
BUSH2: { x:  2250 , y:  444 , w:  464 , h:  304  },
CACTUS: { x:  1246 , y:  1156 , w:  470 , h:  236  },
CAR_DRIFT_LEFT: { x:  3430 , y:  566 , w:  299 , h:  281  },
CAR_DRIFT_LEFT_DOWN: { x:  3773 , y:  1125 , w:  302 , h:  276  },
CAR_DRIFT_LEFT_UP: { x:  2833 , y:  579 , w:  291 , h:  284  },
CAR_DRIFT_RIGHT: { x:  2250 , y:  1039 , w:  298 , h:  286  },
CAR_DRIFT_RIGHT_DOWN: { x:  3731 , y:  566 , w:  300 , h:  279  },
CAR_DRIFT_RIGHT_UP: { x:  2538 , y:  2 , w:  289 , h:  288  },
CAR_LEFT: { x:  3126 , y:  575 , w:  302 , h:  281  },
CAR_LEFT_2: { x:  3157 , y:  858 , w:  301 , h:  281  },
CAR_LEFT_2_DOWN: { x:  1718 , y:  1146 , w:  305 , h:  275  },
CAR_LEFT_2_UP: { x:  3008 , y:  289 , w:  289 , h:  284  },
CAR_LEFT_DOWN: { x:  3465 , y:  1131 , w:  306 , h:  277  },
CAR_LEFT_UP: { x:  2829 , y:  2 , w:  290 , h:  285  },
CAR_RIGHT: { x:  3121 , y:  2 , w:  302 , h:  283  },
CAR_RIGHT_2: { x:  2550 , y:  1038 , w:  301 , h:  285  },
CAR_RIGHT_2_DOWN: { x:  3460 , y:  849 , w:  305 , h:  280  },
CAR_RIGHT_2_UP: { x:  2250 , y:  750 , w:  289 , h:  287  },
CAR_RIGHT_DOWN: { x:  3157 , y:  1141 , w:  306 , h:  280  },
CAR_RIGHT_UP: { x:  2541 , y:  750 , w:  290 , h:  286  },
CAR_STRAIGHT: { x:  2853 , y:  865 , w:  302 , h:  281  },
CAR_STRAIGHT_DOWN: { x:  3767 , y:  847 , w:  306 , h:  276  },
CAR_STRAIGHT_UP: { x:  2716 , y:  292 , w:  290 , h:  285  },
COLUMN: { x:  1156 , y:  2 , w:  400 , h:  630  },
DEAD_TREE1: { x:  974 , y:  724 , w:  270 , h:  664  },
DEAD_TREE2: { x:  1246 , y:  634 , w:  300 , h:  520  },
PALM_TREE: { x:  2 , y:  2 , w:  430 , h:  1080  },
STUMP: { x:  3425 , y:  284 , w:  390 , h:  280  },
TREE1: { x:  434 , y:  2 , w:  720 , h:  720  },
TREE2: { x:  484 , y:  724 , w:  488 , h:  674  }
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