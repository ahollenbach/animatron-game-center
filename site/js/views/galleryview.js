define([
    "backbone",
    "views/gameview",
    "collections/gallery"
  ], function (Backbone, GameView, Gallery) {

var GalleryView = Backbone.View.extend({
    el : "#gallery",
    url : "/api/games",

    // Function overrides
    initialize : function() {
        this.collection = new Gallery();
        this.collection.fetch({ url : "/api/games", reset : true });
        this.render();

        this.listenTo(this.collection, 'add', this.renderGame);
        this.listenTo(this.collection, 'reset', this.render);
    },
    render : function() {
        this.$el.html("");
        this.collection.each(function(game) {
            this.renderGame(game);
        }, this);
    },

    // Helper functions
    renderGame : function(game) {
        this.$el.append((new GameView({ model : game })).render().el);
    }
});

return GalleryView;
});