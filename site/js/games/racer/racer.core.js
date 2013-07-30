define(['games/racer/util','games/racer/common'], function (Util,Common) {

var racer = {};

//=========================================================================
// UPDATE THE GAME WORLD
//=========================================================================
racer.update = function(dt, input) {
    if(Common.cars.length == 0 /*|| !Common.raceActive*/) return; // for now, keep the world running even after finished

    Common.playerSegment = racer.findSegment(Common.cars[0].car.z);
    updateCars(dt, input);
}

function updateCars(dt, input) {
  var n, car, carsFinished = 0;
  // var carLaps = [];
  for(n = 0 ; n < Common.cars.length ; n++) {
    car = Common.cars[n];
    car.move(dt, input);
    if(car.finished) carsFinished++;
    // carLaps.push(car.lap);
  }
  // console.log(carLaps);
  //if(carsFinished == Common.numRacers) Common.raceActive = false;
}

racer.findSegment = function (z) {
  return Common.segments[Math.floor(z/Common.segmentLength) % Common.segments.length]; 
}

// Takes the index of the car you are trying to get the place of (0 for you)
// Should only be used singly (don't call this in a loop for all players, because that's stupidly inefficient
racer.getPlace = function(index) {
  var you = Common.cars[index], opponent;
  var place = 1;
  for(var n = 0 ; n < Common.cars.length ; n++) {
    if(n == index) continue;
    opponent = Common.cars[n];
    if(opponent.lap > you.lap || (opponent.lap == you.lap && opponent.car.z > you.car.z)) place++;
  }
  return place;
}

//=========================================================================
// BUILD ROAD GEOMETRY
//=========================================================================

function lastY() { return (Common.segments.length == 0) ? 0 : Common.segments[Common.segments.length-1].p2.world.y; }

function addSegment(curve, y) {
  var n = Common.segments.length;
  Common.segments.push({
      index: n,
         p1: { world: { y: lastY(), z:  n   *Common.segmentLength }, camera: {}, screen: {} },
         p2: { world: { y: y,       z: (n+1)*Common.segmentLength }, camera: {}, screen: {} },
      curve: curve,
    sprites: [],
       cars: [],
      color: Math.floor(n/Common.rumbleLength)%2 ? Common.COLORS.DARK : Common.COLORS.LIGHT
  });
}

racer.addSprite = function(n, sprite, offset,collidable) {
    collidable = collidable && true;
    Common.segments[n].sprites.push({ source: sprite, x: offset, collidable: collidable });
};

function addRoad(enter, hold, leave, curve, y) {
  var startY   = Math.round(lastY());
  var endY     = Math.round(startY + (Util.toInt(y, 0) * Common.segmentLength));
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
  addRoad(num, num, num, -ROAD.CURVE.EASY, Math.round(-lastY()/Common.segmentLength));
}

function resetRoad() {
  Common.segments = [];

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

  //TODO: make a better finish line
  for(var n = 0 ; n < Common.rumbleLength*3 ; n++) {
    var rumble = (Common.segments.length-1+n)%Common.segments.length;
    var grassColor = Common.segments[rumble].color.grass;
    var colors = jQuery.extend({},rumble%2 == 0 ? Common.COLORS.FINISH : Common.COLORS.START);
    colors.grass = grassColor;
    Common.segments[rumble].color = colors;
  }

  Common.trackLength = Common.segments.length * Common.segmentLength;
}

function resetSprites() {
  var n, i;

  for(n=20;n<=180;n+=40) {
    racer.addSprite(n,  Common.SPRITES.BILLBOARD, -1.4);
  }

    racer.addSprite(240,                    Common.SPRITES.BILLBOARD, -1.4);
    racer.addSprite(240,                    Common.SPRITES.BILLBOARD,  1.4);
    racer.addSprite(Common.segments.length - 25, Common.SPRITES.BILLBOARD, -1.4);
    racer.addSprite(Common.segments.length - 25, Common.SPRITES.BILLBOARD,  1.4);

  for(n = 10 ; n < 200 ; n += 4 + Math.floor(n/100)) {
    racer.addSprite(n, Common.SPRITES.PALM_TREE, .9 + Math.random()*0.5);
    racer.addSprite(n, Common.SPRITES.PALM_TREE,   1.1 + Math.random()*2);
  }

  for(n = 250 ; n < 1000 ; n += 5) {
    racer.addSprite(n,     Common.SPRITES.COLUMN, 1.2);
    racer.addSprite(n + Util.randomInt(0,5), Common.SPRITES.TREE1, -1.2 - (Math.random() * 2));
    racer.addSprite(n + Util.randomInt(0,5), Common.SPRITES.TREE2, -1.2 - (Math.random() * 2));
  }

  for(n = 200 ; n < Common.segments.length ; n += 3) {
    racer.addSprite(n, Util.randomChoice(Common.SPRITES.PLANTS), Util.randomChoice([1,-1]) * (2 + Math.random() * 5));
  }

  var side, sprite, offset;
  for(n = 1000 ; n < (Common.segments.length-50) ; n += 100) {
    side      = Util.randomChoice([1.4, -1.4]);
    racer.addSprite(n + Util.randomInt(0, 50), Util.randomChoice(Common.SPRITES.BILLBOARDS), -side);
    for(i = 0 ; i < 20 ; i++) {
      sprite = Util.randomChoice(Common.SPRITES.PLANTS);
      offset = side * (1.5 + Math.random());
      racer.addSprite(n + Util.randomInt(0, 50), sprite, offset);
    }
  }
}

//=========================================================================
// THE GAME LOOP
//=========================================================================

racer.reset = function (options) {
  options       = options || {};

  if ((Common.segments.length==0) || (options.segmentLength) || (options.rumbleLength))
    resetRoad(); // only rebuild road when necessary
};

return racer;
});