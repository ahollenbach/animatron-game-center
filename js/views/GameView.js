define(['backbone', 'handlebars'], function (Backbone, Handlebars) {
    var GameView = Backbone.View.extend({
        // Tag definition
        tagName : 'li',
            className : 'game',

        // Template definition
        nameTemplate : Handlebars.compile(getTemplate("game-template")),

        // Function overrides
        initialize : function(args) {
            //_.bindAll(this, 'changeName');
            //this.model.bind('change:name', this.changeName);
            // binds so changeName is called when model changes
            console.log("bitches and hos");
        },
        render : function() {
            this.$el.html(this.nameTemplate(this.model.toJSON()));
            console.log("sup", this.el);
            // TODO: hash this out a bit more
            return this;
        },

        // Event definitions and handlers
        events : {
            'click' : 'enterGame'
        },
        enterGame : function() {
            // TODO: handle click
            console.log(this.model.get('name') + " was clicked.");
        } 
    });

    return GameView;
});