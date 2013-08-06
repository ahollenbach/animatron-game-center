if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(['libs/hardcore'], function(Animatron) {

console.log("Animatron print out:");
for (var property in Animatron)
	console.log("- " + property);

if (typeof window !== 'undefined')
	for (var property in window)
		if (property == 'Builder')
			console.log(property);

// Animatron aliases
if (Animatron) {
	var Builder = Animatron.Builder;
	createPlayer = Animatron.anm.createPlayer;
}
else
	var Builder = window.Builder;

var b = Builder._$;
var C = Animatron === undefined ? anm.C : Animatron.anm.C;

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

	var c = function(x, y, radius, world) {
		// Private variables
		var element = b('puck')
			.circle([0, 0], radius)
				.fill(COLOR);

		// Private functions

		// Public variables
		this.x = x;
		this.y = y;
		this.vx = 0;
		this.vy = 0;
		this.radius = radius;
		this.world = world;

		this.speedMultiplier = DEFAULT_SPEED_MULT;

		// Public functions
		this.getElement = function() { return element; };
		this.getElementState = function() { return elemenet.v; };
		this.updateElementData = function() {
			element.data({
				x : this.x,
				y : this.y
			});
		};

		// Setup
		this.updateElementData();
		element.modify(function(t) {
			this.x = this.$.data().x;
			this.y = this.$.data().y;
		});
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

			this.updateElementData();
		},
		checkBounds : function() {
			if(this.y - this.radius < -this.world.halfHeight)     this.bounce(Direction.TOP)
			else if(this.y + this.radius > this.world.halfHeight) this.bounce(Direction.BOTTOM)

			if (this.x - this.radius < -this.world.halfWidth || this.x + this.radius > this.world.halfWidth) {
				var scoringPlayer = (this.x - this.radius < -this.world.halfWidth) ? 2 : 1;
				return scoringPlayer;
			}
			return null;
		},
		bounce : function(direction) {
			switch (direction) {
				case Direction.TOP:
					this.y = -this.world.halfHeight + this.radius;
				case Direction.BOTTOM:
					if (direction == Direction.BOTTOM)
						this.y = this.world.halfHeight - this.radius;
					this.vy *= -1;
					break;
				case Direction.LEFT:
				case Direction.RIGHT:
					this.bounceAgainstPaddle(direction);
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
		setVelocity : function(velocity) {
			this.vx = velocity.x;
			this.vy = velocity.y;
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

	var c = function(world) {
		// Private variables

		// Private functions
		function convertY(yPos) {
			return yPos - this.startY;
		};

		// Public variables
		this.world = world;
		this.width = 14;
		this.height = 80;
		this.offset = 10;        // Space between wall and paddle

		this.x = 0;
		this.y = this.world.halfHeight; 

		this.startY = this.y;         // Initial Y (for frame of reference)

		this.oldState;

		this.minY = this.height/2;
		this.maxY = this.world.height - this.height/2;

		this.element = b('paddle' + paddleId)
			.rect([this.x, this.startY], [this.width, this.height])
				.fill(COLORS[paddleId - 1]);
		this.updateElementData();
		this.element.v.reactAs(
			Builder.path([
				[(paddleId == 1 ? 1 : -1) * this.width / 2, -this.height / 2],
				[(paddleId == 1 ? 1 : -1) * this.width / 2, this.height / 2]
			])
		);
		this.element.modify(function(t) {
			this.x = this.$.data().x;
			this.y = this.$.data().y;
		});
		paddleId++;

		// Public functions
		this.storeState = function() {
			this.oldState = {
				x : this.x,
				y : this.y
			};
		};
	};

	// Public static variables
	c.OFFSET = 10;

	c.prototype = {
		updatePosition : function(mouseY) {
			this.y = Util.clamp(this.convertY(mouseY), this.minY, this.maxY);

			this.updateElementData();			
		},
		updateElementData : function() {
			this.element.data({
				x : this.x,
				y : this.y
			});
		}
	};

	return c;
})();

var Util = {
	toComponentVectors : function(speed,angle) {
		return {
			x: speed*Math.cos(angle),
			y: speed*Math.sin(angle)
		}
	},
	clamp : function(v, min, max) {
		return Math.max(min, Math.min(v, max));
	}
};

var GamePlayer = (function() {

	var c = function(gameInstance, playerInstance) {
		this.game = gameInstance;
		this.instance = playerInstance;

		this.userid;
		this.inputs = [];

		// Private Variables
		var points = 0;

		// TODO: Fix this constructor
		var paddle = new Paddle(this.game.world);		

		this.setX = function(value) { 
			paddle.x = value;
			paddle.updateElementData();
		};
		this.getX = function() { return paddle.x; };

		this.setY = function(value) { 
			paddle.y = value; 
			paddle.updateElementData(); 
		};
		this.getY = function() { return paddle.y; };

		this.getElement = function() { return paddle.element; };
		this.getElementState = function() { return paddle.element.v; };

		this.getStartY = function() { return paddle.startY; };

		this.addPoint = function() { points++; };
		this.getPoints = function() { return points; };
		this.resetPoints = function() { points = 0; };

		this.storeState = function() { paddle.storeState(); };
		this.getOldState = function() { return paddle.oldState; };

		this.clampPaddle = function(y) { 
			// console.log(y, paddle.minY, paddle.maxY);
			return Util.clamp(y, paddle.minY, paddle.maxY); 
		};

		this.setSide = function(side) {
			paddle.x = side == Direction.LEFT ? paddle.offset : paddle.world.width - paddle.offset;
		};
	};

	return c;
})();

var PongCore = (function() {
	const player1Color 			= '#BB0000';
	const player2Color 			= '#0088BB';
	const puckColor 	 		= '#000';
	const overlayColor 			= '#111';
	const overlayButtonColor 	= '#EEE';

	function generateText(elem, pos, val, options) {
		if (!options) options = {};
		var color = !options.color ? '#333'       : options.color;
		var font  = !options.font  ? 'Open Sans' : options.font;
		var size  = !options.size  ? 30           : options.size;
	    elem      = !elem          ? b()          : elem;
	    console.log(elem, pos,val,size,font,color);
		return elem.text(pos,val + "",size,font).fill(color);
	};

	if (typeof window !== 'undefined') {
		var mousePosition = { x : 0, y : 0 };

		window.addEventListener('mousemove', function(e) {
		    mousePosition = {
		    	x : e.clientX,
		    	y : e.clientY
		    };
		});
	}	

	var c = function(gameInstance) {
		// Private variables
		var scene;

		// Public variables
		this.instance = gameInstance.hasOwnProperty("playerNumber") ?
			undefined :
			gameInstance;

		this.server = this.instance !== undefined;

		this.world = {
			width : 600,
			height : 450
		};

		this.world.halfWidth = this.world.width / 2;
		this.world.halfHeight = this.world.height / 2;

		if (this.server) {
			this.players = {
				one : new GamePlayer(this, this.instance.host),
				two : new GamePlayer(this, this.instance.client)
			};


		} else  {
			this.players = {
				one : new GamePlayer(this),
				two : new GamePlayer(this)
			};

			this.activePlayer = gameInstance.playerNumber == 0 ? 
				'one' :
				'two';

			// TODO: Differentiation between player 1 and two and their respective sides
		}

		this.players.one.setSide(Direction.LEFT);
		this.players.two.setSide(Direction.RIGHT);	
		
		console.log("before: ", this.players.one.getX(), this.players.two.getX());

		this.players.one.setX(100);
		this.players.one.setY(45);
		this.players.two.setX(300);

		console.log("after: ", this.players.one.getX(), this.players.two.getX());

		// TODO: Fix constructor
		this.puck = new Puck(this.world.halfWidth, this.world.halfHeight, 14, this.world);

		this.lastScoreTime = 0;

		this.step = 1 / 60;
		this.t;
		this.dt;
		this.gdt = 0;

		if (!this.server) {
			var viewport;
			this.setViewport = function(v) { 
				viewport = v;
				// Set dimensions
				viewport.width = this.world.width;
				viewport.height = this.world.height;
			};
			this.getMousePosition = function() {
				var rect = viewport.getBoundingClientRect();
			   	return {
			    	x : mousePosition.x - rect.left,
			    	y : mousePosition.y - rect.top
			    };
			};
		}

		// Public functions
		this.buildScene = function() {
			scene = b('scene')
				.add(this.players.one.getElement())
				.add(this.players.two.getElement())
				.add(this.puck.getElement());

			if (!this.server) {
				var p1ScoreText = b('p1ScoreText');
				var p2ScoreText = b('p2ScoreText');
				var scoredText = b('scoredText');

				var overlay = b("overlay")
					.rect(
						[this.world.halfWidth, this.world.halfHeight],
						[this.world.width, this.world.height])
						.fill(overlayColor)
						.alpha([0,Number.MAX_VALUE],[.9,.9]);

				var overlayButton = b("overlayButton")
					.rect([this.world.halfWidth, this.world.halfHeight], [200, 100])
						.fill(overlayButtonColor)
					.add(generateText(b('startButton'),[-42,-22],"START",{color: '#111'}))
					.on(C.X_MCLICK, function(evt,t) {
						this.socket.emit('confirmation');

						overlay.alpha([t,t+1], [.9,0]) //fade to transparent for 1s, then stay that way
						overlay.alpha([t+1,Number.MAX_VALUE], [0,0])
						//overlay.disable();
						overlayButton.disable();

						// Hide cursor
						viewport.style.cursor = 'none';
					}.bind(this));

				scene
					.add(
						generateText(
							p1ScoreText,
							[this.world.width * 0.25, 50],
							this.players.one.getPoints()))
					.add(
						generateText(
							p2ScoreText,
							[this.world.width * 0.75, 50],
							this.players.two.getPoints()))
					.add(scoredText)
					.add(overlay)
					.add(overlayButton);
			}

			this.animatronPlayer = createPlayer('game-canvas', {
				//"debug"  : true,
				"mode" : C.M_DYNAMIC,
				"anim" : {
					"fps": 50, //doesn't actually work
					"width" : this.world.width,
					"height" : this.world.height,
					"bgcolor" : { color : "#F6F6F6" }
				}
			}).load(scene);

			this.animatronPlayer.play();
		};

		this.startGame = function() {
			console.log("^^^^ started the game");
			try {
				scene.modify(this.update, this);
			} catch (e) {
				console.error(e.message);
			}
		};

		// Constructor code execution
		if (!this.server)
			this.clientConnectToServer();

		this.buildScene();

		if (this.server) {
			var startingVelocity = Puck.getRandomVelocity();

			if (this.players.one.instance)
				this.players.one.instance.emit('start', 0, startingVelocity);

			if (this.players.two.instance)
				this.players.two.instance.emit('start', 1, startingVelocity);

			console.log("We'ze on servah about to start the game yo.");

			this.puck.setVelocity(startingVelocity);
			this.startGame();
		}
	};

	c.prototype = {
		//=============================================================================
		// Common Functions
		//=============================================================================
		update : function(t, duration, that) {
			that.t = t;
			that.dt = t - this._._appliedAt;
			that.gdt += that.dt;
			while (that.gdt >= that.step) {
				that.gdt -= that.step;

				if (that.server)
					that.serverUpdate();
				else
					that.clientUpdate();
			}
		},
		handleScore : function(player) {
			this.lastScoreTime = this.t;

			if (this.server)
				this.serverHandleScore(player);
			else
				this.clientHandleScore(player);
		},
		processInput : function(player) {
			// Since we're getting an absolute position from the mouse,
			// we just take the latest input and use that for the position
			// assignment of the paddle.

			var lastIndex = player.inputs.length - 1;

			return player.inputs[lastIndex];
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
			// this.serverHandleInput();

			// Called in the same loops since physics is merged with main loop
			this.serverUpdatePhysics();

			this.lastState = {
				hostPosition : {
					x : this.players.one.getX(),
					y : this.players.one.getY()
				},
				clientPosition : {
					x : this.players.two.getX(),
					y : this.players.two.getY()
				},
				timeStamp : (new Date()).getTime()
			};

			if (this.scored) {
				this.lastState.scored = this.scored;
				this.scored = null;
			}

			if (this.players.one.instance)
				this.players.one.instance.emit('state', this.lastState);

			if (this.players.two.instance)
				this.players.two.instance.emit('state', this.lastState);
		},
		serverUpdatePhysics : function() {
			// Update puck
			this.puck.updatePosition(this.dt);
			this.puck.checkBounds();

			// Player 1
			this.players.one.storeState();
			var newY = this.processInput(this.players.one);
			this.players.one.setY(newY);

			// Player 2
			this.players.two.storeState();
			newY = this.processInput(this.players.two);
			this.players.two.setY(newY);

			var scoringPlayer = this.puck.checkBounds();
			if (scoringPlayer) {
				this.handleScore(scoringPlayer == 1 ? this.players.one.userid : this.players.two.userid);
			} else {
				// Check for collisions with puck using "collides"
				this.players.one.getElementState().collides(this.puck.element.v, function() {
					this.puck.bounce(Direction.LEFT);
				});
				this.players.two.getElementState().collides(this.puck.element.v, function(){
					this.puck.bounce(Direction.RIGHT);
				});
			}

			// Clear inputs
			this.players.one.inputs = [];
			this.players.two.inputs = [];
		},
		serverHandleInput : function(client, y) {
			var playerClient = (client.userid == this.players.one.instance.userid) ?
				this.players.one :
				this.players.two;

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
			// Update puck
			this.puck.updatePosition(this.dt);
			this.puck.checkBounds();

			// Player updates
			this.players[this.activePlayer].storeState();
			var newY = this.processInput(this.players[this.activePlayer]);
			this.players[this.activePlayer].setY(newY);

			// TODO: Update puck location
		},
		clientHandleInput : function() {
			this.players[this.activePlayer].inputs.push({
				y : this.players[this.activePlayer].clampPaddle(this.getMousePosition().y) -
					this.players[this.activePlayer].getStartY(),
				timeStamp : (new Date()).getTime()
			});
			// console.log(this.getMousePosition().y, this.players.one.clampPaddle(this.getMousePosition().y),
			// 		this.players.one.getStartY());
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
		},
		clientConnectToServer : function() {
			console.log("Connecting to server");
			// Make connection to server
			this.socket = io.connect(window.location.origin + "/game");

			this.socket.on('start', this.clientOnStart.bind(this));
			this.socket.on('state', this.clientOnState.bind(this));
		},
		// TODO: Fix params
		clientOnStart : function(id, startingVelocity) {
			console.log("Received Id: ", id);
			this.players[this.activePlayer].userid = id;
			this.puck.setVelocity(startingVelocity);
			this.startGame();
		},
		// TODO: Fix params
		clientOnState : function(state) {

		}
	};

	return c;
})();

return PongCore;
});