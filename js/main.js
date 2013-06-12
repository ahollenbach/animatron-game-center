require.config({
    // establish short aliases for global requirements
    paths : {
        j : 'libs/jquery-1.9.1',      // JQuery
        u : 'libs/underscore-1.4.4',  // Underscore (modified for AMD)
        b : 'libs/backbone-1.0.0'     // Backbone   (modified for AMD)
    }
});

require([ 
    'GameCenter',
], function(GameCenter) {
    GameCenter.initialize();
});