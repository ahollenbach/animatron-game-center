require.config({
    baseUrl: "js/",
    paths: {
        jquery     : 'libs/jquery-1.9.1',
        underscore : 'libs/underscore',
        backbone   : 'libs/backbone',
        handlebars : 'libs/handlebars',
        jqueryui   : 'libs/jquery-ui'
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
const EASE_LEN = 200, EASING = 'easeInOutCubic';
function getTemplate(id) {
    return $("#" + id).html();
}

var globalEvents = {};

require(
  ["jquery",
    "underscore",
    "backbone",
    "views/globalview"
  ],
  function($, _, Backbone, GlobalView) {
     $(function() {
        _.extend(globalEvents, Backbone.Events);

        new GlobalView();

        
    });

    //Backbone.history.start();
});