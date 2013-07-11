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
	var paddleId = 0;

	var c = function(x, y) {
		// Private variables

		// Private functions
		function convertY(yPos) {
			return yPos - this.startY;
		}

		// Public variables
		this.x = x;
		this.y = y;
		this.width = 14;
		this.height = 80;
		this.offset = 10;        // Space between wall and paddle
		this.startY = y;         // Initial Y (for frame of reference)

		this.oldState;

		this.minY = this.height/2;
		this.maxY = HEIGHT - this.height/2;

		this.element;
		// TODO: Define element here

		// Public functions
		this.storeState = function() {
			this.oldState = {
				x : this.x, 
				y : this.y
			};
		};
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

var GamePlayer (function() {

	var c = function(gameInstance, playerInstance) {
		this.instance = playerInstance;
		this.game = gameInstance;

		this.userid;
		this.inputs = [];

		// TODO: Fix this constructor
		this.paddle = new Paddle();
	}

})();

var PongCore = (function() {

	var c = function(gameInstance) {
		this.instance = gameInstance;

		this.server = this.instance !== undefined;

		this.world = {
			width : 600, 
			height : 450
		};

		this.world.halfWidth = this.world.width / 2;
		this.world.halfHeight = this.world.height / 2;

		if (this.server) {
			this.players = {
				self : new GamePlayer(this, this.instance.host),
				other : new GamePlayer(this, this.instance.client)
			};


		} else  {
			this.players = {
				self : new GamePlayer(this),
				other : new GamePlayer(this)
			};

			// TODO: Differentiation between player 1 and two and their respective sides
		}

		// TODO: Fix constructor
		this.puck = new Puck();

		this.step = 1 / 60;
		this.dt;
		this.gdt = 0;

		if (!this.server) {
			this.viewport;
			this.mousePosition;

			window.addEventListener(function(e) {
				if (this.viewport) {
					var rect = canvas.getBoundingClientRect();
				    this.mousePosition = {
				    	x : e.clientX - rect.left,
				    	y : e.clientY - rect.top
				    };
				}
			});

			this.clientConnectToServer();
		}
	};

	c.prototype = {
		//=============================================================================
		// Common Functions
		//=============================================================================
		update : function(t) {
			this.dt = t - this._._appliedAt;
			this.gdt += dt;

			while (this.gdt >= this.step) {
				this.gdt -= this.step;

				if (this.server)
					this.serverUpdate();
				else
					this.clientUpdate();
			}
		},
		// updatePhysics : function(t) {
		// 	this.dt = t - this._._appliedAt;
		// 	this.gdt += dt;

		// 	while (this.gdt >= this.step) {
		// 		this.gdt -= this.step;

		// 		if (this.server)
		// 			this.serverUpdatePhysics();
		// 		else
		// 			this.clientUpdatePhysics();
		// 	}
		// },
		//=============================================================================
		// Server Side Functions
		//=============================================================================
		serverUpdatePhysics : function() {
			// Player 1
			this.players.self.storeState();
			var newY = this.processInput(this.players.self);
			this.players.self.y = newY;

			// Player 2
			this.players.other.storeState();
			newY = this.processInput(this.players.other);
			this.players.other.y = newY;

			// Check for collisions with puck using "collides"

			// Clear inputs
			this.players.self.inputs = [];
			this.players.other.inputs = [];
		},
		serverUpdate : function() {
			this.lastState = {
				hostPosition : {
					x : this.players.self.x,
					y : this.players.self.y
				},
				clientPosition : {
					x : this.players.other.x,
					y : this.palyers.other.y
				},
				timeStamp : (new Date()).getTime();
			};

			if (this.players.self.instance) 
				this.players.self.instance.emit('server_update', this.lastState);

			if (this.players.other.instance)
				this.players.other.instance.emit('server_update', this.lastState);
		},
		serverHandleInput : function(client, y, timeStamp) {
			var playerClient = (client.userid == this.players.self.instance.userid) ?
				this.players.self :
				this.players.other;

			playerClient.inputs.push({ y : y, time : (new Date()).getTime() });
		},
		//=============================================================================
		// Client Side Functions
		//=============================================================================
		clientUpdate : function() {

		},
		clientUpdatePhysics : function() {
			this.players.self.storeState();
			var newY = this.processInput(this.players.self);
			this.players.self.y = newY;

			// TODO: Update puck location
		},
		clientHandleInput : function() {

		},
		clientConnectToServer : function() {
			// Make connection to server
			this.socket = io.connect(window.location.origin + "/game");

			this.socket.on('start', this.clientOnStart.bind(this));
			this.socket.on('state', this.clientOnState.bind(this));
		}
	}

	return c;
}();