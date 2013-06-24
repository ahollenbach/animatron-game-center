//=========================================================================
// Global Variables
//=========================================================================
var canvas,b,C,physics,visuals,anmSettings;
const PREDICT_SPAN,DEFAULT_POS;
function setGlobals() {
    // Animatron variables
    b = Builder._$;
    C = anm.C;
    PREDICT_SPAN = 1/150;
    anm.M[C.MOD_COLLISIONS].predictSpan = PREDICT_SPAN;
    DEFAULT_POS = [0,0];

    // Physics globals
    physics = {
        DEFAULT_SPEED = 600,          //pixels per second?
        DEFAULT_ANGLE = Math.PI/6,    //default starting angle
        DEFAULT_SPEED_MULT = 1.01,
        MAX_BOUNCE_ANGLE = Math.PI/3,  //60 degrees


    }
    physics.speedMultiplier = DEFAULT_SPEED_MULT; //for modifying multiplier over time

    anmSettings = 
    {
        //"debug"  : true,
        "mode" : C.M_DYNAMIC,
        "anim" : {
            "fps": 50,
            "width" : canvas.width,
            "height" : canvas.height
        }
    }

    visuals = 
    {
        p1Color             = '#BB0000',
        p2Color             = '#0088BB',
        puckColor           = '#000',
        overlayColor        = '#000',
        overlayButtonColor  = '#EEE'
    }

    //time the last point was scored
    var tLastPoint = 0;
    var playerId = 0;
    var opponentY = 0;
    var p1Score = 0, p2Score = 0;

    //puck attributes
    var velocity = getRandVelocity(true);
    var puck = {
        x:      CANVAS.WIDTH/2,
        y:      CANVAS.HEIGHT/2,
        vx:     velocity.vx,
        vy:     velocity.vy,
        radius: 14
    }

    //paddle attributes
    const paddle = {
        width:  14,
        height: 80,
        offset: 10,
        startY: CANVAS.HEIGHT/2
    }
    var p1posX      = paddle.offset + paddle.width/2;
    var p2posX      = CANVAS.WIDTH - paddle.offset - paddle.width/2; //all assumes upper right corner as root
    var minY = paddle.height/2;
    var maxY = CANVAS.HEIGHT - paddle.height/2;
}


//=========================================================================
// Mouse Movement (remove when Animatron fixes bug)
//=========================================================================
var mousePos = { x: 0, y: 0};

function setMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    mousePos.x = evt.clientX - rect.left;
    mousePos.y = evt.clientY - rect.top;
}

document.addEventListener('mousemove', function(evt) {
    setMousePos(canvas, evt);
}, false);


//=========================================================================
// Puck Physics
//=========================================================================
//resets the puck to the center and gives it a random velocity
function resetPuck() {
    var velocity = getRandVelocity();
    puck.x  = 0;
    puck.y  = 0;
    puck.vx = velocity.vx;
    puck.vy = velocity.vy;
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
    return toComponentVectors(DEFAULT_SPEED,angle);
}


//=========================================================================
// Game Data
//=========================================================================

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


//=========================================================================
// Modifiers
//=========================================================================
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


//=========================================================================
// Scene Building
//=========================================================================

function initGame() {
    canvas = document.getElementById('game-canvas');
    Util.goFullscreen();
    setGlobals();

    /**Animatron**/
    var scene = buildScene();
    var game = createPlayer(canvas.id, anmSettings).load(scene);
    game.play();

    game.startGame = function() {
        tLastPoint = game.state.time;
    }
    return game;
}

function buildScene() {
    var scene = b('scene');
    return scene;
}

//=========================================================================
// Utilities
//=========================================================================

var Util = {
    goFullscreen: function() {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        }
        else if (canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen();          
        }
        else if (canvas.webkitRequestFullScreen) {
            canvas.webkitRequestFullScreen();
        } else {
            return;
        }
        Util.setCanvasSize("fullscreen");
    },
    
    setCanvasSize: function(type) {
        var w,h;
        switch(type) {
            case "fullscreen": w = screen.width;      h = screen.height;      break;
            case "windowed"  : w = window.innerWidth; h = window.innerHeight; break;
        }
        canvas.width = w;
        canvas.height = h;
    }
}
window.addEventListener("fullscreenchange", function() {
    if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
        Util.setCanvasSize("fullscreen");
    } else { 
        Util.setCanvasSize("windowed");
    }
});