define(['games/racer/util','games/racer/common'], function (Util,C) {

var racer = {}

//var centrifugal    = .3;                     // centrifugal force multiplier when going around curves
var offRoadDecel   = 0.99;                    // speed multiplier when off road (e.g. you lose 2% speed each update frame)

var accel          =  C.maxSpeed/5;             // acceleration rate - tuned until it 'felt' right
var breaking       = -C.maxSpeed;               // deceleration rate when braking
var decel          = -C.maxSpeed/5;             // 'natural' deceleration rate when neither accelerating, nor braking
var offRoadDecel   = -C.maxSpeed/2;             // off road deceleration is somewhere in between
var offRoadLimit   =  C.maxSpeed/4;             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
var totalCars      = 10;                        // total number of cars on the road

var ax             = 0;

// Game state
var s = {
  camera           : {
    fieldOfView      : 100,                   // angle (degrees) for field of view
    height           : 1000,                  // z height of camera
    depth            : null,                  // z distance camera is from screen (computed)
    playerZ          : null,                  // player relative z distance from camera (computed)
    drawDistance     : 300,                   // number of segments to draw
    fogDensity       : 1                      // exponential fog density
  },
  player           : {
    x                : 0,                     // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
    z                : 0,                     // current camera Z position (add s.camera.playerZ to get player's absolute Z position)
    dx               : 0,                     // current horizontal velocity
    speed            : 0                      // current speed
  },
  currentLapTime   : 0,                       // current lap time
  lastLapTime      : null,                    // last lap time
  lap              : 1,
  carsPassed       : 0                        // net cars passed (if they pass you, -1, you pass them, +1)
}

//=========================================================================
// UPDATE THE GAME WORLD
//=========================================================================
racer.update = function(dt) {
  var n, car, carW, sprite, spriteW;
  C.playerSegment = racer.findSegment(s.player.z+s.camera.playerZ);
  var playerW       = C.SPRITES.CAR_STRAIGHT.w * C.SPRITES.SCALE;
  var speedPercent  = s.player.speed/C.maxSpeed;
  ax            = speedPercent/2; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
  var dx = 2*speedPercent*dt;
  startPosition = s.player.z;
  updateCars(dt, C.playerSegment, playerW);

  s.player.z = Util.increase(s.player.z, dt * s.player.speed, C.trackLength);
  
  // adjust change in x position
  if (C.keyLeft) {
    s.player.dx = Math.max(Util.accelerate(s.player.dx, -ax, dt),-dx);
  }
  else if (C.keyRight) {
    s.player.dx = Math.min(Util.accelerate(s.player.dx, ax, dt),dx);
  }
  else {
    if(s.player.x != 0) s.player.dx -= s.player.dx/2;
  }
  s.player.x += s.player.dx;
  var outwardForce = dx * C.playerSegment.curve / 4;
  s.player.x = s.player.x - outwardForce;
  

  if (C.keyFaster)
    s.player.speed = Util.accelerate(s.player.speed, accel, dt);
  else if (C.keySlower)
    s.player.speed = Util.accelerate(s.player.speed, breaking, dt);
  else
    s.player.speed = Util.accelerate(s.player.speed, decel, dt);


  if ((s.player.x < -1) || (s.player.x > 1)) {

    if (s.player.speed > offRoadLimit)
      s.player.speed = Util.accelerate(s.player.speed, offRoadDecel, dt);

    for(n = 0 ; n < C.playerSegment.sprites.length ; n++) {
      sprite  = C.playerSegment.sprites[n];
      spriteW = sprite.source.w * C.SPRITES.SCALE;
      if (Util.overlap(s.player.x, playerW, sprite.offset + spriteW/2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
        s.player.speed = C.maxSpeed/5;
        s.player.z = Util.increase(C.playerSegment.p1.world.z, -s.camera.playerZ, C.trackLength); // stop in front of sprite (at front of segment)
        //TODO: Add explosion
        break;
      }
    }
  }

  for(n = 0 ; n < C.playerSegment.cars.length ; n++) {
    car  = C.playerSegment.cars[n];
    carW = car.sprite.w * C.SPRITES.SCALE;
    if (s.player.speed > car.speed) {
      if (Util.overlap(s.player.x, playerW, car.offset, carW, 0.8)) {
        s.player.speed    = car.speed * (car.speed/s.player.speed);
        s.player.z = Util.increase(car.z, -s.camera.playerZ, C.trackLength);
        break;
      }
    }
  }

  s.player.x = Util.limit(s.player.x, -3, 3);     // dont ever let it go too far out of bounds
  s.player.speed = Util.limit(s.player.speed, 0, C.maxSpeed); // or exceed maxSpeed

  if (s.player.z > s.camera.playerZ) {
    if (s.currentLapTime && (startPosition < s.camera.playerZ)) {
      s.lastLapTime    = s.currentLapTime;
      s.currentLapTime = 0;
      s.lap++;
    }
    else {
      s.currentLapTime += dt;
    }
  }
  return s;
}

//-------------------------------------------------------------------------

function updateCars(dt, playerSegment, playerW) {
  var n, car, oldSegment, newSegment;
  for(n = 0 ; n < cars.length ; n++) {
    car         = cars[n];
    oldSegment  = racer.findSegment(car.z);
    car.offset  = car.offset + updateCarOffset(car, oldSegment, playerSegment, playerW);
    car._z      = car.z;
    car.z       = Util.increase(car.z, dt * car.speed, C.trackLength);
    car.percent = Util.percentRemaining(car.z, C.segmentLength); // useful for interpolation during rendering phase
    newSegment  = racer.findSegment(car.z);
    if (oldSegment != newSegment) {
      index = oldSegment.cars.indexOf(car);
      oldSegment.cars.splice(index, 1);
      newSegment.cars.push(car);
    }
    if(car.z<car._z) car.lap++;
    //checkPlace(car,s.camera.playerZ)
  }
}
var xyz=0;
function checkPlace(car) {
  if(car.z%C.trackLength > s.player.z%C.trackLength && car._z%C.trackLength < s.player.z%C.trackLength && car.speed > s.player.speed) {
    s.carsPassed--;
  }
  if(car.z%C.trackLength < s.player.z%C.trackLength && car._z%C.trackLength > s.player.z%C.trackLength && car.speed < s.player.speed) {
    s.carsPassed++;
  }
}

function updateCarOffset(car, carSegment, playerSegment, playerW) {

  var i, j, dir, segment, otherCar, otherCarW, lookahead = 20, carW = car.sprite.w * C.SPRITES.SCALE;

  // optimization, dont bother steering around other cars when 'out of sight' of the player
  if ((carSegment.index - playerSegment.index) > s.camera.drawDistance)
    return 0;

  for(i = 1 ; i < lookahead ; i++) {
    segment = C.segments[(carSegment.index+i)%C.segments.length];

    if ((segment === playerSegment) && (car.speed > s.player.speed) && (Util.overlap(s.player.x, playerW, car.offset, carW, 1.2))) {
      if (s.player.x > 0.5)
        dir = -1;
      else if (s.player.x < -0.5)
        dir = 1;
      else
        dir = (car.offset > s.player.x) ? 1 : -1;
      return dir * 1/i * (car.speed-s.player.speed)/C.maxSpeed; // the closer the cars (smaller i) and the greated the speed ratio, the larger the offset
    }

    for(j = 0 ; j < segment.cars.length ; j++) {
      otherCar  = segment.cars[j];
      otherCarW = otherCar.sprite.w * C.SPRITES.SCALE;
      if ((car.speed > otherCar.speed) && Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)) {
        if (otherCar.offset > 0.5)
          dir = -1;
        else if (otherCar.offset < -0.5)
          dir = 1;
        else
          dir = (car.offset > otherCar.offset) ? 1 : -1;
        return dir * 1/i * (car.speed-otherCar.speed)/C.maxSpeed;
      }
    }
  }

  // if no cars ahead, but I have somehow ended up off road, then steer back on
  if (car.offset < -0.9)
    return 0.1;
  else if (car.offset > 0.9)
    return -0.1;
  else
    return 0;
}

racer.findSegment = function (z) {
  return C.segments[Math.floor(z/C.segmentLength) % C.segments.length]; 
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
  resetCars();

  C.segments[racer.findSegment(s.camera.playerZ).index + 2].color = C.COLORS.START;
  C.segments[racer.findSegment(s.camera.playerZ).index + 3].color = C.COLORS.START;
  for(var n = 0 ; n < C.rumbleLength ; n++)
    C.segments[C.segments.length-1-n].color = C.COLORS.FINISH;

  C.trackLength = C.segments.length * C.segmentLength;
}

function resetSprites() {
  var n, i;

  addSprite(20,  C.SPRITES.BILLBOARD, -1.2);
  addSprite(60,  C.SPRITES.BILLBOARD, -1.2);
  addSprite(100, C.SPRITES.BILLBOARD, -1.2);
  addSprite(140, C.SPRITES.BILLBOARD, -1.2);
  addSprite(180, C.SPRITES.BILLBOARD, -1.2);

  addSprite(240,                    C.SPRITES.BILLBOARD, -1.2);
  addSprite(240,                    C.SPRITES.BILLBOARD,  1.2);
  addSprite(C.segments.length - 25, C.SPRITES.BILLBOARD, -1.2);
  addSprite(C.segments.length - 25, C.SPRITES.BILLBOARD,  1.2);

  for(n = 10 ; n < 200 ; n += 4 + Math.floor(n/100)) {
    addSprite(n, C.SPRITES.PALM_TREE, 0.6 + Math.random()*0.5);
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
    side      = Util.randomChoice([1, -1]);
    addSprite(n + Util.randomInt(0, 50), Util.randomChoice(C.SPRITES.BILLBOARDS), -side);
    for(i = 0 ; i < 20 ; i++) {
      sprite = Util.randomChoice(C.SPRITES.PLANTS);
      offset = side * (1.5 + Math.random());
      addSprite(n + Util.randomInt(0, 50), sprite, offset);
    }
      
  }

}

function resetCars() {
  cars = [];
  var n, car, segment, offset, z, sprite, speed;
  for (var n = 0 ; n < totalCars ; n++) {
    offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
    z      = Math.floor(Math.random() * C.segments.length) * C.segmentLength;
    sprite = Util.randomChoice(C.SPRITES.CARS);
    speed  = C.maxSpeed/2 + Math.random() * C.maxSpeed/(sprite == C.SPRITES.SEMI ? 4 : 2);
    car = { offset: offset, z: z, sprite: sprite, speed: speed, lap: 1};
    segment = racer.findSegment(car.z);
    segment.cars.push(car);
    cars.push(car);
  }
}

//=========================================================================
// THE GAME LOOP
//=========================================================================

racer.reset = function (options) {
  options       = options || {};
  s.camera.height          = Util.toInt(options.cameraHeight,   s.camera.height);
  s.camera.drawDistance    = Util.toInt(options.drawDistance,   s.camera.drawDistance);
  s.camera.fogDensity      = Util.toInt(options.fogDensity,     s.camera.fogDensity);
  s.camera.fieldOfView     = Util.toInt(options.fieldOfView,    s.camera.fieldOfView);
  s.camera.depth           = 1 / Math.tan((s.camera.fieldOfView/2) * Math.PI/180);
  s.camera.playerZ         = (s.camera.height * s.camera.depth);

  if ((C.segments.length==0) || (options.segmentLength) || (options.rumbleLength))
    resetRoad(); // only rebuild road when necessary
}

return racer;
});