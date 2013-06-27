//=============================================================================
// Pong Game Module
//=============================================================================
require("player");

var Pong = (function() {
    var c = function(p, r) {
        var players = p;
        var room = r;

        console.log(Builder, anm);

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