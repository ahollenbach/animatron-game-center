define(['backbone', 'handlebars'], function (Backbone, Handlebars) {
    var UserView = Backbone.View.extend({
        // Tag definition
        tagName : 'li',
            className : 'user',

        // Template definition
        nameTemplate : Handlebars.compile(getTemplate("user-template")),

        // Function overrides
        initialize : function(args) {
            this.listenTo(this.model, 'change', this.render);
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
            this.$el.toggleClass("selected");
            console.log(this.model.get('username') + " was clicked.");

            globalEvents.trigger('inviteeSelected', this.model.get("username"));
        } 
    });

    return UserView;
});