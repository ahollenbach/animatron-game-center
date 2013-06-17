define([
    "backbone",
    "views/gameview",
    "collections/gallery"
  ], function (Backbone, GameView, Gallery) {

var GalleryView = Backbone.View.extend({
    el : "#gallery",

    // Function overrides
    initialize : function(games) {
        // console.log(games);
        this.collection = new Gallery(games);
        // console.log(this.collection);
        // console.log(this.collection.models.length);
        this.render();
    },
    render : function() {
        this.$el.html("");
        this.collection.each(function(game) {
            this.$el.append((new GameView({model : game})).render().el);
        }, this);
    }
});

return GalleryView;
});