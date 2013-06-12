(function(){ // setting up custom namespace

window.GameCenter = {
    Models: {},
    Collections: {},
    Views: {}
};

// To use later, with external template files
window.template = function(id){
    return _.template( $('#'   id).html());
};

GameCenter.Models.Game;
GameCenter.Views.Game;

GameCenter.Collections.Games;
GameCenter.Views.Games;

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

var gamesView = new GameCenter.Views.Games({ collection : gameCollection});
$(document.body).append(gamesView.el);

})();