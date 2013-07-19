// A somewhat-human AI for pong!
define([], function () {

var humanAI = (function() {
    var MAX_SPEED = 5; // 10px/frame

    // Puck contains information about the puck
    //    x,y,vx,vy,radius
    // Paddle contains info about the paddles
    //    width, height, offset, startY
    // PlayerNum [1|2], used for determining side
    var ai = function(puck,paddle,playerNum) {
        this.puck = puck;
        this.paddle = paddle;
        this.paddleY = paddle.startY;
        this.pNum = playerNum;

        // Change in y from last step (used for easing)
        this.dy = 0;
        // A random amount that the paddle will be off by
        this.variance = 0;

        // tells you if the puck is moving away from you
        this.movingAway = function() {
            return (this.pNum == 1 && this.puck.vx > 0) || (this.pNum == 2 && this.puck.vx < 0);
        }

        // Update class information
        this.updDelta = function(delta) {
            this.dy = delta;
        }
        this.updPuck = function(puck) {
            this.puck = puck;
        };
        this.updPaddle = function(paddleY) {
            this.paddleY = paddleY;
        };
    };

    ai.prototype = {
        move: function(puck) {
            this.updPuck(puck);
            if(this.movingAway()) {
                this.variance = 0;
                return this.paddleY;
            }
            var delta = Math.max(-MAX_SPEED+0.5*this.dy, Math.min((this.puck.y+this.variance)-this.paddleY, MAX_SPEED+0.5*this.dy));
            if(puck.vy < 20 && this.variance == 0) this.variance = (Math.random() * 20*2 - 20);
            this.updDelta(delta);
            
            return this.paddleY + delta;
        }
    };

    return ai;
})();

return humanAI;
});