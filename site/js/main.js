require.config({
    baseUrl: "js/",
    paths: {
        jquery     : 'libs/jquery-1.10.2',
        underscore : 'libs/underscore',
        backbone   : 'libs/backbone',
        handlebars : 'libs/handlebars',
        socketio   : 'libs/socket.io',
        moment     : 'libs/moment',
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
        },
        jqueryui : {
            deps : ["jquery"],
            exports : "jQueryUI"
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

require([
    "backbone",
    "handlebars",
    "views/globalview"
  ],
  function(Backbone, Handlebars, GlobalView) {
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
        $('input[name=username]').focus();
    });

    // Hide some stuff when the cursor hasn't moved
    // Thanks to Joseph Wegner: https://gist.github.com/josephwegner/1228975
    $(document).ready(function() {  
        var idleTimer;
        var forceHide = false;
        var body = $('body')
        var dropdownToggle = $('#dropdownToggle.toggle'), dropdown = $('.dropdown');
        var chatToggle = $('#chatToggle.toggle'), chat = $('#message-box');
        var toggles = $('.toggle');
 
        body.css('cursor', 'none');
        toggles.css('visibility', 'hidden');
 
        body.mousemove(function(ev) {
            if(!forceHide) {
                body.css('cursor', '');
                toggles.css('visibility', 'visible'); 
                clearTimeout(idleTimer); 
                idleTimer = setTimeout(function() {
                    body.css('cursor', 'none');
                    if(!dropdown.hasClass('fullscreen') && !dropdown.hasClass('active')) {
                        dropdownToggle.css('visibility', 'hidden');
                    }
                    if(!chat.hasClass('active')) {
                        chatToggle.css('visibility', 'hidden');
                    }

                    forceHide = true;
                    setTimeout(function() { forceHide = false; }, 200);
                }, 2000);
            }
        });
    });
});