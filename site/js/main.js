require.config({
    baseUrl: "js/",
    paths: {
        jquery     : 'libs/jquery-1.9.1',
        underscore : 'libs/underscore',
        backbone   : 'libs/backbone',
        handlebars : 'libs/handlebars',
        socketio   : 'libs/socket.io.min',
        moment     : 'libs/moment.min',
        jqueryui   : 'libs/jquery-ui'    },
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
        },
        socketio : {
            exports : "io"
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
    "handlebars",
    "views/globalview"
  ],
  function($, _, Backbone, Handlebars, GlobalView) {
     $(function() {
        _.extend(globalEvents, Backbone.Events);

        // From http://stackoverflow.com/a/11924998/1227632
        Handlebars.registerHelper('times', function(n, block) {
            var accum = '';
            for(var i = 1; i <= n; ++i)
                accum += block.fn(i);
            return accum;
        });


        new GlobalView();
    });

    //Backbone.history.start();
});