// A basic AI implementation for the racing game
define(['games/racer/util','games/racer/common','games/racer/racer.core','games/racer/playerModule'], function (Util,Common,Core,PlayerModule) {

    var basicAI = (function() {
        var player = function() {
            this.constructor.super.call(this);

            this.car.maxSpeed = Math.random()*Common.maxSpeed*0.07 + 0.95*Common.maxSpeed;
            this.car.accel    = this.car.maxSpeed/10 + Math.random()*this.car.maxSpeed/5;
        };
        Util.inherit(player, PlayerModule);

        player.prototype.steer = function(dt) {
            var i, j, dir, segment, otherCar, otherCarW, lookAhead = 20, carW = this.sprite.w * Common.SPRITES.SCALE;
            var dx = 0;
            var carSegment = Core.findSegment(this.car.z);

            for(i = 1 ; i < lookAhead ; i++) {
                segment = Common.segments[(carSegment.index+i)%Common.segments.length];

                for(j = 0 ; j < segment.cars.length ; j++) {
                    otherCar  = segment.cars[j];
                    otherCarW = otherCar.sprite.w * Common.SPRITES.SCALE;
                    if ((this.car.speed > otherCar.car.speed) && Util.overlap(this.car.x, carW, otherCar.car.x, otherCarW, 1.2)) {
                        if (otherCar.car.x > 0.5)
                            dir = -1;
                        else if (otherCar.car.x < -0.5)
                            dir = 1;
                        else
                            dir = (this.car.x > otherCar.car.x) ? 1 : -1;
                        dx = dir * 1/i * (this.car.speed-otherCar.car.speed)/Common.maxSpeed;
                    }
                }
            }

            // if no cars ahead, but I have somehow ended up off road, then steer back on
            if (this.car.x < -0.9 && dx == 0)
                dx = 0.1;
            else if (this.car.x > 0.9 && dx == 0)
                dx = -0.1;

            // negate centrifugal force. TODO: this is just a temporary solution
            var outwardForce = (2*this.car.speed/Common.maxSpeed*dt) * Common.playerSegment.curve / Common.centrifugal;
            this.car.x = this.car.x + outwardForce;

            this.car.x += dx;
        };
        player.prototype.accelerate = function(dt) {
            this.car._z = this.car.z;
            this.car.z  = Util.increase(this.car.z, dt * this.car.speed, Common.trackLength);
            this.car.speed = Util.accelerate(this.car.speed, this.car.accel, dt);
        };

        return player;
    })();

    return basicAI;
});