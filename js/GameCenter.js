define(['jquery', 'underscore', 'backbone', 
    'Router' ],
function ($, _, Backbone, Router) {

//Router.initialize();

var GameCenter = {
    Models: {},
    Collections: {},
    Views: {}
};

// To use later, with external template files
GameCenter.template = function(id){
    return _.template( $('#'+id).html());
};


// require stuff and do it
require([ 'collections/GamesCollection', 'views/GamesView' ], function(GamesCollection, GamesView) {
    var gameCollection = new GameCenter.Collections.Games([
    {
        name         : 'Pong',
        developers   : 'Atari',
        created      : 1972,
        singlePlayer : true,
        multiPlayer  : true
    },
    {
        name         : 'Racing!',
        developers   : 'Andrew Hollenbach & Brian Clanton',
        created      : 2013,
        singlePlayer : true,
        multiPlayer  : false
    }
    ]);

    var gamesView = new GameCenter.Views.Games({ collection : gameCollection});
    $(document.body).append(gamesView.el);
});


return GameCenter;

});