define(['backbone', 'handlebars'], function (Backbone, Handlebars) {
    var GameView = Backbone.View.extend({
        // Tag definition
        tagName : 'li',
        className : 'user',

        // Template definition
        nameTemplate : Handlebars.compile(getTemplate("user-template")),

        // Function overrides
        initialize : function(args) {

        },
        render : function() {
            var json = this.model.toJSON();
            this.$el.html(this.nameTemplate(json)).attr('id', json.username);
            return this;
        },

        // Event definitions and handlers
        events : {
            'click' : 'invite'
        },
        invite : function() {
            console.log(this.model.get('username') + " was clicked.");
        } 
    });

    return GameView;
});