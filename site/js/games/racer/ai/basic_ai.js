// A basic AI implementation for the racing game
define(['games/racer/util','games/racer/common','games/racer/racer.core','games/racer/playerModule'], function (Util,C,Core,PlayerModule) {

    var basicAI = (function() {
        var player = function() {
            this.constructor.super.call(this);

            this.car.maxSpeed = Math.random()*C.maxSpeed*0.07 + 0.95*C.maxSpeed;
            this.car.accel    = this.car.maxSpeed/10 + Math.random()*this.car.maxSpeed/5;
        };
        Util.inherit(player, PlayerModule);

        player.prototype.steer = function(dt) {
            var i, j, dir, segment, otherCar, otherCarW, lookAhead = 20, carW = this.sprite.w * C.SPRITES.SCALE;
            var dx = 0;
            var carSegment = Core.findSegment(this.car.z);

            for(i = 1 ; i < lookAhead ; i++) {
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
                        dx = dir * 1/i * (this.car.speed-otherCar.car.speed)/C.maxSpeed;
                    }
                }
            }

            // if no cars ahead, but I have somehow ended up off road, then steer back on
            if (this.car.x < -0.9 && dx == 0)
                dx = 0.1;
            else if (this.car.x > 0.9 && dx == 0)
                dx = -0.1;

            // negate centrifugal force. TODO: this is just a temporary solution
            var outwardForce = (2*this.car.speed/C.maxSpeed*dt) * C.playerSegment.curve / C.centrifugal;
            this.car.x = this.car.x + outwardForce;

            this.car.x += dx;
        };
        player.prototype.accelerate = function(dt) {
            this.car._z = this.car.z;
            this.car.z  = Util.increase(this.car.z, dt * this.car.speed, C.trackLength);
            this.car.speed = Util.accelerate(this.car.speed, this.car.accel, dt);
        };

        return player;
    })();

    return basicAI;
});