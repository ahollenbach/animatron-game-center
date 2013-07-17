define(['games/racer/util','games/racer/common'], function (Util,C) {

var racer = {}

var centrifugal    = .3;                      // centrifugal force multiplier when going around curves

var totalCars      = 0;                         // total number of cars on the road

//=========================================================================
// UPDATE THE GAME WORLD
//=========================================================================
racer.update = function(dt) {
  if(C.cars.length == 0 /*|| !C.raceActive*/) return; // for now, keep the world running even after finished

  C.playerSegment = racer.findSegment(C.cars[0].car.z);
  updateCars(dt);
}

function updateCars(dt) {
  var n, car, carsFinished = 0;
  for(n = 0 ; n < C.cars.length ; n++) {
    car = C.cars[n];
    car.move(dt);
    if(car.finished) carsFinished++;
  }
  if(carsFinished == C.numRacers) C.raceActive = false;
}

racer.findSegment = function (z) {
  return C.segments[Math.floor(z/C.segmentLength) % C.segments.length]; 
}

// Takes the index of the car you are trying to get the place of (0 for you)
racer.getPlace = function(index) {
  var you = C.cars[index].car, opponent;
  var place = 1;
  for(var n = 0 ; n < C.cars.length ; n++) {
    if(n == index) continue;
    opponent = C.cars[n].car;
    if(opponent.lap > you.lap || (opponent.lap == you.lap && opponent.z > you.z)) place++;
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