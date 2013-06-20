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

//=============================================================================
// Globals
//=============================================================================
const EASE_LEN = 200, EASING = 'linear';
function getTemplate(id) {
    return $("#" + id).html();
}

require(
  ["jquery",
    "underscore",
    "backbone",
    "views/globalview"
  ],
  function($, _, Backbone, GlobalView) {
     $(function() {
        new GlobalView();
    });

    //var gameCenter = GameCenter;
    //Backbone.history.start();
});