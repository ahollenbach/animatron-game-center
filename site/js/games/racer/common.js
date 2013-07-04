define([], function () {
var common = {};


//=============================================================================
// Game Variables
//=============================================================================
common = {
  fps            : 60,                      // how many 'update' frames per second
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
}
common.step      = 1/common.fps;                   // how long is each frame (in seconds)
common.maxSpeed  = common.segmentLength/common.step; // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)


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
BILLBOARD: { x:  2 , y:  2 , w:  914 , h:  668  },
BOULDER1: { x:  2283 , y:  1571 , w:  168 , h:  248  },
BOULDER2: { x:  1173 , y:  1743 , w:  298 , h:  140  },
BOULDER3: { x:  1750 , y:  1535 , w:  320 , h:  220  },
BUSH1: { x:  1473 , y:  1743 , w:  240 , h:  155  },
BUSH2: { x:  1715 , y:  1757 , w:  232 , h:  152  },
CACTUS: { x:  2377 , y:  1451 , w:  235 , h:  118  },
CAR_LEFT: { x:  918 , y:  2 , w:  594 , h:  584  },
CAR_LEFT_2: { x:  1174 , y:  590 , w:  595 , h:  578  },
CAR_LEFT_2_UP: { x:  1174 , y:  1170 , w:  574 , h:  571  },
CAR_LEFT_UP: { x:  1771 , y:  592 , w:  576 , h:  579  },
CAR_RIGHT: { x:  1514 , y:  2 , w:  591 , h:  586  },
CAR_RIGHT_2: { x:  2 , y:  672 , w:  595 , h:  586  },
CAR_RIGHT_2_UP: { x:  2107 , y:  2 , w:  573 , h:  588  },
CAR_RIGHT_UP: { x:  599 , y:  672 , w:  573 , h:  586  },
CAR_STRAIGHT: { x:  2 , y:  1260 , w:  591 , h:  586  },
CAR_STRAIGHT_UP: { x:  595 , y:  1260 , w:  576 , h:  581  },
COLUMN: { x:  2377 , y:  1134 , w:  200 , h:  315  },
DEAD_TREE1: { x:  2146 , y:  1528 , w:  135 , h:  332  },
DEAD_TREE2: { x:  2453 , y:  1571 , w:  150 , h:  260  },
PALM_TREE: { x:  2349 , y:  592 , w:  215 , h:  540  },
STUMP: { x:  1949 , y:  1757 , w:  195 , h:  140  },
TREE1: { x:  1750 , y:  1173 , w:  360 , h:  360  },
TREE2: { x:  2112 , y:  1173 , w:  263 , h:  353  }
};

SPRITES.SCALE = (1.5/SPRITES.CAR_STRAIGHT.w) // the reference sprite width should be 1/3rd the (half-)roadWidth
SPRITES.CAR_SCALE  = 0.3 * (1/SPRITES.CAR_STRAIGHT.w)

SPRITES.CAR_ORIENT = [[ SPRITES.CAR_LEFT_2   ,  SPRITES.CAR_LEFT   ,  SPRITES.CAR_STRAIGHT   , SPRITES.CAR_RIGHT   , SPRITES.CAR_RIGHT_2    ],
                      [ SPRITES.CAR_LEFT_2_UP,  SPRITES.CAR_LEFT_UP,  SPRITES.CAR_STRAIGHT_UP, SPRITES.CAR_RIGHT_UP, SPRITES.CAR_RIGHT_2_UP ]];

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