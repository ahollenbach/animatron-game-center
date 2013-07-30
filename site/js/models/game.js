define(['backbone'], function (Backbone) {
    var Game = Backbone.Model.extend({
        // Default values
        defaults : {
            name         : 'Animatron Game',
            developers   : 'Andrew Hollenbach & Brian Clanton',
            created      : 2013,
            numPlayers   : 1,
            settings: {
                duration: {
                    timed    : [1,2,3,4,5],
                    byPoints : [5,10,15,20]
                }
            },
            ai: [
                {
                    name : "Perfect",
                    difficulty: 10,
                    file: "perfect.js"
                },
                {
                    name : "Mediocre",
                    difficulty: 3,
                    file: "mediocre.js"
                },
                {
                    name : "You!",
                    difficulty: 1,
                    file: "you.js"
                }
            ]
        }
    });

    return Game;
});