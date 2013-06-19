define(['backbone', 'models/user'], function (Backbone, User) {
    var Gallery = Backbone.Collection.extend({
        // Model definition
        model : User,
        
        // Helper functions
        getAvailablePlayers : function() {
            return this.filter(function(game) {
                return !game.get('inGame');
            });
        }
    });

    return Gallery;
});