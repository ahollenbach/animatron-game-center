require.config({
    baseUrl: "js/",
    paths: {
        jquery     : 'libs/jquery-1.9.1',
        underscore : 'libs/underscore',
        backbone   : 'libs/backbone'
    },
    shim: {
        underscore: {
            exports : '_'
        },
        backbone: {
            deps    : ["underscore", "jquery"],
            exports : "Backbone"
        }
    }
});

var games = [
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

//var gamesView = new GameCenter.Views.Games({ collection : gameCollection});
//$(document.body).append(gamesView.el);

require(
  ["jquery",
    "underscore",
    "backbone",
    "views/gamesview"
  ],
  function($, _, B, GamesView) {
     $(function() {
      new GamesView(games);
    });

    //var gameCenter = GameCenter;
    //Backbone.history.start();
});