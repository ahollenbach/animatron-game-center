// var Vector = (function() {

// 	var c = function(x, y) {
// 		// Public variables
// 		this.x;
// 		this.y;

// 		try {
// 			if (x && !y || y && !x)
// 				throw "Invalid vector definition: (" + x + ", " + y + ")";

// 			this.x = x || 0;
// 			this.y = y || 0;
// 		} catch (e) {
// 			console.error(e);
// 		}
// 	};

// 	c.fromMagnitudeAngle = function(magnitude, angle) {
// 		return new c(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
// 	};

// 	c.prototype = {
// 		multiplyScalar : function(scalar) {
// 			this.x *= scalar;
// 			this.y *= scalar;
// 			return this;
// 		},
// 		reflectX : function() {
// 			this.x *= -1;
// 			return this;
// 		},
// 		reflectY : function() {
// 			this.y *= -1;
// 			return this;
// 		}
// 	};

// 	return c;
// })();

const WIDTH = 600;
const HEIGHT = 450;

var Direction = {
	TOP : "top",
	BOTTOM : "bottom",
	LEFT : "left",
	RIGHT : "right"
};

var Puck = (function() {
	/**************************PUCK PHYSICS**************************/
	//default speed multiplier for puck
	const DEFAULT_SPEED 		= 600; 		  // pixels per second
	const DEFAULT_ANGLE 		= Math.PI/6   // default starting angle
	const DEFAULT_SPEED_MULT 	= 1.01;       // By default how quickly puck speeds up
	const MAX_BOUNCE_ANGLE 		= Math.PI/3;  // 60 degrees


	var c = function(x, y, radius, element) {
		// Private variables

		// Private functions

		// Public variables
		this.x = 0;
		this.y = 0;
		this.vx = 0;
		this.vy = 0;
		this.radius = radius;

		this.element = element;
		this.speedMultiplier = DEFAULT_SPEED_MULT;

		// Public functions
	};

	c.prototype = {
		updatePosition : function(dt) {
			this.x += this.vx * dt;
			this.y += this.vy * dt;

			this.element.data({
				x : this.x, 
				y : this.y
			});
		},
		bounce : function(direction) {
			switch (direction) {
				case Direction.TOP:
					this.y = -HEIGHT / 2 + this.radius;
				case Direction.BOTTOM:
					if (direction == Direction.BOTTOM)
						this.y = HEIGHT / 2 - this.radius;
					this.vx *= this.speedMultiplier;
					this.vy *= -this.speedMultiplier;
					break;
				case Direction.LEFT:
				// TODO: finish this
			}
		},
		reset : function(vx, vy) {

		}
	};

	return c;
})();

var Paddle = (function() {

})();