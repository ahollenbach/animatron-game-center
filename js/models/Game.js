var Game = Backbone.Model.extend({
    initialize : function() {
        // do something
    },
    defaults : {
        id           : -1,
        name         : 'Animatron Game',
        developers   : 'Andrew Hollenbach & Brian Clanton',
        created      : 2013,
        singlePlayer : true,
        multiPlayer  : true
    }
});