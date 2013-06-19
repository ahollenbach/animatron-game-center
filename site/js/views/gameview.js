define(['backbone', 'handlebars'], function (Backbone, Handlebars) {
    var GameView = Backbone.View.extend({
        // Tag definition
        tagName : 'li',
        className : 'game',

        // Template definition
        nameTemplate : Handlebars.compile(getTemplate("game-template")),

        // Function overrides
        initialize : function(args) {
            this.listenTo(this.model, 'change', this.render);
        },
        render : function() {
            this.$el.html(this.nameTemplate(this.model.toJSON()));
            return this;
        },

        // Event definitions and handlers
        events : {
            'click' : 'selectGame'
        },
        selectGame : function() {
            this.$el.removeClass("dullify").trigger('gameSelectEvent',this.model);
            this.$el.siblings().addClass("dullify");
        }
    });

    return GameView;
});