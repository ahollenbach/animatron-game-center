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
                },
                ai: {
                    perfect: {
                        difficulty: 10,
                        file: "game/ai/perfect.js"
                    },
                    mediocre: {
                        difficulty: 3,
                        file: "game/ai/mediocre.js"
                    },
                    you: {
                        difficulty: 1,
                        file: "game/ai/you.js"
                    }
                }
            }
        }
    });

    return Game;
});