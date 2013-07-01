define(['backbone', 'handlebars'], function (Backbone, Handlebars) {
    var SessionView = Backbone.View.extend({
        // Tag definition
        el: "#session-page",

        // Template definition
        template : Handlebars.compile(getTemplate("session-template")),
        modelJSON : {},

        // Function overrides
        initialize : function(args) {
            globalEvents.on('toSessionView', this.setView, this);
        },
        render : function() {
            this.$el.html(this.template(modelJSON));
            return this;
        },
        setView : function(gameMode, gameInfo) {
            // TODO: THIS IS A HACK, FIX IT
            gameInfo.duration = { type: "point", cond: 7 };

            modelJSON = gameInfo;
            this.render();
            this.$el.addClass("rendered");


            // Add the game to the canvas
            var gameName = gameInfo.name.toLowerCase(); // 'games/' + gameName + "/" + gameName + '.js'
            require(['games/pong/pong'], function(pong) {
                pong.initGame(gameMode, "perfectAI.js",gameInfo.duration);
            });

            $('#session-page').css({'left':window.innerWidth})
                              .animate({'left': 0},EASE_LEN,EASING);
        }
    });

    return SessionView;
});