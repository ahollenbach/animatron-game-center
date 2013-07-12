// A basic AI implementation for the racing game
define(['games/racer/util','games/racer/common','games/racer/racer.core'], function (Util,C,racer) {

var humanPlayer = (function() {
    var player = function() {
        this.maxSpeed = C.maxSpeed;
        this.accel    = this.maxSpeed/5;
        this.car = jQuery.extend(true, {}, C.carDefault);
        this.car.speed = 0;
        this.sprite = Util.randomChoice(C.SPRITES.CARS);

        this.setPlayerNum = function(playerNum) {
            this.pNum  = playerNum;
            this.car.x = (playerNum%C.lanes - 1)*2/3; // Lines players up at -2/3, 0, 2/3
            this.car.z = (C.trackLength-Math.floor(playerNum/C.lanes)*C.segmentLength*2)%C.trackLength;
            segment = racer.findSegment(this.car.z);
            segment.cars.push(this);
        }
    };

    player.prototype = {
        move: function(dt) {
            oldSegment  = racer.findSegment(this.car.z);
            if(this.car.speed < this.maxSpeed) this.car.speed += this.accel*dt;
            this.car._z      = this.car.z;
            this.car.z       = (this.car.z + dt * this.car.speed)% C.trackLength;
            this.car.x       = this.car.x + this.steer(oldSegment);
            this.car.percent = Util.percentRemaining(this.car.z, C.segmentLength); // useful for interpolation during rendering phase
            newSegment       = racer.findSegment(this.car.z);
            if(this.car.z < this.car._z && this.car.currentLapTime > 10) {   // basically, a hack to avoid new lap at the beginning of the race
                this.car.lap++;
                this.car.currentLapTime = 0;
            }

            newSegment  = racer.findSegment(this.car.z);
            if (oldSegment != newSegment) {
              var index = oldSegment.cars.indexOf(this);
              oldSegment.cars.splice(index, 1);
              newSegment.cars.push(this);
            }

            this.car.currentLapTime += dt;
        },
        steer : function(carSegment) {
            var i, j, dir, segment, otherCar, otherCarW, lookahead = 20, carW = this.sprite.w * C.SPRITES.SCALE;

            for(i = 1 ; i < lookahead ; i++) {
                segment = C.segments[(carSegment.index+i)%C.segments.length];

                for(j = 0 ; j < segment.cars.length ; j++) {
                  otherCar  = segment.cars[j];
                  otherCarW = otherCar.sprite.w * C.SPRITES.SCALE;
                  if ((this.car.speed > otherCar.car.speed) && Util.overlap(this.car.x, carW, otherCar.car.x, otherCarW, 1.2)) {
                    if (otherCar.car.x > 0.5)
                      dir = -1;
                    else if (otherCar.car.x < -0.5)
                      dir = 1;
                    else
                      dir = (this.car.x > otherCar.car.x) ? 1 : -1;
                    return dir * 1/i * (this.car.speed-otherCar.car.speed)/C.maxSpeed;
                  }
                }
            }

            // if no cars ahead, but I have somehow ended up off road, then steer back on
            if (this.car.x < -0.9)
                return 0.1;
            else if (this.car.x > 0.9)
                return -0.1;
            else
                return 0;
        }
    };

    return p;
})();

return humanPlayer;
});