define(['jquery', 'underscore', 'backbone', 
    'views/GameView',
    'GameCenter'], 
function ($, _, Backbone, GameView, GameCenter) {

GameCenter.Views.Games = Backbone.View.extend({
    tagName    : 'ul',

    initialize : function() {
        this.render();
    },
    render     : function() {
        require([ 'views/GameView' ], function(GamesView) {

        this.collection.each(function(game) {
            var gameView = new GameCenter.Views.Game({model : game});
            this.$el.append(gameView.el);
        }, this);
        
        });
    }
});

});