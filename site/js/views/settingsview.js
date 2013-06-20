define(['backbone', 'handlebars'], function (Backbone, Handlebars) {
    var SettingsView = Backbone.View.extend({
        // Tag definition
        el : "#settings",

        // Template definition
        template : Handlebars.compile(getTemplate("settings-template")),

        // Function overrides
        initialize : function(args) {
            this.render();
        },
        render : function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
        events: {
            'click button#start': 'launchGame'
        },
        launchGame : function(evt) {
            this.$el.trigger('gameLaunchEvent',this.model);
        }
    });

    return SettingsView;
});