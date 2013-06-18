define(['backbone', 'models/game'], function (Backbone, Game, GameView) {
    var Gallery = Backbone.Collection.extend({
        // Model definition
        model : Game,
        
        // Helper functions
        getSinglePlayerGames : function() {
            return this.filter(function(game) {
                return game.get('singlePlayer');
            });
        },
        getMultiPlayerGames : function() {
            return this.filter(function(game) {
                return game.get('multiPlayer');
            });
        }
    });

    return Gallery;
});