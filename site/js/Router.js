define(['jquery', 'underscore', 'backbone'], function ($, _, Backbone) {

var Router = Backbone.Router.extend({
    routes : {

        ''         : 'index',
        'game/:id' : 'game'

    },

    index  : function(){
        // index page
    },
    game   : function(id){
        // load game element
    },
});
return Router;

});