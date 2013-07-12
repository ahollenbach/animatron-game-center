define(['games/racer/util','games/racer/common'], function (Util,C) {

var racer = {}

//var centrifugal    = .3;                      // centrifugal force multiplier when going around curves

var accel          =  C.maxSpeed/5;             // acceleration rate - tuned until it 'felt' right
var breaking       = -C.maxSpeed;               // deceleration rate when braking
var decel          = -C.maxSpeed/5;             // 'natural' deceleration rate when neither accelerating, nor braking
var offRoadDecel   = -C.maxSpeed/2;             // off road deceleration is somewhere in between
var offRoadLimit   =  C.maxSpeed/4;             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
var totalCars      = 0;                         // total number of cars on the road

// player state
var player = {
  x                : 0,                     // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
  z                : 0,                     // player's absolute Z position
  _z               : 0,                     // last z position
  dx               : 0,                     // current horizontal velocity
  speed            : 0,                     // current speed
  currentLapTime   : 0,                     // current lap time
  lastLapTime      : null,                  // last lap time
  lap              : 1,
  place            : null,                  // position in the race, calculated each step
  finished         : false,                 // boolean whether the given player is finished
}

//=========================================================================
// UPDATE THE GAME WORLD
//=========================================================================
racer.update = function(dt) {
  C.playerSegment = racer.findSegment(player.z);
  var playerW       = C.SPRITES.CAR_STRAIGHT.w * C.SPRITES.SCALE;

  //updateCars(dt, C.playerSegment, playerW);
  updateOpponents(dt);
  if(!player.finished) {
    updatePlayerPosition(dt, playerW);
    player.place = getPlace();
  }

  return player;
}

//-------------------------------------------------------------------------
function updatePlayerPosition(dt, playerW) {
  var n, car, carW, sprite, spriteW;
  var speedPercent  = player.speed/C.maxSpeed;
  var ax            = speedPercent/2; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
  var dx = 2*speedPercent*dt;

  player._z = player.z;
  player.z = Util.increase(player.z, dt * player.speed, C.trackLength);

  // adjust change in x position
  if (C.keyLeft) {
    player.dx = Math.max(Util.accelerate(player.dx, -ax, dt),-dx);
  }
  else if (C.keyRight) {
    player.dx = Math.min(Util.accelerate(player.dx, ax, dt),dx);
  }
  else {
    if(player.x != 0) player.dx -= player.dx/2;
  }
  player.x += player.dx;
  var outwardForce = dx * C.playerSegment.curve / 4;
  player.x = player.x - outwardForce;


  if (C.keyFaster)
    player.speed = Util.accelerate(player.speed, accel, dt);
  else if (C.keySlower)
    player.speed = Util.accelerate(player.speed, breaking, dt);
  else
    player.speed = Util.accelerate(player.speed, decel, dt);


  if ((player.x < -1) || (player.x > 1)) {
    if (player.speed > offRoadLimit)
      player.speed = Util.accelerate(player.speed, offRoadDecel, dt);
    
    for(n = 0 ; n < C.playerSegment.sprites.length ; n++) {
      sprite  = C.playerSegment.sprites[n];
      spriteW = sprite.source.w * C.SPRITES.SCALE;
      if (Util.overlap(player.x, playerW, sprite.offset + spriteW/2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
        // collided with something, stop the car
        player.speed = C.maxSpeed/5;
        //player.speed = 0;
        //player.reset = true;
        player.z = player._z;
        //TODO: Add explosion
        break;
      }
    }
  }

  for(n = 0 ; n < C.playerSegment.cars.length ; n++) {
    opponent  = C.playerSegment.cars[n];
    carW = opponent.sprite.w * C.SPRITES.SCALE;
    if (player.speed > opponent.car.speed) {
      if (Util.overlap(player.x, playerW, opponent.car.x, carW, 0.8)) {
        player.speed    = opponent.car.speed * (opponent.car.speed/player.speed);
        player.z = player._z;
        break;
      }
    }
  }

  player.x = Util.limit(player.x, -3, 3);     // dont ever let it go too far out of bounds
  player.speed = Util.limit(player.speed, 0, C.maxSpeed); // or exceed maxSpeed

  if (C.raceActive) {
    if (player.currentLapTime && (player._z > player.z)) {
      player.lastLapTime    = player.currentLapTime;
      player.lap++;
      if(player.lap > C.numLaps) C.raceActive = false;
      else player.currentLapTime = 0;
    }
    else {
      player.currentLapTime += dt;
    }
  }
}

function updateOpponents(dt) {
  var n, car, oldSegment, newSegment;
  for(n = 0 ; n < C.cars.length ; n++) {
    car         = C.cars[n];
    car.move(dt);
  }
}

racer.findSegment = function (z) {
  return C.segments[Math.floor(z/C.segmentLength) % C.segments.length]; 
}

function getPlace() {
  var place = 1;
  for(n = 0 ; n < C.cars.length ; n++) {
    opponent = C.cars[n];
    //if(player.z < 10000) console.log(opponent.car.lap, opponent.car.z, player.lap, player.z)
    if(opponent.car.lap > player.lap || (opponent.car.lap == player.lap && opponent.car.z > player.z)) place++;
  }
  return place;
}

//=========================================================================
// BUILD ROAD GEOMETRY
//=========================================================================

function lastY() { return (C.segments.length == 0) ? 0 : C.segments[C.segments.length-1].p2.world.y; }

function addSegment(curve, y) {
  var n = C.segments.length;
  C.segments.push({
      index: n,
         p1: { world: { y: lastY(), z:  n   *C.segmentLength }, camera: {}, screen: {} },
         p2: { world: { y: y,       z: (n+1)*C.segmentLength }, camera: {}, screen: {} },
      curve: curve,
    sprites: [],
       cars: [],
      color: Math.floor(n/C.rumbleLength)%2 ? C.COLORS.DARK : C.COLORS.LIGHT
  });
}

function addSprite(n, sprite, offset) {
  C.segments[n].sprites.push({ source: sprite, offset: offset });
}

function addRoad(enter, hold, leave, curve, y) {
  var startY   = lastY();
  var endY     = startY + (Util.toInt(y, 0) * C.segmentLength);
  var n, total = enter + hold + leave;
  for(n = 0 ; n < enter ; n++)
    addSegment(Util.easeIn(0, curve, n/enter), Util.easeInOut(startY, endY, n/total));
  for(n = 0 ; n < hold  ; n++)
    addSegment(curve, Util.easeInOut(startY, endY, (enter+n)/total));
  for(n = 0 ; n < leave ; n++)
    addSegment(Util.easeInOut(curve, 0, n/leave), Util.easeInOut(startY, endY, (enter+hold+n)/total));
}

var ROAD = {
  LENGTH: { NONE: 0, SHORT:  25, MEDIUM:   50, LONG:  100 },
  HILL:   { NONE: 0, LOW:    20, MEDIUM:   40, HIGH:   60 },
  CURVE:  { NONE: 0, EASY:    2, MEDIUM:    4, HARD:    6 }
};

function addStraight(num) {
  num = num || ROAD.LENGTH.MEDIUM;
  addRoad(num, num, num, 0, 0);
}

function addHill(num, height) {
  num    = num    || ROAD.LENGTH.MEDIUM;
  height = height || ROAD.HILL.MEDIUM;
  addRoad(num, num, num, 0, height);
}

function addCurve(num, curve, height) {
  num    = num    || ROAD.LENGTH.MEDIUM;
  curve  = curve  || ROAD.CURVE.MEDIUM;
  height = height || ROAD.HILL.NONE;
  addRoad(num, num, num, curve, height);
}
    
function addLowRollingHills(num, height) {
  num    = num    || ROAD.LENGTH.SHORT;
  height = height || ROAD.HILL.LOW;
  addRoad(num, num, num,  0,                height/2);
  addRoad(num, num, num,  0,               -height);
  addRoad(num, num, num,  ROAD.CURVE.EASY,  height);
  addRoad(num, num, num,  0,                0);
  addRoad(num, num, num, -ROAD.CURVE.EASY,  height/2);
  addRoad(num, num, num,  0,                0);
}

function addSCurves() {
  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.NONE);
  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.MEDIUM,  ROAD.HILL.MEDIUM);
  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.EASY,   -ROAD.HILL.LOW);
  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.MEDIUM);
  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
}

function addBumps() {
  addRoad(10, 10, 10, 0,  5);
  addRoad(10, 10, 10, 0, -2);
  addRoad(10, 10, 10, 0, -5);
  addRoad(10, 10, 10, 0,  8);
  addRoad(10, 10, 10, 0,  5);
  addRoad(10, 10, 10, 0, -7);
  addRoad(10, 10, 10, 0,  5);
  addRoad(10, 10, 10, 0, -2);
}

function addDownhillToEnd(num) {
  num = num || 200;
  addRoad(num, num, num, -ROAD.CURVE.EASY, -lastY()/C.segmentLength);
}

function resetRoad() {
  C.segments = [];

  addStraight(ROAD.LENGTH.SHORT);
  /*addLowRollingHills();
  addSCurves();
  addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
  addBumps();
  addLowRollingHills();
  addCurve(ROAD.LENGTH.LONG*2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
  addStraight();
  addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
  addSCurves();
  addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
  addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
  addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
  addBumps();
  addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
  addStraight();*/
  addSCurves();
  addDownhillToEnd();

  resetSprites();
  resetAmbientCars();

  //TODO: make a better finish line
  for(var n = 0 ; n < C.rumbleLength*3 ; n++) {
    var rumble = (C.segments.length-1+n)%C.segments.length;
    C.segments[rumble].color = rumble%2 == 0 ? C.COLORS.FINISH : C.COLORS.START;
  }

  C.trackLength = C.segments.length * C.segmentLength;
}

function resetSprites() {
  var n, i;

  for(n=20;n<=180;n+=40) {
    addSprite(n,  C.SPRITES.BILLBOARD, -1.4);
  }

  addSprite(240,                    C.SPRITES.BILLBOARD, -1.4);
  addSprite(240,                    C.SPRITES.BILLBOARD,  1.4);
  addSprite(C.segments.length - 25, C.SPRITES.BILLBOARD, -1.4);
  addSprite(C.segments.length - 25, C.SPRITES.BILLBOARD,  1.4);

  for(n = 10 ; n < 200 ; n += 4 + Math.floor(n/100)) {
    addSprite(n, C.SPRITES.PALM_TREE, .9 + Math.random()*0.5);
    addSprite(n, C.SPRITES.PALM_TREE,   1.1 + Math.random()*2);
  }

  for(n = 250 ; n < 1000 ; n += 5) {
    addSprite(n,     C.SPRITES.COLUMN, 1.2);
    addSprite(n + Util.randomInt(0,5), C.SPRITES.TREE1, -1.2 - (Math.random() * 2));
    addSprite(n + Util.randomInt(0,5), C.SPRITES.TREE2, -1.2 - (Math.random() * 2));
  }

  for(n = 200 ; n < C.segments.length ; n += 3) {
    addSprite(n, Util.randomChoice(C.SPRITES.PLANTS), Util.randomChoice([1,-1]) * (2 + Math.random() * 5));
  }

  var side, sprite, offset;
  for(n = 1000 ; n < (C.segments.length-50) ; n += 100) {
    side      = Util.randomChoice([1.4, -1.4]);
    addSprite(n + Util.randomInt(0, 50), Util.randomChoice(C.SPRITES.BILLBOARDS), -side);
    for(i = 0 ; i < 20 ; i++) {
      sprite = Util.randomChoice(C.SPRITES.PLANTS);
      offset = side * (1.5 + Math.random());
      addSprite(n + Util.randomInt(0, 50), sprite, offset);
    }
      
  }

}

function resetAmbientCars() {
  C.cars = [];
  var n, car, segment, offset, z, sprite, speed;
  for (var n = 0 ; n < totalCars ; n++) {
    offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
    z      = Math.floor(Math.random() * C.segments.length) * C.segmentLength;
    sprite = Util.randomChoice(C.SPRITES.CARS);
    speed  = C.maxSpeed/2 + Math.random() * C.maxSpeed/(sprite == C.SPRITES.SEMI ? 4 : 2);
    car = { offset: offset, z: z, sprite: sprite, speed: speed, lap: 1};
    segment = racer.findSegment(car.z);
    segment.cars.push(car);
      C.cars.push(car);
  }
}

function resetAI() {

}

//=========================================================================
// THE GAME LOOP
//=========================================================================

racer.reset = function (options) {
  options       = options || {};

  if ((C.segments.length==0) || (options.segmentLength) || (options.rumbleLength))
    resetRoad(); // only rebuild road when necessary
}

return racer;
});