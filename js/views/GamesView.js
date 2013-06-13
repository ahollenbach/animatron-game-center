define([
    "backbone",
    "views/GameView",
    "collections/GamesCollection"
  ], function (Backbone, GameView, Games) {

var GamesCollectionView = Backbone.View.extend({
    tagName    : 'ul',

    initialize : function() {
        this.render();
    },
    render     : function() {
        this.collection.each(function(game) {
            var gameView = new GameCenter.Views.Game({model : game});
            this.$el.append(gameView.el);
        }, this);
    }
});
return GamesCollectionView;

});