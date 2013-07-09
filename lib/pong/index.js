//=============================================================================
// Pong Game Module
//=============================================================================
var p = require('player');
var anm = p.anm;
var b = p.b;

var Pong = (function() {
    const WIDTH = 600;
    const HEIGHT = 450;

    var c = function(p, r) {
        var players = p;
        var room = r;

        var puck = b('puck')
            .data({
                x : 
            });

        // console.log(Builder, anm);

        this.init = function() {
            players.forEach(function(player, id) {
                game.socket(onlineUsers.getId(player)).emit('start', id);
            });
        }

        this.updateState = function(id, state) {
            game
                .socket(onlineUsers.getId(players[id]))
                .broadcast.to(room)
                .emit('state', id, state);
        };
    };

    return c;
})();

module.exports = Pong;