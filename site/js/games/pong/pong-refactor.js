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

const Direction = {
	TOP : "top",
	BOTTOM : "bottom",
	LEFT : "left",
	RIGHT : "right"
};

var paddles = [];

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
		this.x = x;
		this.y = y;
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
		checkBounds : function() {
			if(this.y - this.radius < -HEIGHT/2)     bounce(Direction.TOP)
			else if(this.y + this.radius > HEIGHT/2) bounce(Direction.BOTTOM)

			if (this.x - this.radius < -WIDTH/2 || this.x + this.radius > WIDTH/2) {
				var scoringPlayer = (puck.x - puck.radius < -canvas.width/2) ? 2 : 1;
				return scoringPlayer;
			}
			return null;
		}
		bounce : function(direction) {
			switch (direction) {
				case Direction.TOP: 
					this.y = -HEIGHT / 2 + this.radius;
				case Direction.BOTTOM:
					if (direction == Direction.BOTTOM)
						this.y = HEIGHT / 2 - this.radius;
					this.vy *= -1;
					break;
				case Direction.LEFT:
				case Direction.RIGHT:
					bouncePaddle(direction);
			}
			this.vx *= this.speedMultiplier;
			this.vy *= this.speedMultiplier;
		},
		bounceAgainstPaddle : function(direction) {
			var playerNum = direction == Direction.LEFT ? 0 : 1;
			var paddle = paddles[playerNum];

			var relIntersect = (paddle.y - this.y) / (paddle.height/2 + this.radius); //distance of puck center from paddle center+puckradius
			var bounceAngle = -relIntersect * MAX_BOUNCE_ANGLE;
			var curPuckSpeed = Math.sqrt(Math.pow(this.vx,2) + Math.pow(this.vy,2)); //a^2+b^2=c^2
			if(playerNum == 1) bounceAngle = Math.PI - bounceAngle; //reverse direction
			var vNew = toComponentVectors(curPuckSpeed,bounceAngle);
			this.vx = vNew.vx;
			this.vy = vNew.vy;

			collided = true;
		},
		getRandVelocity : function() {
			var angle = Math.random() * DEFAULT_ANGLE*2 - DEFAULT_ANGLE;  //-default -> default
			angle = (Math.random() > .5 ? angle : Math.PI-angle);
			return Util.toComponentVectors(DEFAULT_SPEED,angle)
		},
		reset : function(vx, vy) {
			this.x 	= 0;
			this.y 	= 0;
			this.vx	= vx;
			this.vy	= vy;
		}
	};

	return c;
})();

var Paddle = (function() {

	var c = function(x, y, width, height, element) {
		// Private variables

		// Private functions
		function convertY(yPos) {
			return yPos - this.startY;
		}

		// Public variables
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.offset = 10;        // Space between wall and paddle
		this.startY = y;         // Initial Y (for frame of reference)

		this.minY = this.height/2;
		this.maxY = HEIGHT - this.height/2;

		this.element = element;

		// Public functions
	};

	c.prototype = {
		updatePosition : function(mouseY) {
			this.y = Util.clamp(this.minY, this.convertY(mouseY), this.maxY);

			this.element.data({
				y : this.y
			});
		},
	};

	return c;
})();

var Util = {
	toComponentVectors : function(speed,angle) {
		return {
			vx: speed*Math.cos(angle),
			vy: speed*Math.sin(angle)
		}
	},
	clamp : function(min, x, max) {
		return Math.max(min, Math.min(x, max));
	}
}