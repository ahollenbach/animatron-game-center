define(['backbone', 'models/game'], function (Backbone, Game, GameView) {
    var Gallery = Backbone.Collection.extend({
        // Model definition
        model : Game, 

        initialize : function() {
            // this.on("add", function() {
            //     console.log("before: ", games);
            //     games = this.models;
            //     console.log("after: ", games);
            // }, this);
        },

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