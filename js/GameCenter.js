define(['jquery', 'underscore', 'backbone', 
    'Router', 
    'js/collections/GamesCollection.js',
    'js/views/GamesView.js'], 
function ($, _, Backbone, Router, GamesCollection, GamesView) {

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

// Test data
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

GameCenter.Views.Games = GamesView;
var gamesView = new GameCenter.Views.Games({ collection : gameCollection});
$(document.body).append(gamesView.el);

return GameCenter;

});