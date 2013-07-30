// A template for the player modules in racer (to be used for players, remote players, AI)
define(['games/racer/util','games/racer/common','games/racer/racer.core'], function (Util,Common,Core) {
    var carModule = (function() {
        var racer = function() {
            this.car       = {
                x                : 0,                     // car x offset from center of road (-1 to 1 to stay independent of roadWidth)
                z                : 0,                     // car's absolute Z position
                _z               : 0,                     // last z position
                dx               : 0,                     // current horizontal velocity
                dz               : 0,                     // change in z in this step (slightly different from speed when accounting for turns, etc.)
                speed            : 0,                     // current speed
                percent          : 0,                     // useful for interpolation during rendering phase
                freezeTime       : -1,                    // used to determine if the car has crashed recently
                maxSpeed         : Common.maxSpeed,
                length           : Common.segmentLength*3      // physical length of the car
            };
            this.car.accel       = this.car.maxSpeed/5;

            this.currentLapTime  = 0;                     // current lap time
            this.lapTimes        = [];                    // list of lap times (does not include current lap)
            this.lap             = 0;                     // current lap

            this.sprite    = Util.randomChoice(Common.SPRITES.CARS);           //
            this.playerW   = Common.SPRITES.CAR_STRAIGHT.w * Common.SPRITES.SCALE;  // width of the car
            this.place     = null;                                        // position in the race, calculated each step
            this.finished  = false;                                       // boolean whether the given player is finished
            this.isYou     = false;                                       // used to determine that you are the player
            this.input     = {};                                          // inputs (used for human modules)
        };

        racer.prototype = {
            setPlayerNum : function(playerNum) {
                this.pNum  = playerNum;
                this.car.x = (playerNum%Common.lanes - 1)*2/3; // Lines players up at -2/3, 0, 2/3
                this.car.z = (Common.trackLength - 1 - Math.floor(playerNum/Common.lanes)*Common.segmentLength*5)%Common.trackLength;  //The -1 is to make sure nobody ends up at z=0
                var segment = Core.findSegment(this.car.z);
                segment.cars.push(this);
                this.car.percent = Util.percentRemaining(this.car.z, Common.segmentLength);
            },
            move: function(dt,input) {
                if(this.isYou) this.setInput(input);
                if(this.car.freezeTime < 0) {
                    this.regulate();
                    var oldSegment = Core.findSegment(this.car.z);
                    this.accelerate(dt);
                    this.regulate();
                    this.steer(dt);
                    this.regulate();
                    this.adjustCentrifugal(dt);
                    var newSegment = Core.findSegment(this.car.z);

                    if ((this.car.x < -1) || (this.car.x > 1)) {
                        if (this.car.speed > Common.offRoadLimit) this.car.speed = Util.accelerate(this.car.speed, Common.offRoadDecel, dt);
                        this.checkTerrainCollisions(newSegment);
                    }
                    this.checkCarCollisions(newSegment);
                    this.regulate();

                    newSegment  = Core.findSegment(this.car.z);  //reassess after checking for collisions
                    this.car.percent = Util.percentRemaining(this.car.z, Common.segmentLength);
                    if (oldSegment != newSegment) {
                        var index = oldSegment.cars.indexOf(this);
                        oldSegment.cars.splice(index, 1);
                        newSegment.cars.push(this);
                    }
                } else if(this.car.freezeTime == 0) {
                    this.resetCar();
                } else {
                    this.car.freezeTime--;
                }

                if(!this.finished) {           //don't track once done, but you can still drive around
                    if(this.isYou) this.place = Core.getPlace(0);
                    if (this.lap > 0 && (this.car._z > this.car.z)) {  // hackish way to prevent double-counting
                        this.lapTimes.push(this.currentLapTime);
                        this.lap++;
                        if(this.lap > Common.numLaps) {
                            this.finished = true;
                        }
                        else {
                            this.currentLapTime = 0;
                        }
                    } else if(this.lap == 0 && (this.car._z > this.car.z)) {
                        this.lap++;
                    }
                    else {
                        this.currentLapTime += dt;
                    }
                }
                // if(this.pNum == 0) console.log("[Z] " + tamp, this.car.z);
            },
            adjustCentrifugal : function(dt) {
                var speedPercent  = this.car.speed/Common.maxSpeed;
                var dx            = 2*speedPercent*dt;
                var dz            = this.car.z - this.car._z;
                if(dz < 0)    dz += Common.trackLength; // woops
                var sign          = Common.playerSegment.curve < 0 ? -1 : 1;

                var outwardForce = dx * Common.playerSegment.curve / Common.centrifugal;
                this.car.x = this.car.x - outwardForce;

                var xoff          = Math.abs(sign - this.car.x);
                var zoff          = dz * 0.03 * Math.pow(Math.abs(Common.playerSegment.curve),1/3) * xoff;  //Adjust for a little longer distance traveled
                if(!this.input.drift) this.car.z  -= zoff;
                if(this.car.z < 0) this.car.z = Common.trackLength - this.car.z;
            },
            checkTerrainCollisions : function(segment) {
                for(var n = 0 ; n < segment.sprites.length ; n++) {
                    var sprite  = segment.sprites[n];
                    var spriteW = sprite.source.w * Common.SPRITES.SCALE;
                    if (Util.overlap(this.car.x, this.playerW, sprite.x + spriteW/2 * (sprite.x > 0 ? 1 : -1), spriteW)) {
                        this.car.freezeTime = Math.floor(Common.fps*(1 + this.car.speed/this.car.maxSpeed));     // Player draw function uses this value to determine explosions
                        this.car.speed = 0;
                        this.car.z = this.car._z;
                        break;
                    }
                }
            },
            checkCarCollisions : function(segment) {
                for(var n = 0 ; n < segment.cars.length ; n++) {
                    var opponent  = segment.cars[n];
                    var carW = opponent.sprite.w * Common.SPRITES.SCALE;
                    if (this.car.speed > opponent.car.speed && this.car.z < opponent.car.z) {
                        if (Util.overlap(this.car.x, this.playerW, opponent.car.x, carW, 1)) {
                            var vi = this.car.speed;
                            this.car.speed     = opponent.car.speed/3;  // slow you relative to them
                            opponent.car.speed += vi/5;                 // give them some of your momentum
                            this.car.z = this.car._z;
                            break;
                        }
                    }
                }
            },
            resetCar : function() {
                this.car.x = 0;
                this.car.dx = 0;
                this.car.speed = 0;
                this.car.freezeTime = -1;
            },
            regulate : function() {
                this.car.x = Util.limit(this.car.x, -3, 3);                 // don't ever let it go too far out of bounds
                this.car.speed = Util.limit(this.car.speed, 0, Common.maxSpeed); // or exceed maxSpeed
            },
            getFastestLap : function() {
                return Math.max.apply(Math, this.lapTimes);
            },
            setInput : function(input) {
                this.input = input;
            },

            accelerate : function(dt) {},
            steer : function(dt) {}
        };

        return racer;
    })();

    return carModule;
});