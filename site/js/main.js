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
var centrifugal = .3
function getTemplate(id) {
    return $("#" + id).html();
}

var globalEvents = {};

// Backdoor for testing
function ps() {
    globalEvents.trigger('toSessionView', 1, { name: "Pong", duration: { type: 'point', cond: 5} });
}

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

    // Hide some stuff when the cursor hasn't moved
    // Thanks to Joseph Wegner: https://gist.github.com/josephwegner/1228975
    $(document).ready(function() {  
        var idleTimer;
        var forceHide = false;
        var body = $('body'), toggles = $('.toggle');
 
        body.css('cursor', 'none');
        toggles.css('visibility', 'hidden');
 
        body.mousemove(function(ev) {
            if(!forceHide) {
                body.css('cursor', '');
                toggles.css('visibility', 'visible'); 
                clearTimeout(idleTimer); 
                idleTimer = setTimeout(function() {
                    body.css('cursor', 'none');
                    toggles.css('visibility', 'hidden');

                    forceHide = true;
                    setTimeout(function() { forceHide = false; }, 200);
                }, 1000);
            }
        });
    });
});