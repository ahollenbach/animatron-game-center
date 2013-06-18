define(['backbone'], function (Backbone) {
    var Game = Backbone.Model.extend({
        // Default values
        defaults : {
            name         : 'Animatron Game',
            developers   : 'Andrew Hollenbach & Brian Clanton',
            created      : 2013,
            singlePlayer : true,
            multiPlayer  : true
        }
    });

    return Game;
});