define(['libs/hardcore','games/racer/racer.core','games/racer/util','games/racer/common','games/racer/humanPlayer'], function (Animatron, Core, Util, Common, humanModule) {
const SENTINEL        = Math.pow(2,32) - 1;

//=========================================================================
// minimalist DOM helpers
//=========================================================================

var Dom = {
  get:  function(id)                     { return ((id instanceof HTMLElement) || (id === document)) ? id : document.getElementById(id); },
  on:   function(ele, type, fn, capture) { Dom.get(ele).addEventListener(type, fn, capture);    }
};

//=============================================================================
// Game variables
//=============================================================================
var canvas         = Dom.get('game-canvas');
var width          = window.innerWidth;       // logical canvas width
var height         = window.innerHeight;      // logical canvas height
var camera         = {
    fieldOfView    : 100,                     // angle (degrees) for field of view
    height         : 1000,                    // z height of camera
    depth          : null,                    // z distance camera is from screen (computed)
    playerZ        : null                     // player relative z distance from camera (computed)
};
camera.depth       = 1 / Math.tan((camera.fieldOfView/2) * Math.PI/180);
camera.playerZ     = (camera.height * camera.depth);

var skySpeed       = 0.001;                   // background sky layer scroll speed when going around curve (or up hill)
var hillSpeed      = 0.002;                   // background hill layer scroll speed when going around curve (or up hill)
var treeSpeed      = 0.003;                   // background tree layer scroll speed when going around curve (or up hill)
var skyOffset      = 0;                       // current sky scroll offset
var hillOffset     = 0;                       // current hill scroll offset
var treeOffset     = 0;                       // current tree scroll offset
var resolution     = height/480;
var fogDensity     = 1;                       // exponential fog density
var player         = null;                    // you! (The local racer being controlled)
var background, sprites;
var b              = Builder._$;

var input = {
    left    : false,
    right   : false,
    faster  : false,
    slower  : false,
    drift   : false
};

//=========================================================================
// GAME LOOP helpers
//=========================================================================
var dt = 0, gdt = 0, curLap = 1;
var Game = {
    initGame : function(mode,duration,ai) {
        if(duration.type == "point") Common.numLaps = parseInt(duration.cond);
        Game.run(ai);
    },
    run: function (ai) {
        canvas.width = width;
        canvas.height = height;

        Game.loadImages(["background", "sprites"], function (images) {
            background = images[0];
            sprites = images[1];
            Core.reset();

            Core.update(Common.step, {});

            var humanPlayer = new humanModule();
            humanPlayer.setPlayerNum(0);
            Common.cars.push(humanPlayer);
            player = Common.cars[0];

            require(["js/games/racer/ai/" + ai.name], function (aiModule) {
                for (var i = 1; i < Common.numRacers; i++) {
                    var ai = new aiModule();
                    ai.setPlayerNum(i);
                    Common.cars.push(ai);
                }
            });

            var scene = buildScene();

            var racer = createPlayer(canvas.id, {
                //"debug": true,
                "mode": anm.C.M_DYNAMIC,
                "anim": {
                    "fps": Common.fps,
                    "bgcolor": { color: "#72D7EE" }
                }
            }).load(scene);

            racer.play();
        });
    },
    loadImages: function (names, callback) { // load multiple images and callback when ALL images have loaded
        var result = [];
        var count = names.length;

        var onLoad = function () {
            if (--count == 0) callback(result);
        };

        for (var n = 0; n < names.length; n++) {
            var name = names[n];
            result[n] = document.createElement('img');
            Dom.on(result[n], 'load', onLoad);
            result[n].src = "js/games/racer/images/" + name + ".png";
        }
    },
    gameLoop: function (t) {
        if (Common.raceActive) {
            dt = t - this._._appliedAt;
            gdt = gdt + dt;
            while (gdt > Common.step) {
                gdt = gdt - Common.step;
                Core.update(Common.step, input);
            }
        } else if (t > 3 && t < 4) {   // Hack to start game (start it when t = 3)
            Common.raceActive = true;
        }
    }
};


//=============================================================================
// Helper Functions
//=============================================================================
function setCamera(car) {
    var speedPercent   = car.speed / car.maxSpeed;
    camera.fieldOfView = 100 + speedPercent * 20;
    camera.height      = 1000 + speedPercent * 80;
    camera.depth       = 1 / Math.tan((camera.fieldOfView / 2) * Math.PI / 180);
    camera.playerZ     = (camera.height * camera.depth) + speedPercent * 150;
}

function getCarSprite (car, updown) {
    var sprite;
    if(car.car.freezeTime > 0) {
        var time = car.car.freezeTime;
        var step = 15;
        sprite = time%step > 10 ? Common.SPRITES.EXPLOSION0 :
                 time%step > 5  ? Common.SPRITES.EXPLOSION1 :
                                  Common.SPRITES.EXPLOSION2 ;
    } else {
        updown = updown < 8 ? (updown < -8 ? 0 : 1) : 2; // custom tuned, what feels right
        var lrOrient;
        if(car.isYou) {
            var dx = car.car.dx*100;

            if(input.drift) {
                lrOrient = (input.left ? -1 : input.right ? 1 : 0) * 3;
                console.log("[DRIFT] " + Common.input,lrOrient);
            } else {
                lrOrient = Math.abs(dx-0);
                if (lrOrient < .1) lrOrient = 0;
                else               lrOrient = Util.clamp(0,Math.ceil(lrOrient),2) * Util.getSign(dx);
            }
        } else {
            var xOff = (car.car.x+1) - (player.car.x+1);
            lrOrient = Math.abs(xOff) < .1 ?  0 :
                xOff > 0            ? -2 : 2;
            //TODO: Calculate other cars' angles relative to you
        }
        sprite = Common.SPRITES.CAR_ORIENT[updown][lrOrient+3];
    }
    return sprite;
}

function formatTime(dt) {
    var minutes = Math.floor(dt/60);
    var seconds = Math.floor(dt - (minutes * 60));
    var tenths  = Math.floor(10 * (dt - Math.floor(dt)));
    return addZeros(minutes) + ":" + addZeros(seconds) + "." + tenths + "0";
}

// Adds leading zeroes to a number (up to one (formats to 00, 01, etc.))
function addZeros(num) {
    return ((num < 10) ? "0" : "") + num;
}

function attachInputs(parentScene) {
    var KEY = {
        LEFT  : 37,
        UP    : 38,
        RIGHT : 39,
        DOWN  : 40,
        A     : 65,
        D     : 68,
        S     : 83,
        W     : 87,
        SPACE : 32
    };

    parentScene.on(anm.C.X_KDOWN, function(evt) {
        switch(evt.key) {
            case KEY.UP:   case KEY.W: input.faster = true; break;
            case KEY.LEFT: case KEY.A: input.left   = true; break;
            case KEY.DOWN: case KEY.S: input.slower = true; break;
            case KEY.RIGHT:case KEY.D: input.right  = true; break;
            case KEY.SPACE:            input.drift  = true; break;
        }
    }).on(anm.C.X_KUP, function(evt) {
        switch(evt.key) {
            case KEY.UP:   case KEY.W: input.faster = false; break;
            case KEY.LEFT: case KEY.A: input.left   = false; break;
            case KEY.DOWN: case KEY.S: input.slower = false; break;
            case KEY.RIGHT:case KEY.D: input.right  = false; break;
            case KEY.SPACE:            input.drift  = false; break;
        }
    });
}

function updateResults() {
    var tmp = Common.cars.map(function(car) {
        if(!car.finished) return;
        return {
            pNum : car.pNum,
            name : car.isYou ? sessionStorage.getItem("username") : "Bot " + car.pNum,
            time : sum(car.lapTimes)
        }
    });
    tmp = tmp.filter(function(n){return ( typeof n !== 'undefined' )}); // remove undefined (players that haven't finished yet) elements
    tmp.sort(function(a,b) {
        return a.time - b.time;
    });
    return tmp;
}

function sum(array) {
    return array.reduce(function(a, b) { return a + b });
}
function format(num,precision) {
    precision = typeof precision !== 'undefined' ? precision : 3;
    return parseFloat(Math.round(num * 100) / 100).toFixed(precision);
}

//=============================================================================
// Animatron object building helpers
//=============================================================================
function buildScene() {
    var scene = b('scene')
        .modify(Game.gameLoop)
        .paint(paintBackground);

    attachInputs(scene);

    // SUPER YUCKY TEXT CODE
    var hudWidth = Math.max(200,canvas.width*.16);
    var hudHeight = 200;
    var labelHeight = 15;
    var valueHeight = 30;
    var margin = 4;
    var yOffset = valueHeight+labelHeight+ margin;
    var font = "Century Gothic";

    var positionDisp    = b('position');
    var lapCounter      = b('lapCounter');
    var curLapTimeDisp  = b('currentLapTime');
    var fastLapTimeDisp = b('fastLapTime');
    var lastLapTimeDisp = b('lastLapTime');
    var speedometerText = b('speedometerText');
    changeText(speedometerText,[0,0],"0 mph",false,-67,10);
    var speedometer     = b('speedometer')
        .rect([0,0],[2,hudWidth/2])
        .reg([0,hudWidth/4])
        .modify(function() {
            this.angle = Util.toRadians(13/12*player.car.speed/100 - 105); // scale
        });

    var speedometerFull = b().circle([0,canvas.height-hudHeight/2-hudWidth/2-20],hudWidth/2)
        .fill("rgba(0,0,0,.9)");
    for(var a=-105;a<=25;a+=10) {
        speedometerFull.add(b().rect([0,0],[2,10])
            .reg([0,hudWidth/2-5])
            .fill(a>0?'rgb(240,20,20)':'rgb(255,255,255)')
            .rotate([0,SENTINEL],[Util.toRadians(a),Util.toRadians(a)]))
    }
    speedometerFull.add(speedometer).add(speedometerText);

    var hud = b('hud').rect([0,0],[hudWidth,hudHeight])
        .fill('rgba(0, 0, 0, 0.7)')
        .reg([-hudWidth/2,-hudHeight/2])
        .move([canvas.width-(hudWidth+10),10])
        .add(genElem(positionDisp    , [ margin, 0            ], "1 / " + Common.numRacers , "Position"      ))
        .add(genElem(lapCounter      , [ margin, 0            ], "1 / " + Common.numLaps   , "Lap"        , 0))
        .add(genElem(curLapTimeDisp  , [ margin, yOffset      ], "00:00.00"           , "Current Lap"   ))
        .add(genElem(fastLapTimeDisp , [ margin, yOffset*2    ], "- -:- -.- -"        , "Fastest Lap"   ))
        .add(genElem(lastLapTimeDisp , [ margin, yOffset*3    ], "- -:- -.- -"        , "Last Lap"      ))
        .add(speedometerFull);

    var resultWidth = canvas.width*.5, resultHeight = canvas.height*.5;
    var resultTextHeight = resultHeight/(Common.numRacers+4);
    var results = b('results').rect([0,0],[resultWidth,resultHeight])
        .fill('rgba(0, 0, 0, 0.7)')
        .move([resultWidth/2,resultHeight/2])
        .reg([-resultWidth/2,-resultHeight/2]);
    results.add(makeResult(b('results-header'), 0, "NAME", "TIME",resultTextHeight));
    for(var i=0;i<Common.numRacers;i++) {
        results.add(makeResult(b(), i+1, "", "",resultTextHeight));
    }
    results.disable();
    results.modify(function() {
        var positions = updateResults();
        for(var i=0;i<positions.length;i++) {
            var p = positions[i];
            makeResult(b(results.v.children[i+1]), i+1, p.name, format(p.time),resultTextHeight,p.pNum == 0);
        }
    });
    scene.add(results);

    function genElem(elem, pos, val, labelVal, offX, offY) {
        return b().add(changeText(null,pos,labelVal, true, offX, offY))
            .add(changeText(elem,pos,val,false, offX, offY))
    }
    // i.e. b(), [0,10], "1/6", false (true if it is a label for a value)
    function changeText(elem, pos, val, label, offX, offY) {
        offX = typeof offX !== 'undefined' ? offX : -hudWidth/2;
        offY = typeof offY !== 'undefined' ? offY : -hudHeight/2;
        elem = !elem ? b() : elem;

        var color = label?'#DDDDDD':'#EFEFEF';
        pos   = label?pos: [ pos[0] + labelHeight, pos[1] + labelHeight ];
        return elem.text(pos,val,label?labelHeight:valueHeight,font).move([offX,offY]).fill(color);
    }

    // optional arg "you" is true if the result is you #customcodeisonlyway
    function makeResult(elem,place,name,time,height,you) {
        var isTitle = (place == 0);
        while(name.length < 16) name += " ";
        // ignore all the blech. It's a temporary solution until animatron supports text formatting.
        return elem.text([margin + (!isTitle?44:0), margin + height*1.2*place],(isTitle ? "PLACE" : place) + "         " + (!isTitle?"     ":"") + name + time,height,font + (isTitle||you?" bold":"")).move([-resultWidth/2, -resultHeight/2]).fill('#EFEFEF');
    }

    hud.modify(function() {
        if (!player.finished) {   // If you haven't finished yet
            if (player.lap > curLap) {
                curLap = player.lap;
                var lastLapTime = player.lapTimes[player.lapTimes.length-1];
                changeText(lapCounter,[margin,0],player.lap + " / " + Common.numLaps,false,0);
                if(lastLapTime <= player.getFastestLap() && lastLapTime > 0) {
                    changeText(fastLapTimeDisp,[margin,yOffset*2],"" + formatTime(lastLapTime),false);
                }
                changeText(lastLapTimeDisp,[margin,yOffset*3],"" + formatTime(lastLapTime),false);
            }
            changeText(speedometerText,[0,0],Math.round(player.car.speed/100) + " mph",false,-67,10);
            changeText(curLapTimeDisp,[margin,yOffset],"" + formatTime(player.currentLapTime),false);
            changeText(positionDisp,[margin,0],player.place + " / " + Common.numRacers,false);
        } else {
            hud.disable();
            results.enable();
        }
    });
    scene.add(hud);

    var light = makeStartingLight(scene);
    Core.update(Common.step, {}); // one last update to draw the new stuff

    return scene;
}


function makeStartingLight(scene) {
    var colors   = [['red', '#910000'], ['yellow','#CEBA00'],['#00DB00','#005500']];
    var scale = (16/9) / (canvas.width/canvas.height);  //ratio it to a 16:9 display
    var width    = 0.07 * canvas.width * scale;
    var padding  = 0.2 * width;
    var diameter = width - padding;
    var height   = (diameter + padding) * colors.length;

    var light = b('light').rect([canvas.width/2,canvas.height/4],[width,height])
        .fill('#F4D709')
        .stroke('black',2)
        .band([0,4]);
    for(var i=0;i<colors.length;i++) {
        var inactive = b().circle([0,(diameter+padding/2)*(i-1)],diameter/2)  // Todo: switch 1 to be changable
            .fill(colors[i][1])
            .stroke('black',1);

        var active   = b().circle([0,(diameter+padding/2)*(i-1)],diameter/2)  // Todo: switch 1 to be changable
            .fill(colors[i][0])
            .stroke('black',1)
            .band([i+1,i+2]);

        light.add(inactive).add(active);
    }
    scene.add(light);
    return light;
}

//=========================================================================
// canvas rendering helpers
//=========================================================================
var Render = {

    polygon: function(ctx, points, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for(var i=1;i<points.length;i++) {
            ctx.lineTo(points[i][0],points[i][1]);
        }
        ctx.closePath();
        ctx.fill();
    },

    //---------------------------------------------------------------------------

    segment: function(ctx, x1, y1, w1, x2, y2, w2, fog, color) {
        var r1 = Render.rumbleWidth(w1, Common.lanes),
            r2 = Render.rumbleWidth(w2, Common.lanes),
            l1 = Render.laneMarkerWidth(w1, Common.lanes),
            l2 = Render.laneMarkerWidth(w2, Common.lanes),
            lanew1, lanew2, lanex1, lanex2, lane;

        ctx.fillStyle = color.grass;
        ctx.fillRect(0, y2, width, y1 - y2);

        Render.polygon(ctx, [[x1-w1-r1, y1], [x1-w1+1, y1], [x2-w2+1, y2], [x2-w2-r2, y2]], color.rumble);  // The 1 pixel offset fixes a bug where a tiny strip of grass would show through
        Render.polygon(ctx, [[x1+w1+r1, y1], [x1+w1-1, y1], [x2+w2-1, y2], [x2+w2+r2, y2]], color.rumble);
        Render.polygon(ctx, [[x1-w1,    y1], [x1+w1, y1],   [x2+w2, y2],   [x2-w2,    y2]], color.road);

        if (color.lane) {
            lanew1 = w1*2/Common.lanes;
            lanew2 = w2*2/Common.lanes;
            lanex1 = x1 - w1 + lanew1;
            lanex2 = x2 - w2 + lanew2;
            for(lane = 1 ; lane < Common.lanes ; lanex1 += lanew1, lanex2 += lanew2, lane++)
                Render.polygon(ctx, [[lanex1 - l1/2, y1], [lanex1 + l1/2, y1], [lanex2 + l2/2, y2],[lanex2 - l2/2, y2]], color.lane);
        }

        Render.fog(ctx, 0, y1, width, y2-y1, fog);
    },

    //---------------------------------------------------------------------------

    background: function(ctx, layer, rotation, offset) {
        rotation = rotation || 0;
        offset   = offset   || 0;

        var imageW = layer.w/2;
        var imageH = layer.h;

        var sourceX = layer.x + Math.floor(layer.w * rotation);
        var sourceY = layer.y;
        var sourceW = Math.min(imageW, layer.x+layer.w-sourceX);
        var sourceH = imageH;

        var destX = 0;
        var destY = offset;
        var destW = Math.floor(width * (sourceW/imageW));
        var destH = height;

        ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
        if (sourceW < imageW)
            ctx.drawImage(background, layer.x, sourceY, imageW-sourceW, sourceH, destW-1, destY, width-destW, destH);
    },

    //---------------------------------------------------------------------------

    sprite: function(ctx, sprite, scale, destX, destY, offsetX, offsetY, clipY) {
        var spriteScale = Common.SPRITES.SCALE;
        var destW  = (sprite.w * scale * width/2) * (spriteScale * Common.roadWidth);
        var destH  = (sprite.h * scale * width/2) * (spriteScale * Common.roadWidth);

        destX = destX + (destW * (offsetX || 0));
        destY = destY + (destH * (offsetY || 0));

        var clipH = clipY ? Math.max(0, destY+destH-clipY) : 0;
        if (clipH < destH)
            ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h*clipH/destH), destX, destY, destW, destH - clipH);

    },

    car: function(ctx, sprite, scale, destX, destY, offsetX, offsetY, clipY, updown, car,distance) {
        var bounce = ((2/distance) * Math.random() * (car.car.speed/car.car.maxSpeed) * resolution) * Util.randomChoice([-1,1]);
        sprite = getCarSprite(car, updown);
        //if((player.car.z > 5000 || player.car.z < 1000) && car.pNum == 1) console.log("[CAR_RENDER] " + car.pNum,destX, destY);
        //else console.log(player.car.z)
        Render.sprite(ctx, sprite, scale, destX, destY + bounce, offsetX, offsetY,clipY);
    },

    player: function(ctx, scale, destX, destY, steer, updown, car) {
        setCamera(car.car);
        var bounce = (1.1 * Math.random() * (car.car.speed/car.car.maxSpeed) * resolution) * Util.randomChoice([-1,1]);
        var sprite = getCarSprite(car, updown);
        Render.sprite(ctx, sprite, scale, destX, destY + bounce, -0.5, -1,null);
    },

    //---------------------------------------------------------------------------

    fog: function(ctx, x, y, width, height, fog) {
        if (fog < 1) {
            ctx.globalAlpha = (1-fog);
            ctx.fillStyle = Common.COLORS.FOG;
            ctx.fillRect(x, y, width, height);
            ctx.globalAlpha = 1;
        }
    },

    rumbleWidth:     function(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(6,  2*lanes); },
    laneMarkerWidth: function(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(32, 8*lanes); }

};

function paintBackground(ctx) {
    skyOffset  = Util.increase(skyOffset,  skySpeed  * Common.playerSegment.curve * (player.car.z-player.car._z)/Common.segmentLength, 1);
    hillOffset = Util.increase(hillOffset, hillSpeed * Common.playerSegment.curve * (player.car.z-player.car._z)/Common.segmentLength, 1);
    treeOffset = Util.increase(treeOffset, treeSpeed * Common.playerSegment.curve * (player.car.z-player.car._z)/Common.segmentLength, 1);
    render(ctx);
}


//=========================================================================
// Rendering the world
//=========================================================================
function render(ctx) {
  var cameraLocation = player.car.z-camera.playerZ;
  cameraLocation = cameraLocation < 0 ? Common.trackLength + cameraLocation : cameraLocation;

  var baseSegment   = Core.findSegment(cameraLocation);
  var basePercent   = Util.percentRemaining(cameraLocation, Common.segmentLength);
  var playerSegment = Core.findSegment(player.car.z);
  var playerPercent = Util.percentRemaining(player.car.z, Common.segmentLength);
  var playerY       = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
  var maxy          = height;

  var x  = 0;
  var dx = - (baseSegment.curve * basePercent);

  ctx.clearRect(0, 0, width, height);

  Render.background(ctx, Common.BACKGROUND.SKY,   skyOffset,  resolution * skySpeed  * playerY);
  Render.background(ctx, Common.BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY);
  Render.background(ctx, Common.BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);

  var n, i, segment, sprite, spriteScale, spriteX, spriteY;

  for(n = 0 ; n < Common.drawDistance ; n++) {
    segment        = Common.segments[(baseSegment.index + n) % Common.segments.length];
    segment.looped = segment.index < baseSegment.index;
    segment.fog    = Util.exponentialFog(n/Common.drawDistance, fogDensity);
    segment.clip   = maxy;
    Util.project(segment.p1, (player.car.x * Common.roadWidth) - x,      playerY + camera.height , cameraLocation - (segment.looped ? Common.trackLength : 0), camera.depth, width, height, Common.roadWidth);
    Util.project(segment.p2, (player.car.x * Common.roadWidth) - x - dx, playerY + camera.height, cameraLocation - (segment.looped ? Common.trackLength : 0), camera.depth, width, height, Common.roadWidth);

    x  = x + dx;
    dx = dx + segment.curve;

    if ((segment.p1.camera.z <= camera.depth)        || // behind us
        (segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
        (segment.p2.screen.y >= maxy))                  // clip by (already rendered) hill
    {
      continue;
    }

    Render.segment(ctx,
                   segment.p1.screen.x,
                   segment.p1.screen.y,
                   segment.p1.screen.w,
                   segment.p2.screen.x,
                   segment.p2.screen.y,
                   segment.p2.screen.w,
                   segment.fog,
                   segment.color);

    maxy = segment.p1.screen.y;
  }

  for(n = (Common.drawDistance-1) ; n > 0 ; n--) {
    segment = Common.segments[(baseSegment.index + n) % Common.segments.length];
    var opponent;
    for(i = 0 ; i < segment.cars.length ; i++) {
      opponent    = segment.cars[i];
      if(opponent.isYou) {
          Render.player( ctx,
                      camera.depth/camera.playerZ,
                      width/2,
                      (height/2) - (camera.depth/camera.playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height/2),
                      player.car.speed * (input.left ? -1 : input.right ? 1 : 0),
                      playerSegment.p2.world.y - playerSegment.p1.world.y,player);
      } else {
          sprite      = opponent.sprite;
          spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, opponent.car.percent);
          //if(opponent.pNum == 1 && (player.car.z < 1000 || player.car.z > 10000)) console.log('destXY',opponent.car.percent)
          spriteX     = Util.interpolate(segment.p1.screen.x,     segment.p2.screen.x,     opponent.car.percent) + (spriteScale * opponent.car.x * Common.roadWidth * width/2);
          spriteY     = Util.interpolate(segment.p1.screen.y,     segment.p2.screen.y,     opponent.car.percent);
          Render.car(ctx, opponent.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip, segment.p2.world.y - segment.p1.world.y,opponent,n);
      }
    }

    for(i = 0 ; i < segment.sprites.length ; i++) {
      sprite      = segment.sprites[i];
      spriteScale = segment.p1.screen.scale;
      spriteX     = segment.p1.screen.x + (spriteScale * sprite.x * Common.roadWidth * width/2);
      spriteY     = segment.p1.screen.y + (sprite.source == Common.SPRITES.COLUMN ? spriteScale*60000 : 0);
      Render.sprite(ctx, sprite.source, spriteScale, spriteX, spriteY, (sprite.x < 0 ? -1 : 0), -1, segment.clip);
    }
  }
}
return Game;

});