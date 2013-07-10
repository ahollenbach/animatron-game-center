// A basic AI implementation for the racing game
define(['games/racer/util','games/racer/common'], function (Util,C) {

var basicAI = (function() {
    var ai = function() {
        this.maxSpeed = Math.random()*C.maxSpeed*0.15 + 0.9*C.maxSpeed;
        this.curSpeed = 0;

        this.setPlayerNum = function(playerNum) {
            this.pNum = playerNum;
        }
    };

    ai.prototype = {
        move: function() {
            return this.puck.y;
        }
    };

    return ai;
})();

return basicAI;
});