define(['libs/hardcore',
	    'games/pong/ai/humanAI'], function (Animatron, ai_human) {
	/**********************CONSTANTS/GLOBAL VARS**********************/
	//how far ahead the player looks for collisions
	const PREDICT_SPAN = 1/150; //target:50fps
	const SENTINEL = Math.pow(2,32) - 1;
	const SEND_COLLISIONS = true;
	//canvas size
	const CANVAS = {
		WIDTH: 800, 
		HEIGHT: 450
	}
	//reference to canvas
	var canvas = document.getElementById('game-canvas');
	const defaultPos = [0,0];
	var b = Builder._$, C = anm.C;
	//time the last point was scored
	var tLastPoint = 0;
	var playerId = 0;
	var opponentY = 0;

	/**************************MOUSE MOVEMENT**************************/
	//save the current mouse position for reference
	var mousePos = { x: 0, y: 0};

	//find out where the mouse is on the canvas
	function setMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
	    mousePos.x = evt.clientX - rect.left;
		mousePos.y = evt.clientY - rect.top;
	}

	//add a listener for changes in mouse
	var canvas = document.getElementById('game-canvas');
	document.addEventListener('mousemove', function(evt) {
		setMousePos(canvas, evt);
	}, false);


	/**************************PUCK PHYSICS**************************/
	//default speed multiplier for puck
	const DEFAULT_SPEED = 600; //pixels per second
	const DEFAULT_ANGLE = Math.PI/6 //default starting angle
	const DEFAULT_SPEED_MULT = 1.01;
	const MAX_BOUNCE_ANGLE = Math.PI/3; //60 degrees

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
				puck.y = -CANVAS.HEIGHT/2 + puck.radius;
			case 'bottom':
				if (direction == 'bottom') puck.y = CANVAS.HEIGHT/2 - puck.radius; //doesn't re-assign if falling through from 'top'
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
		if(SEND_COLLISIONS) sendCollisionData();
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
		//TODO: send the new vector
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
		if(SEND_COLLISIONS && playerNum == playerId+1) sendPointScored(playerId);
	}

	function updateScore(playerNum) {
		if(playerNum == 1) {
			p1ScoreText.unpaint(p1ScoreTextStyle);
			p1ScoreText.paint(p1ScoreTextStyle = generateScoreStyle(1,++p1Score));
		} else {
			p2ScoreText.unpaint(p2ScoreTextStyle);
			p2ScoreText.paint(p2ScoreTextStyle = generateScoreStyle(3,++p2Score));
		}
		tLastPoint = pong.state.time;
		speedMultiplier = DEFAULT_SPEED_MULT;
	}

	
	/**************************GAME ATTRIBUTES**************************/
	//puck attributes
	var velocity = getRandVelocity(true);
	var puck = {
		x: 		CANVAS.WIDTH/2,
		y: 		CANVAS.HEIGHT/2,
		vx: 	velocity.vx,
		vy: 	velocity.vy,
		radius: 14
	}

	//paddle attributes
	const paddle = {
		width:  14,
		height: 80,
		offset: 10,
		startY: CANVAS.HEIGHT/2
	}
	var p1posX 		= paddle.offset + paddle.width/2;
	var p2posX 		= CANVAS.WIDTH - paddle.offset - paddle.width/2; //all assumes upper right corner as root
	var minY = paddle.height/2;
	var maxY = CANVAS.HEIGHT - paddle.height/2;

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

	/**************************AI**************************/
	//TODO: Make this changable through UI
	//var ai1 = new ai_human(puck, paddle,1);
	//var ai2 = new ai_human(puck, paddle,2);
	

	/**************************MODIFIERS**************************/
	//TODO: change to use built-in mousemove
	var humanPlayerMod = function(t) {
		var newPos = clamp(mousePos.y);
		this.y = convertY(newPos);
		sendMessage(ws,"paddle_location",{ id: playerId, location : this.y });
	}

	var opponentMod = function(t) {
		this.y = opponentY;
	}

	var ai1Mod = function(t) {
        var newPos = ai1.move(puck) + paddle.startY;
        newPos = clamp(newPos);
        this.y = convertY(newPos);
        ai1.updPaddle(this.y);
	}

	var ai2Mod = function(t) {
        var newPos = ai2.move(puck) + paddle.startY;
        newPos = clamp(newPos);
        this.y = convertY(newPos);
        ai2.updPaddle(this.y);
	}

	var puckMovementMod = function(t) {
		var dt = t-this._._appliedAt;
		puck.x += puck.vx * dt;
		puck.y += puck.vy * dt;
		this.x = puck.x;
		this.y = puck.y;

		// Check for wall hits
		if (puck.y - puck.radius < -CANVAS.HEIGHT/2) {
			bouncePuck('top',t);
		} else if(puck.y + puck.radius > CANVAS.HEIGHT/2) {
			bouncePuck('bottom',t);
		}

		// Check left or right wall (point scored)
		if (puck.x - puck.radius < -CANVAS.WIDTH/2 || puck.x + puck.radius > CANVAS.WIDTH/2) {
			var scoringPlayer = 1;
			if(puck.x - puck.radius < -CANVAS.WIDTH/2) scoringPlayer = 2 //score on left, player 2 point
			else scoringPlayer = 1;
			addPoint(scoringPlayer,t);
		}
	}


	/**************************APPEARANCE/SCORE FORMATTING**************************/
	var player1Color 		= '#BB0000';
	var player2Color 		= '#0088BB';
	var puckColor 	 		= '#000';
	var overlayColor 		= '#000';
	var overlayButtonColor 	= '#EEE';

	var p1ScoreText = b('p1ScoreText'), p2ScoreText = b('p2ScoreText');

	function generateScoreStyle(location,text) {
		return  function(ctx) {
			      ctx.fillStyle = '#444';
			      ctx.font = '30pt sans-serif';
			      ctx.fillText(text, CANVAS.WIDTH*location/4, 50);
				}
	}
	var p1ScoreTextStyle, p2ScoreTextStyle;
	

	/**************************SCENE CREATION**************************/
	//Animatron player declarations
	anm.M[C.MOD_COLLISIONS].predictSpan = PREDICT_SPAN;

	var player1 = b('player1'), player2 = b('player2'), puckElem = b('puck');
	var overlay = b("overlay").rect([CANVAS.WIDTH/2, CANVAS.HEIGHT/2], [CANVAS.WIDTH, CANVAS.HEIGHT])
				              .fill(overlayColor)
				              .alpha([0,SENTINEL],[.7,.7])
				              
	var overlayButton = b("overlayButton")
							.rect([CANVAS.WIDTH/2, CANVAS.HEIGHT/2], [200, 100])
							.fill(overlayButtonColor)
							.paint(function(ctx) {
								ctx.fillStyle = '#222';
								ctx.font = '30pt sans-serif';
								ctx.fillText("START", -100+35, 0+15);
							})
							.on(C.X_MCLICK, function(evt,t) {
								sendMessage(ws,ClientMessage.CONFIRMATION);

								overlay.alpha([t,t+1], [.7,0]) //fade to transparent for 1s, then stay that way
								overlay.alpha([t+1,SENTINEL], [0,0])
								//overlay.disable();
								overlayButton.disable();
								//hide cursor
								document.getElementById('game-canvas').style.cursor = 'none';
							});

	var scene = b('scene')
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
					    p1ScoreText.paint(p1ScoreTextStyle = generateScoreStyle(1,p1Score)))
				    .add(
					    p2ScoreText.paint(p2ScoreTextStyle = generateScoreStyle(3,p2Score)));

	puckElem.modify(function(t) {
		     this.$.collides(player1.v, function() {
		     	bouncePuck('left',t,player1.v.state);
		        //TODO: send new vector
		     })
		  })
		 .modify(function(t) {
		     this.$.collides(player2.v, function() {
		     	bouncePuck('right',t,player2.v.state);
		        //TODO: send new vector
		     })
		  });
	puck.x = 0; 
	puck.y = 0;

	//make the game only check the inner-facing wall for collisions
	player1.v.reactAs(Builder.path([[paddle.width/2,-paddle.height/2],[paddle.width/2,paddle.height/2]]));
	player2.v.reactAs(Builder.path([[-paddle.width/2,-paddle.height/2],[-paddle.width/2,paddle.height/2]]));


	var pong = createPlayer('game-canvas', {
		//"debug"  : true,
		"mode" : C.M_DYNAMIC,
		"anim" : {
			"fps": 50, //doesn't actually work
			"width" : CANVAS.WIDTH,
			"height" : CANVAS.HEIGHT,
			"bgfill" : { color : "#FFF" }
		} 
	}).load(scene);
	scene.add(overlay);
	scene.add(overlayButton);
	pong.play();

	pong.startGame = function(id) {
		playerId = id;
		//add all the modifiers (puts game into effect)
		puckElem.modify(puckMovementMod);
		if(playerId == 0) {
			player1.modify(humanPlayerMod);
			player2.modify(opponentMod);
		} else {
			player1.modify(opponentMod);
			player2.modify(humanPlayerMod);
		}
		// player1.on(C.X_MMOVE, movePaddle);
		// player2.on(C.X_MMOVE, movePaddle);
		//set current time to start time
		tLastPoint = pong.state.time;
	}

	pong.setOpponentData = function(pos) {
		opponentY = pos;
	}

	function sendCollisionData() {
		var data = {
			id: playerId,
			collision: {
				vector: {
					x: puck.vx,
					y: puck.vy
				},
				pos: {
					x: puck.x,
					y: puck.y
				}
			}
		}
		sendMessage(ws,"collision",data)
	}

	function sendPointScored() {
		resetPuck();
		var data = {
			id: playerId,
			puckInfo: {
				vector: {
					x: puck.vx,
					y: puck.vy
				},
				pos: {
					x: puck.x,
					y: puck.y
				}
			}
		}
		sendMessage(ws,"point_scored",data)
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