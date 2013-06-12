var GamesView = Backbone.View.extend({
    tagName    : 'ul',

    initialize : function() {
        this.render();
    },
    render     : function() {
        this.collection.each(function(game) {
            var gameView = new GameView({model : game});
            this.$el.append(gameView.el);
        }, this);
    }
});