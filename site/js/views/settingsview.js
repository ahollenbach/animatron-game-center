define(['backbone', 'handlebars'], function (Backbone, Handlebars) {
    var SettingsView = Backbone.View.extend({
        // Tag definition
        el : "#settings",

        // Template definition
        template : Handlebars.compile(getTemplate("settings-template")),
        modelJSON: {},

        // Function overrides
        initialize : function(args) {
            globalEvents.on('gameSelectEvent', this.setView, this);
        },
        render : function(json) {
            this.$el.html(this.template(json));
            return this;
        },
        events: {
            'click button#start': 'launchGame',
        },
        launchGame : function(evt) {
            globalEvents.trigger('finalizePlayers', modelJSON);
        },
        setView : function(evt) {
            modelJSON = evt.attributes;
            this.render(evt.attributes);
        }
    });

    return SettingsView;
});