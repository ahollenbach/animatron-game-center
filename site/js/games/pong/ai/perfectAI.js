// An impossible-to-beat AI for pong!
//
// Author: Andrew Hollenbach

var ai_perfect = (function() {
    // puck contains information about the puck
    // x,y,vx,vy,radius
    var ai = function(puck,paddle) {
        this.puck = puck;
        this.paddle = paddle;
        this.paddleY = paddle.startY;

        this.setPlayerNum = function(playerNum) {
            this.pNum = playerNum;
        }

        this.movingAway = function() {
            return (this.pNum == 1 && this.puck.vx > 0) || (this.pNum == 2 && this.puck.vx < 0);
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
            return this.puck.y;
        }
    };

    return ai;
})();