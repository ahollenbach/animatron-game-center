require.config({
    baseUrl: "/js/",
    paths: {
        jquery     : 'libs/jquery-1.9.1',
        underscore : 'libs/underscore-1.4.4',
        backbone   : 'libs/backbone-1.0.0'
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

require([ 
    'GameCenter',
], function(GameCenter) {
    var gameCenter = new GameCenter;
    Backbone.history.start();
});