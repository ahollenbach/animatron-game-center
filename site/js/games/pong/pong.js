define(['libs/hardcore'], function (Animatron) {
	/**********************CONSTANTS/GLOBAL VARS**********************/
	var pong = {};
	const PREDICT_SPAN 			= 1/150;                     // how far ahead the player looks for collisions
	const SENTINEL 				= Math.pow(2,32) - 1;        // Deprecated?
	const SEND_COLLISIONS 		= true;                      // Should send collisions?
	const GAME_MODE 			= {
										versusAI    : 1,     // Local AI opponent
										versusHuman : 2,     // Local human opponent
										networked   : 3      // Networked human opponent
								  }
	const defaultPos 			= [0,0];                     // For player positioning
	var   gameMode              = null;                      // One of the GAME_MODEs
	var   canvas                = null;						 // Reference to canvas
	var   tLastPoint            = 0;                         // time the last point was scored
	var   playerId              = 0;                         // Which side you are on, supplied by server
	var   opponentY             = 0;                         // Position of opponent's paddle
	var   collided              = false;                     // If puck collided this step
	var   scored                = false;                     // If puck scored this step
	var   victory               = {
									type: 'point',           // Type of victory (either 'point' or 'time')
									cond: 7                  // win condition (either points or minutes)
								  }

	// Animatron aliases
	var b = Builder._$, C = anm.C;

	/**************************MOUSE MOVEMENT**************************/
	//save the current mouse position for reference
	var mousePos = { x: 0, y: 0};

	//find out where the mouse is on the canvas
	function setMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
	    mousePos.x = evt.clientX - rect.left;
		mousePos.y = evt.clientY - rect.top;
	}

	function initMouseMovement() {
		document.addEventListener('mousemove', function(evt) {
			setMousePos(canvas, evt);
		}, false);
	}

	/**************************PUCK PHYSICS**************************/
	//default speed multiplier for puck
	const DEFAULT_SPEED 		= 600; 		  // pixels per second
	const DEFAULT_ANGLE 		= Math.PI/6   // default starting angle
	const DEFAULT_SPEED_MULT 	= 1.01;       // By default how quickly puck speeds up
	const MAX_BOUNCE_ANGLE 		= Math.PI/3;  // 60 degrees

	var speedMultiplier = DEFAULT_SPEED_MULT; //for modifying multiplier over time

	//resets the puck to the center and gives it a random velocity
	function resetPuck() {
		var velocity = getRandVelocity();
		puck.x 	= 0;
		puck.y 	= 0;
		puck.vx	= velocity.vx;
		puck.vy	= velocity.vy;
	}

	//bounces the puck and if the puck would get stuck, moves it out or lets the goal in
	//direction: 'top', 'bottom', 'left', 'right'
	//t: the elapsed time from the beginning of the match
	function bouncePuck(direction,t,player) {
		switch(direction) {
			case 'top':
				puck.y = -canvas.height/2 + puck.radius;
			case 'bottom':
				if (direction == 'bottom') puck.y = canvas.height/2 - puck.radius; //doesn't re-assign if falling through from 'top'
				puck.vy *= -speedMultiplier;
				puck.vx *= speedMultiplier;
				break;
			case 'left':
				adjustVelocity(1,player);
				break;
			case 'right':
				adjustVelocity(2,player);
				break;
			default:
				break;
		}
	}

	//adjusts and reverses the velocity based on where the hit occurred on the paddle
	//Precondition: puck should have collided with paddle and deemed bouncable
	function adjustVelocity(playerNum,player) {
		var paddleY = player.y;
		var relIntersect = (paddleY - puck.y) / (paddle.height/2 + puck.radius); //distance of puck center from paddle center+puckradius
		var bounceAngle = -relIntersect * MAX_BOUNCE_ANGLE;
		var curPuckSpeed = Math.sqrt(Math.pow(puck.vx,2) + Math.pow(puck.vy,2)); //a^2+b^2=c^2
		if(playerNum == 2) bounceAngle = Math.PI - bounceAngle; //reverse direction
		var newVectors = toComponentVectors(curPuckSpeed,bounceAngle);
		puck.vx = newVectors.vx;
		puck.vy = newVectors.vy;
		puck.vx *= speedMultiplier;
		puck.vy *= speedMultiplier;

		collided = true;
	}

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

	/**************************GAME DATA**************************/
	var p1Score = 0, p2Score = 0;

	//adds a point to the player's score
	//t: the elapsed time
	function addPoint(playerNum,t) {
		//only send point scored if you scored goal
		if(playerNum == playerId+1 || gameMode == GAME_MODE.versusAI) {
			resetPuck();
			puckElem.alpha([t, t+1], [0, 1])
			scored = true;
			updateScore(playerNum,t)
		}
	}

	function updateScore(playerNum,t) {
		if(!t) t = pongPlayer.state.time;
		if(playerNum == 1) {
			genText(p1ScoreText,[canvas.width/4-10, 50],++p1Score + "")
		} else {
			genText(p2ScoreText,[canvas.width*3/4, 50],++p2Score + "")
		}
		if(victory.type == 'point') {
			if     (p1Score == victory.cond) triggerVictory(1);
		    else if(p2Score == victory.cond) triggerVictory(2);
		}
		tLastPoint = t;
		speedMultiplier = DEFAULT_SPEED_MULT;

		// Popup bubble announcing who scored
		genText(scoredText,[canvas.width/2-65, -40],"Player " + playerNum + " scored!",{size: 20, color:"#222"});
		var peek = 15 + 40;
		scoredText.trans([t   ,t+.2], [[0, 0   ], [0, peek]], C.E_COUT)
		scoredText.trans([t+.2,t+.8], [[0, peek], [0, peek]]          )
		scoredText.trans([t+.8,t+1 ], [[0, peek], [0, 0   ]], C.E_CIN )
	}

	
	/**************************GAME ATTRIBUTES**************************/
	var velocity, puck;
	function initPuck() {
		velocity = getRandVelocity(true);
		puck = {
			x: 		canvas.width/2,
			y: 		canvas.height/2,
			vx: 	velocity.vx,
			vy: 	velocity.vy,
			radius: 14
		}
	}

	var paddle; // CONSTANT
	var p1posX,p2posX,minY,maxY;
	function initPaddles() {
		paddle = {
			width:  14,
			height: 80,
			offset: 10,
			startY: canvas.height/2
		}
		p1posX 		= paddle.offset + paddle.width/2;
		p2posX 		= canvas.width - paddle.offset - paddle.width/2; //all assumes upper right corner as root
		minY = paddle.height/2;
		maxY = canvas.height - paddle.height/2;
	}

	// clamps the paddle so it does not leave the canvas.
	// all paddle mods (player/ai) should call this before setting
	// the y position of the paddle
	function clamp(yPos) {
		return Math.max(minY, Math.min(yPos, maxY));
	}

	// converts y positions from puck (global) frame to 
	// paddle frame
	function convertY(yPos) {
		return yPos-paddle.startY;
	}


	/**************************MODIFIERS**************************/
	//TODO: change to use built-in mousemove
	var humanPlayerMod = function(t) {
		var newPos = clamp(mousePos.y);
		this.y = convertY(newPos);
		// if(gameMode == GAME_MODE.networked) sendMessage(ws,"paddle_location",{ id: playerId, location : this.y });
	}

	var networkMod = function(t) {
		this.y = opponentY;
	}

	var ai;
	var aiMod = function(t) {
        var newPos = ai.move(puck) + paddle.startY;
        newPos = clamp(newPos);
        this.y = convertY(newPos);
        ai.updPaddle(this.y);
	}

	var puckMovementMod = function(t) {

		if(t<3) console.log(this)
		if(t-tLastPoint > 1) {  // Only move if more than a second after last score
			var dt = t-this._._appliedAt;
			puck.x += puck.vx * dt;
			puck.y += puck.vy * dt;
			this.x = puck.x;
			this.y = puck.y;

			// Check for wall hits
			if (puck.y - puck.radius < -canvas.height/2) {
				bouncePuck('top',t);
			} else if(puck.y + puck.radius > canvas.height/2) {
				bouncePuck('bottom',t);
			}

			// Check left or right wall (point scored)
			if (puck.x - puck.radius < -canvas.width/2 || puck.x + puck.radius > canvas.width/2) {
				var scoringPlayer = 1;
				if(puck.x - puck.radius < -canvas.width/2) scoringPlayer = 2 //score on left, player 2 point
				addPoint(scoringPlayer,t);
			}
		}
	}

	var stateMod = function(t) {
		var state = {
			// id      : playerId,
			pos     : (playerId == 0) ? player1.v.state.y : player2.v.state.y
			//puck    : getPuckData()
		};
		if (collided) {
			state.collision = getPuckData();
			collided = false;
		}
		if (scored) {
			state.scored = getPuckData();
			console.log(state.scored)
			scored = false;
		}
		socketConnection.emit("state", playerId, state);
	}


	/**************************APPEARANCE/SCORE FORMATTING**************************/
	const player1Color 			= '#BB0000';
	const player2Color 			= '#0088BB';
	const puckColor 	 		= '#000';
	const overlayColor 			= '#111';
	const overlayButtonColor 	= '#EEE';

	function genText(elem, pos, val, options) {
		if(!options) options = {}
		var color = !options.color ? '#333'       : options.color;
		var font  = !options.font  ? 'Open Sans' : options.font;
		var size  = !options.size  ? 30           : options.size;
	    elem      = !elem          ? b()          : elem;
		return elem.text(pos,val,size,font).fill(color);
	}
	var p1ScoreText, p2ScoreText,scoredText;
	

	/**************************SCENE CREATION**************************/
	var player1,player2,puckElem, overlay, overlayButton,scene,pongPlayer;
	function buildScene() {
		anm.M[C.MOD_COLLISIONS].predictSpan = PREDICT_SPAN;
		p1ScoreText = b('p1ScoreText'); p2ScoreText = b('p2ScoreText');

		player1 = b('player1'); player2 = b('player2'); puckElem = b('puck');
		overlay = b("overlay").rect([canvas.width/2, canvas.height/2], [canvas.width, canvas.height])
					          .fill(overlayColor)
					          .alpha([0,SENTINEL],[.9,.9])
					              
		overlayButton = b("overlayButton")
							.rect([canvas.width/2, canvas.height/2], [200, 100])
							.fill(overlayButtonColor)
							.add(genText(b('startButton'),[-42,-22],"START",{color: '#111'}))
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

		scene = b('scene')
				    .add(
				 		player1.rect([p1posX,paddle.startY], [paddle.width,paddle.height])
						   	   .fill(player1Color))
				    .add(
						player2.rect([p2posX,paddle.startY], [paddle.width,paddle.height])
					   		   .fill(player2Color))
				    .add(
						puckElem.circle([puck.x,puck.y], puck.radius)
		  		   		        .fill(puckColor))
				    .add(
				    	genText(p1ScoreText,[canvas.width/4, 50],p1Score + ""))
				    .add(
					    genText(p2ScoreText,[canvas.width*3/4, 50],p2Score + ""))
				    .add(scoredText = b('scoredText'))

		puckElem.modify(function(t) {
			     this.$.collides(player1.v, function() {
			     	bouncePuck('left',t,player1.v.state);
			     })
			  })
			 .modify(function(t) {
			     this.$.collides(player2.v, function() {
			     	bouncePuck('right',t,player2.v.state);
			     })
			  });
		puck.x = 0;
		puck.y = 0;

		//make the game only check the inner-facing wall for collisions
		player1.v.reactAs(Builder.path([[paddle.width/2,-paddle.height/2],[paddle.width/2,paddle.height/2]]));
		player2.v.reactAs(Builder.path([[-paddle.width/2,-paddle.height/2],[-paddle.width/2,paddle.height/2]]));


		pongPlayer = createPlayer('game-canvas', {
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
		pongPlayer.play();
	}


	var opponentMod;
	// Socket.io stuff, which will only be initialized if we're networked
	var io;
	var socketConnection;
	pong.initGame = function(mode,duration,aiName) {
		canvas = document.getElementById('game-canvas');
		canvas.width = 600;
		canvas.height = 450;
		initMouseMovement();
		initPuck();
		initPaddles();
		buildScene();

		if(mode == GAME_MODE.versusAI) {
			require(["js/games/pong/ai/" + aiName], function(aiModule) {
				gameMode = GAME_MODE.versusAI
				ai = new aiModule(puck, paddle);
				opponentMod = aiMod;
			});
		} else if (mode == GAME_MODE.networked) {
			gameMode = mode;
			opponentMod = networkMod;

			io = require('socketio');
			socketConnection = io.connect(window.location.origin + "/game");
			socketConnection.on('start', function(id) {
				if(!puckElem.v.disabled) pong.startGame(id);
				else resetGame();
			});
			socketConnection.on('state', function(id, state) {
				pong.setOpponentData(state.pos);

				if (state.hasOwnProperty("collision"))
					pong.updateLocation(state.collision);
				if (state.hasOwnProperty("scored"))
					pong.setNewScore(id, state.scored);
			});
		}

		victory.type = duration.type;
		victory.cond = duration.cond;
	}

	pong.startGame = function(id) {
		console.log("Your id is: " + id);
		playerId = id;
		//if (gameMode == GAME_MODE.versusAI) ai.setPlayerNum(id-1);

		//add all the modifiers (puts game into effect)
		if (gameMode == GAME_MODE.networked)
			scene.modify(stateMod);
		
		puckElem.modify(puckMovementMod);
		
		if(playerId == 0) {
			player1.modify(humanPlayerMod);
			player2.modify(opponentMod);
		} else {
			player1.modify(opponentMod);
			player2.modify(humanPlayerMod);
		}
		resetGame();
	}

	function resetGame() {
		//set current time to start time
		tLastPoint = pongPlayer.state.time;
		puckElem.v.disabled = false;
		p1Score = 0, p2Score = 0;
		genText(p1ScoreText,[canvas.width/4-10, 50],p1Score + "")
		genText(p2ScoreText,[canvas.width*3/4, 50] ,p2Score + "")
	}

	function triggerVictory(playerNum) {
		var t = pongPlayer.state.time;
		overlay.alpha([t,t+1], [0,.9]);
		overlay.alpha([t+1,SENTINEL], [.9,.9]);
		var winner = genText(b('winner'),[-125, -canvas.height/3],"Player " + playerNum + " wins!", {size: 40, color:"#EEE"});
		winner.modify(function(t) {
			//this.scale = Math.sin(t) + .5;
		})
		overlay.add(winner)
		overlayButton.enable();
		console.log(b(overlayButton.v.children[0])); genText(b(overlayButton.v.children[0]),[-45,-45],['  PLAY ', 'AGAIN?'],{color: '#111'})
		canvas.style.cursor = 'pointer';
		puckElem.v.disabled = true;
	}

	pong.setOpponentData = function(pos) {
		opponentY = pos;
	}

	function getPuckData() {
		var data = {
			vector: {
				x: puck.vx,
				y: puck.vy
			},
			pos: {
				x: puck.x,
				y: puck.y
			}
		}
		return data;
	}

	pong.setNewScore = function(id,puckInfo) {
		updateScore(id+1);
		puck.vx = puckInfo.vector.x;
		puck.vy = puckInfo.vector.y;
		puck.x = puckInfo.pos.x;
		puck.y = puckInfo.pos.y;
	}

	pong.updateLocation = function(collisionData) {
		puck.vx = collisionData.vector.x;
		puck.vy = collisionData.vector.y;
		puck.x = collisionData.pos.x;
		puck.y = collisionData.pos.y;

		playSoundEffect(pongSfx);
	}

	return pong;
});