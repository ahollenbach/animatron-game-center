var GamesCollection = Backbone.Collection.extend({
    model        : Game,

    singlePlayer : function() {
        return this.filter(function(game) {
            return game.get('singlePlayer');
        });
    }
    multiPlayer : function() {
        return this.filter(function(game) {
            return game.get('multiPlayer');
        });
    }
});