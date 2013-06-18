require.config({
    baseUrl: "js/",
    paths: {
        jquery     : 'libs/jquery-1.9.1',
        underscore : 'libs/underscore',
        backbone   : 'libs/backbone',
        handlebars : 'libs/handlebars'
    },
    shim: {
        underscore: {
            exports : '_'
        },
        backbone: {
            deps    : ["underscore", "jquery"],
            exports : "Backbone"
        }, 
        handlebars : {
            exports : "Handlebars"
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
},
{
    name         : 'Blahdiblah',
    developers   : 'Andrew Hollenbach & Brian Clanton',
    created      : 2013,
    singlePlayer : false,
    multiPlayer  : true
}
];

function getTemplate(id) {
    return $("#" + id).html();
}

//var gamesView = new GameCenter.Views.Games({ collection : gameCollection});
//$(document.body).append(gamesView.el);

require(
  ["jquery",
    "underscore",
    "backbone",
    "views/galleryview"
  ],
  function($, _, Backbone, GalleryView) {
     $(function() {
      new GalleryView(games);
    });

    //var gameCenter = GameCenter;
    //Backbone.history.start();
});