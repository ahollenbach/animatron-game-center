define(['jquery', 'underscore', 'backbone', 
    'models/GameModel', 
    'GameCenter'], 
function ($, _, Backbone, Game, GameCenter) {

var GamesCollection =  Backbone.Collection.extend({
    model        : Game,

    singlePlayer : function() {
        return this.filter(function(game) {
            return game.get('singlePlayer');
        });
    },
    multiPlayer : function() {
        return this.filter(function(game) {
            return game.get('multiPlayer');
        });
    }
});

});