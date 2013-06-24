define(['backbone', 'handlebars'], function (Backbone, Handlebars) {
    var SessionView = Backbone.View.extend({
        // Tag definition
        el: "#session-page",

        // Template definition
        template : Handlebars.compile(getTemplate("session-template")),
        modelJSON : {},

        // Function overrides
        initialize : function(args) {
            globalEvents.on('gameLaunchEvent', this.setView, this);
        },
        render : function() {
            this.$el.html(this.template(modelJSON));
            return this;
        },
        setView : function(json) {
            modelJSON = json;
            this.render();
            this.$el.addClass("rendered");

            $('#session-page').css({'left':window.innerWidth})
                              .animate({'left': 0},EASE_LEN,EASING);
        }
    });

    return SessionView;
});