define(['backbone', 'handlebars'], function (Backbone, Handlebars) {
    var SettingsView = Backbone.View.extend({
        // Tag definition
        el : "#settings",

        // Template definition
        template : Handlebars.compile(getTemplate("settings-template")),

        // Function overrides
        initialize : function(args) {
            globalEvents.on('usersSelectedEvent', this.updateView, this);
        },
        render : function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
        events: {
            'click button#start': 'launchGame',
            'usersSelectedEvent': 'updateView'
        },
        launchGame : function(evt) {
            this.$el.trigger('gameLaunchEvent',this.model);
        },
        updateView : function(evt, model) {
            if(this.model != model) this.model = model;
            this.render();
        }
    });

    return SettingsView;
});