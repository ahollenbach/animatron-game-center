define(['backbone', 'handlebars'], function (Backbone, Handlebars) {
    var SessionView = Backbone.View.extend({
        // Tag definition
        el: "#session-page",

        // Template definition
        template : Handlebars.compile(getTemplate("session-template")),

        // Function overrides
        initialize : function(args) {
            this.render();
            this.$el.addClass("rendered");
        },
        render : function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    return SessionView;
});