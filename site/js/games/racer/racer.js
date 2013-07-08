define(['libs/hardcore','games/racer/racer.core','games/racer/util','games/racer/common'], function (Animatron, Core, Util, C) {
const SENTINEL        = Math.pow(2,32) - 1; 
//=========================================================================
// minimalist DOM helpers
//=========================================================================

var Dom = {

  get:  function(id)                     { return ((id instanceof HTMLElement) || (id === document)) ? id : document.getElementById(id); },
  set:  function(id, html)               { Dom.get(id).innerHTML = html;                        },
  on:   function(ele, type, fn, capture) { Dom.get(ele).addEventListener(type, fn, capture);    },
  un:   function(ele, type, fn, capture) { Dom.get(ele).removeEventListener(type, fn, capture); },
  show: function(ele, type)              { Dom.get(ele).style.display = (type || 'block');      },
  blur: function(ev)                     { ev.target.blur();                                    },

  addClassName:    function(ele, name)     { Dom.toggleClassName(ele, name, true);  },
  removeClassName: function(ele, name)     { Dom.toggleClassName(ele, name, false); },
  toggleClassName: function(ele, name, on) {
    ele = Dom.get(ele);
    var classes = ele.className.split(' ');
    var n = classes.indexOf(name);
    on = (typeof on == 'undefined') ? (n < 0) : on;
    if (on && (n < 0))
      classes.push(name);
    else if (!on && (n >= 0))
      classes.splice(n, 1);
    ele.className = classes.join(' ');
  },

  storage: window.localStorage || {}

}

//=============================================================================
// Game variables
//=============================================================================
var canvas         = Dom.get('game-canvas');
var ctx            = canvas.getContext('2d');
var width          = window.innerWidth;       // logical canvas width
var height         = window.innerHeight;      // logical canvas height
var lanes          = 3;                       // number of lanes
var s              = null;                    // state of the game

var skySpeed       = 0.001;                   // background sky layer scroll speed when going around curve (or up hill)
var hillSpeed      = 0.002;                   // background hill layer scroll speed when going around curve (or up hill)
var treeSpeed      = 0.003;                   // background tree layer scroll speed when going around curve (or up hill)
var skyOffset      = 0;                       // current sky scroll offset
var hillOffset     = 0;                       // current hill scroll offset
var treeOffset     = 0;                       // current tree scroll offset
var resolution     = height/480;


//=========================================================================
// GAME LOOP helpers
//=========================================================================

var Game = {  
  run: function() {
    canvas.width  = width;
    canvas.height = height;

    Game.loadImages(["background", "sprites"], function(images) {

      background = images[0];
      sprites    = images[1];
      Core.reset();


      var update = Core.update,    // method to update game logic is provided by caller
          step   = C.step,         // fixed frame step (1/fps)
          now    = null,
          last   = Util.timestamp(),
          dt     = 0,
          gdt    = 0;
          curLap = 1;

      Dom.storage.fast_lap_time = Dom.storage.fast_lap_time || 180;


      var b = Builder._$;
      s = update(step);

      var scene = b('scene')
                    .modify(function(t) {
                      dt = t - this._._appliedAt;
                      gdt = gdt + dt;
                      while (gdt > step) {
                        gdt = gdt - step;
                        s = update(step);
                      }
                    })
                    .paint(function(ctx) {
                      skyOffset  = Util.increase(skyOffset,  skySpeed  * C.playerSegment.curve * (s.player.z-startPosition)/C.segmentLength, 1);
                      hillOffset = Util.increase(hillOffset, hillSpeed * C.playerSegment.curve * (s.player.z-startPosition)/C.segmentLength, 1);
                      treeOffset = Util.increase(treeOffset, treeSpeed * C.playerSegment.curve * (s.player.z-startPosition)/C.segmentLength, 1);

                      render(ctx);
                    });

      scene.on(anm.C.X_KDOWN, function(evt) {
          switch(evt.key) {
            case KEY.UP:   case KEY.W: C.keyFaster = true; break;
            case KEY.LEFT: case KEY.A: C.keyLeft   = true; break;
            case KEY.DOWN: case KEY.S: C.keySlower = true; break;
            case KEY.RIGHT:case KEY.D: C.keyRight  = true; break;
          }
      }).on(anm.C.X_KUP, function(evt) {
          switch(evt.key) {
            case KEY.UP:   case KEY.W: C.keyFaster = false; break;
            case KEY.LEFT: case KEY.A: C.keyLeft   = false; break;
            case KEY.DOWN: case KEY.S: C.keySlower = false; break;
            case KEY.RIGHT:case KEY.D: C.keyRight  = false; break;
          }
      })
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
                              .modify(function(t) {
                                if(!s) return;
                                this.angle = Util.toRadians(13/12*s.player.speed/100 - 105); // scale
                              })

      var speedometerFull = b().circle([0,canvas.height-hudHeight/2-hudWidth/2-20],hudWidth/2)
                               .fill("rgba(0,0,0,.9)")                         
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
                        .add(genElem(positionDisp    , [ margin, 0            ], "1 / " + C.numRacers                   , "Position"      ))
                        .add(genElem(lapCounter      , [ margin, 0            ], "1 / " + C.numLaps                     , "Lap"        , 0))
                        .add(genElem(curLapTimeDisp  , [ margin, yOffset      ], "00:00.00"                           , "Current Lap"   ))
                        .add(genElem(fastLapTimeDisp , [ margin, yOffset*2    ], formatTime(Dom.storage.fast_lap_time), "Fastest Lap"   ))
                        .add(genElem(lastLapTimeDisp , [ margin, yOffset*3    ], "00:00.00"                           , "Last Lap"      ))
                        .add(speedometerFull)

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
        var pos   = label?pos: [ pos[0] + labelHeight, pos[1] + labelHeight ];
        return elem.text(pos,val,label?labelHeight:valueHeight,font).move([offX,offY]).fill(color);
      }
                        
      
      hud.modify(function(t) {
        if (s.player.z > s.camera.playerZ) {
          if (s.lap > curLap) {
            curLap = s.lap;
            if(curLap > C.numLaps) {
              // TODO: End game
            } else {
              changeText(lapCounter,[margin,0],s.lap + " / " + C.numLaps,false,0);
              if(s.lastLapTime <= Util.toFloat(Dom.storage.fast_lap_time) && s.lastLapTime > 0) {
                Dom.storage.fast_lap_time = s.lastLapTime;
                changeText(fastLapTimeDisp,[margin,yOffset*2],"" + formatTime(s.lastLapTime),false);
              }
              changeText(lastLapTimeDisp,[margin,yOffset*3],"" + formatTime(s.lastLapTime),false);
            }
          }
        }
        changeText(speedometerText,[0,0],Math.round(s.player.speed/100) + " mph",false,-67,10);
        changeText(curLapTimeDisp,[margin,yOffset],"" + formatTime(s.currentLapTime),false);
      });
      scene.add(hud);

      var racer = createPlayer(canvas.id, {
        "debug": true,
        "mode" : anm.C.M_DYNAMIC,
        "anim" : {
          "fps": 60, 
          "bgcolor" : { color : "#72D7EE" }
        } 
      }).load(scene);

      racer.play();
    });
  },

  //---------------------------------------------------------------------------

  loadImages: function(names, callback) { // load multiple images and callback when ALL images have loaded
    var result = [];
    var count  = names.length;

    var onload = function() {
      if (--count == 0)
        callback(result);
    };

    for(var n = 0 ; n < names.length ; n++) {
      var name = names[n];
      result[n] = document.createElement('img');
      Dom.on(result[n], 'load', onload);
      result[n].src = "js/games/racer/images/" + name + ".png";
    }
  },

  //---------------------------------------------------------------------------

  playMusic: function() {
    var music = Dom.get('music');
    music.loop = true;
    music.volume = 0.05; // shhhh! annoying music!
    music.muted = (Dom.storage.muted === "true");
    music.play();
    Dom.toggleClassName('mute', 'on', music.muted);
    Dom.on('mute', 'click', function() {
      Dom.storage.muted = music.muted = !music.muted;
      Dom.toggleClassName('mute', 'on', music.muted);
    });
  }

}

Game.initGame = function(mode,duration,aiName) {
  Game.run();
}

//=========================================================================
// canvas rendering helpers
//=========================================================================

var Render = {

  polygon: function(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  },

  //---------------------------------------------------------------------------

  segment: function(ctx, width, lanes, x1, y1, w1, x2, y2, w2, fog, color) {

    var r1 = Render.rumbleWidth(w1, lanes),
        r2 = Render.rumbleWidth(w2, lanes),
        l1 = Render.laneMarkerWidth(w1, lanes),
        l2 = Render.laneMarkerWidth(w2, lanes),
        lanew1, lanew2, lanex1, lanex2, lane;
    
    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, width, y1 - y2);
    
    Render.polygon(ctx, x1-w1-r1, y1, x1-w1, y1, x2-w2, y2, x2-w2-r2, y2, color.rumble);
    Render.polygon(ctx, x1+w1+r1, y1, x1+w1, y1, x2+w2, y2, x2+w2+r2, y2, color.rumble);
    Render.polygon(ctx, x1-w1,    y1, x1+w1, y1, x2+w2, y2, x2-w2,    y2, color.road);
    
    if (color.lane) {
      lanew1 = w1*2/lanes;
      lanew2 = w2*2/lanes;
      lanex1 = x1 - w1 + lanew1;
      lanex2 = x2 - w2 + lanew2;
      for(lane = 1 ; lane < lanes ; lanex1 += lanew1, lanex2 += lanew2, lane++)
        Render.polygon(ctx, lanex1 - l1/2, y1, lanex1 + l1/2, y1, lanex2 + l2/2, y2, lanex2 - l2/2, y2, color.lane);
    }
    
    Render.fog(ctx, 0, y1, width, y2-y1, fog);
  },

  //---------------------------------------------------------------------------

  background: function(ctx, background, width, height, layer, rotation, offset) {

    rotation = rotation || 0;
    offset   = offset   || 0;

    var imageW = layer.w/2;
    var imageH = layer.h;

    var sourceX = layer.x + Math.floor(layer.w * rotation);
    var sourceY = layer.y
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

  sprite: function(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY, offsetX, offsetY, clipY,isCar) {
    var spriteScale = C.SPRITES.SCALE;
    var destW  = (sprite.w * scale * width/2) * (spriteScale * roadWidth);
    var destH  = (sprite.h * scale * width/2) * (spriteScale * roadWidth);

    destX = destX + (destW * (offsetX || 0));
    destY = destY + (destH * (offsetY || 0));

    var clipH = clipY ? Math.max(0, destY+destH-clipY) : 0;
    if (clipH < destH)
      ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h*clipH/destH), destX, destY, destW, destH - clipH);

  },

  //---------------------------------------------------------------------------

  player: function(ctx, width, height, resolution, roadWidth, sprites, speedPercent, scale, destX, destY, steer, updown) {
    var bounce = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1,1]);
    var sprite;
    updown = updown < 5 ? (updown < -11 ? 0 : 1) : 2; // custom tuned, what feels right
    var dx = s.player.dx*100;
    var lrOrient = Math.abs(dx-0);
    if (lrOrient < .1) lrOrient = 0;
    else               lrOrient = Util.clamp(0,Math.ceil(lrOrient),2) * Util.getSign(dx);

    sprite = C.SPRITES.CAR_ORIENT[updown][lrOrient+3];
    Render.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY + bounce, -0.5, -1,null,true);
  },

  //---------------------------------------------------------------------------

  fog: function(ctx, x, y, width, height, fog) {
    if (fog < 1) {
      ctx.globalAlpha = (1-fog)
      ctx.fillStyle = C.COLORS.FOG;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1;
    }
  },

  rumbleWidth:     function(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(6,  2*lanes); },
  laneMarkerWidth: function(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(32, 8*lanes); }

}

//=============================================================================
// RACING GAME CONSTANTS
//=============================================================================

var KEY = {
  LEFT:  37,
  UP:    38,
  RIGHT: 39,
  DOWN:  40,
  A:     65,
  D:     68,
  S:     83,
  W:     87
};

//-------------------------------------------------------------------------

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

//=========================================================================
// RENDER THE GAME WORLD
//=========================================================================
function render(ctx) {
  if(!s) return;
  var baseSegment   = Core.findSegment(s.player.z);
  var basePercent   = Util.percentRemaining(s.player.z, C.segmentLength);
  var playerSegment = Core.findSegment(s.player.z+s.camera.playerZ);
  var playerPercent = Util.percentRemaining(s.player.z+s.camera.playerZ, C.segmentLength);
  var playerY       = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
  var maxy          = height;

  var x  = 0;
  var dx = - (baseSegment.curve * basePercent);

  ctx.clearRect(0, 0, width, height);

  Render.background(ctx, background, width, height, C.BACKGROUND.SKY,   skyOffset,  resolution * skySpeed  * playerY);
  Render.background(ctx, background, width, height, C.BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY);
  Render.background(ctx, background, width, height, C.BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);

  var n, i, segment, car, sprite, spriteScale, spriteX, spriteY;

  for(n = 0 ; n < s.camera.drawDistance ; n++) {
    segment        = C.segments[(baseSegment.index + n) % C.segments.length];
    segment.looped = segment.index < baseSegment.index;
    segment.fog    = Util.exponentialFog(n/s.camera.drawDistance, s.camera.fogDensity);
    segment.clip   = maxy;
    Util.project(segment.p1, (s.player.x * C.roadWidth) - x,      playerY + s.camera.height , s.player.z - (segment.looped ? C.trackLength : 0), s.camera.depth, width, height, C.roadWidth);
    Util.project(segment.p2, (s.player.x * C.roadWidth) - x - dx, playerY + s.camera.height, s.player.z - (segment.looped ? C.trackLength : 0), s.camera.depth, width, height, C.roadWidth);

    x  = x + dx;
    dx = dx + segment.curve;

    if ((segment.p1.camera.z <= s.camera.depth)      || // behind us
        (segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
        (segment.p2.screen.y >= maxy))                  // clip by (already rendered) hill
    {
      continue;
    }

    Render.segment(ctx, width, lanes,
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

  for(n = (s.camera.drawDistance-1) ; n > 0 ; n--) {
    segment = C.segments[(baseSegment.index + n) % C.segments.length];

    for(i = 0 ; i < segment.cars.length ; i++) {
      car         = segment.cars[i];
      sprite      = car.sprite;
      spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
      spriteX     = Util.interpolate(segment.p1.screen.x,     segment.p2.screen.x,     car.percent) + (spriteScale * car.offset * C.roadWidth * width/2);
      spriteY     = Util.interpolate(segment.p1.screen.y,     segment.p2.screen.y,     car.percent);
      Render.sprite(ctx, width, height, resolution, C.roadWidth, sprites, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip, true);
    }

    for(i = 0 ; i < segment.sprites.length ; i++) {
      sprite      = segment.sprites[i];
      spriteScale = segment.p1.screen.scale;
      spriteX     = segment.p1.screen.x + (spriteScale * sprite.offset * C.roadWidth * width/2);
      spriteY     = segment.p1.screen.y + (sprite.source == C.SPRITES.COLUMN ? spriteScale*60000 : 0);
      Render.sprite(ctx, width, height, resolution, C.roadWidth, sprites, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
    }

    if (segment == playerSegment) {
      Render.player(ctx, width, height, resolution, C.roadWidth, sprites, s.player.speed/C.maxSpeed,
                    s.camera.depth/s.camera.playerZ,
                    width/2,
                    (height/2) - (s.camera.depth/s.camera.playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height/2),
                    s.player.speed * (C.keyLeft ? -1 : C.keyRight ? 1 : 0),
                    playerSegment.p2.world.y - playerSegment.p1.world.y);
    }
  }
}
return Game;

});