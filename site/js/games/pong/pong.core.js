var Animatron = require('hardcore');

// Animatron aliases
var b = Animatron.Builder._$, var C = Animatron.anm.C;

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

	const COLOR = "#000";

	var c = function(x, y, radius) {
		// Private variables

		// Private functions

		// Public variables
		this.x = x;
		this.y = y;
		this.vx = 0;
		this.vy = 0;
		this.radius = radius;

		this.speedMultiplier = DEFAULT_SPEED_MULT;

		this.element = b('puck')
			.circle([this.x, this.y], this.radius)
				.fill(COLOR);

		// Public functions
	};

	// Public static functions
	c.getRandomVelocity = function() {
		var angle = Math.random() * DEFAULT_ANGLE*2 - DEFAULT_ANGLE;  //-default -> default
		angle = (Math.random() > .5 ? angle : Math.PI-angle);
		return Util.toComponentVectors(DEFAULT_SPEED,angle)
	};

	c.prototype = {
		updatePosition : function(dt) {
			this.x += this.vx * dt;
			this.y += this.vy * dt;

			// Data implementation will be used if we separate physics loop
			// this.element.data({
			// 	x : this.x, 
			// 	y : this.y
			// });

			this.element.v.x = this.x;
			this.element.v.y = this.y;
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
					bounceAgainstPaddle(direction);
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
	const COLORS = ["#BB0000", "#0088BB"];

	var paddleId = 1;

	var c = function(x, y) {
		// Private variables

		// Private functions
		function convertY(yPos) {
			return yPos - this.startY;
		};

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

		this.element = b('paddle' + paddleId)
			.rect([this.x, this.startY], [this.width, this.height])
				.fill(COLORS[paddleId - 1]);
		this.element.v.reactAs(
			Builder.path([
				[(paddleId == 1 ? 1 : -1) * this.width / 2, -this.height / 2], 
				[(paddleId == 1 ? 1 : -1) * this.width / 2, this.height / 2]
			])
		);	
		paddleId++;		

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

var GamePlayer = (function() {

	var c = function(gameInstance, playerInstance) {
		this.instance = playerInstance;
		this.game = gameInstance;

		this.userid;
		this.inputs = [];

		// Private Variables
		var points = 0;

		// TODO: Fix this constructor
		var paddle = new Paddle();

		this.setX = function(value) { paddle.x = value; };
		this.getX = function() { return paddle.x; };

		this.setY = function(value) { paddle.y = value; };
		this.getY = function() { return paddle.y; };

		this.getElement = function() { return paddle.element; };
		this.getElementState = function() { return paddle.element.v; };

		this.getStartY = function() { return paddle.startY; };

		this.addPoint = function() { points++; };
		this.getPoints = function() { return points; };
		this.resetPoints = function() { points = 0; };
	}

	return c;
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

		this.lastScoreTime = 0;

		this.step = 1 / 60;
		this.t;
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

		var p1ScoreText = b('p1ScoreText'); 
		var p2ScoreText = b('p2ScoreText');
		var scoredText = b('scoredText');

		var overlayButton = b("overlayButton")
			.rect([canvas.width/2, canvas.height/2], [200, 100])
			.fill(overlayButtonColor)
			.add(generateText(b('startButton'),[-42,-22],"START",{color: '#111'}))
			.on(C.X_MCLICK, function(evt,t) {
				if(gameMode == GAME_MODE.networked) 
					socketConnection.emit('confirmation');
				else if(gameMode == GAME_MODE.versusAI) {
					ai.setPlayerNum(0);
					if(!puckElem.v.disabled) pong.startGame(1);
					else resetGame();
				}

				overlay.alpha([t,t+1], [.9,0]) //fade to transparent for 1s, then stay that way
				overlay.alpha([t+1,SENTINEL], [0,0])
				//overlay.disable();
				overlayButton.disable();
				//hide cursor
				canvas.style.cursor = 'none';
			});

		var scene = b('scene')
			.add(this.players.self.paddle.element)
			.add(this.players.other.paddle.element)
			.add(this.puck.element)
			.add(
				generateText(
					p1ScoreText, 
					[this.world.width * 0.25, 50], 
					this.players.self.getPoints()))
			.add(
				generateText(
					p2ScoreText,
					[this.world.width * 0.75, 50],
					this.players.others.getPoints()))
			.add(scoredText);

		this.animatronPlayer = Animatron.createPlayer('game-canvas', {
			//"debug"  : true,
			"mode" : C.M_DYNAMIC,
			"anim" : {
				"fps": 50, //doesn't actually work
				"width" : canvas.width,
				"height" : canvas.height,
				"bgcolor" : { color : "#F6F6F6" }
			} 
		}).load(scene);
		
		scene.add(overlay);
		scene.add(overlayButton);
		this.animatronPlayer.play();
	};

	c.prototype = {
		//=============================================================================
		// Common Functions
		//=============================================================================
		update : function(t) {
			this.t = t;
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
		handleScore : function(player) {
			this.lastScoreTime = this.t;

			if (this.server)
				this.serverHandleScore(player);
			else
				this.clientHandleScore(player);
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
		serverUpdate : function() {
			this.serverHandleInput();

			// Called in the same loops since physics is merged with main loop
			this.serverUpdatePhysics();

			this.lastState = {
				hostPosition : {
					x : this.players.self.getX(),
					y : this.players.self.getY()
				},
				clientPosition : {
					x : this.players.other.getX(),
					y : this.players.other.getY()
				},
				timeStamp : (new Date()).getTime();
			};

			if (this.scored) {
				lastState.scored = this.scored;
				this.scored = null;
			}

			if (this.players.self.instance) 
				this.players.self.instance.emit('state', this.lastState);

			if (this.players.other.instance)
				this.players.other.instance.emit('state', this.lastState);
		},
		serverUpdatePhysics : function() {
			// Player 1
			this.players.self.storeState();
			var newY = this.processInput(this.players.self);
			this.players.self.setY(newY);

			// Player 2
			this.players.other.storeState();
			newY = this.processInput(this.players.other);
			this.players.other.setY(newY);

			var scoringPlayer = this.puck.checkBounds();
			if (scoringPlayer) {
				this.handleScore(scoringPlayer == 1 ? player.self.userid : player.other.userid);
			} else {
				// Check for collisions with puck using "collides"
				this.players.self.getElementState().collides(this.puck.element.v, function() {
					this.puck.bounce(Direction.LEFT);
				});
				this.players.other.getElementState().collides(this.puck.element.v, function(){
					this.puck.bounce(Direction.RIGHT);
				});
			}			

			// Clear inputs
			this.players.self.inputs = [];
			this.players.other.inputs = [];
		},
		serverHandleInput : function(client, y, timeStamp) {
			var playerClient = (client.userid == this.players.self.instance.userid) ?
				this.players.self :
				this.players.other;

			playerClient.inputs.push({ y : y, timeStamp : (new Date()).getTime() });
		},
		serverHandleScore : function(playerId) {
			// Send new puck velocity to players
			this.scored = {
				player : playerId,
				newVelocity : Puck.getRandomVelocity()
			};
		},
		//=============================================================================
		// Client Side Functions
		//=============================================================================
		clientUpdate : function() {
			this.clientHandleInput();

			this.clientUpdatePhysics();
		},
		clientUpdatePhysics : function() {
			this.players.self.storeState();
			var newY = this.processInput(this.players.self);
			this.players.self.setY(newY);

			// TODO: Update puck location
		},
		clientHandleInput : function() {
			this.players.self.inputs.push({
				y : Util.clamp(this.mousePosition.y) - 
					this.players.self.getStartY().
				timeStamp : (new Date()).getTime();
			});
		},
		clientHandleScore : function(playerId) {
			// Currently does nothing, the score will be registered when the server
			// comes to the same conclusion.

			// Only send that point was scored if you scored the goal
			// if (this.userid == playerId) {
			// 	puck.element.alpha([this.t, this.t + 1], [0, 1]);
			// 	// this.scored = this.userid;

			// 	// TODO: Call to update score hud
			// }

			// Pause game and wait for server response
			// this.socket.emit()
		}
		clientConnectToServer : function() {
			// Make connection to server
			this.socket = io.connect(window.location.origin + "/game");

			this.socket.on('start', this.clientOnStart.bind(this));
			this.socket.on('state', this.clientOnState.bind(this));
		},
		// TODO: Fix params
		clientOnStart : function(params) {

		},
		// TODO: Fix params
		clientOnState : function(state) {

		}
	}

	return c;
}();

if (typeof global !== 'undefined')
	exports = PongCore;