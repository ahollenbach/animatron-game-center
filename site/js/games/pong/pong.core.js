define(['player'], function(Player) {
	var Pong = (function() {
		//=============================================================================
		// World Dimensions
		//=============================================================================
	    const WIDTH = 600;
	    const HEIGHT = 450;

	    //=============================================================================
	    // Puck Physics
	    //=============================================================================
	    const DEFAULT_SPEED 		= 600; 		  // pixels per second
		const DEFAULT_ANGLE 		= Math.PI/6   // default starting angle
		const DEFAULT_SPEED_MULT 	= 1.01;       // By default how quickly puck speeds up
		const MAX_BOUNCE_ANGLE 		= Math.PI/3;  // 60 degrees

	    var c = function() {
	        // Private variables
	        var player1 = b('player1');
	        var player2 = b('player2');

	        var puck = b('puck');

	        // Private functions
	        function toComponentVectors(speed,angle) {
				return {
					vx: speed*Math.cos(angle),
					vy: speed*Math.sin(angle)
				}
			}

			function getRandVelocity(firstTime) {
				var angle = Math.random() * DEFAULT_ANGLE*2 - DEFAULT_ANGLE; //-30 to 30 degrees
				angle = (Math.random() > .5 ? angle : Math.PI-angle); //make half go one way, half the other
				if(firstTime) angle = 0;
				return toComponentVectors(DEFAULT_SPEED,angle) //TODO: switch 0 back to angle (testing purposes)
			}

			//resets the puck to the center and gives it a random velocity
			function resetPuck() {
				var velocity = getRandVelocity();
				puck.data({
					x : 0, 
					y : 0,
					vx : velocity.vx, 
					vy : velocity.vy,
					radius : puck.data().radius
				});

				// TODO: Send new puck velocity to clients
			}

			// Public variables

			// Public functions
	        
	    };

	    return c;
	})();
});