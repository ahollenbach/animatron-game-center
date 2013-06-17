define(['backbone'], function (Backbone) {
    var Game = Backbone.Model.extend({
        // Default values
        defaults : {
            id           : -1,
            name         : 'Animatron Game',
            developers   : 'Andrew Hollenbach & Brian Clanton',
            created      : 2013,
            singlePlayer : true,
            multiPlayer  : true
        },

        // Function overrides
        initialize : function() {
            console.log("hello");
        }
    });

    return Game;
});