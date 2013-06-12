var GameView = Backbone.View.extend({
    tagName     : 'li',
    className   : 'game',
    nameTemplate: _.template("<b>Name: </b><%= name %>"),


    initialize  : function(args) {
        //_.bindAll(this, 'changeName');
        //this.model.bind('change:name', this.changeName);
        // binds so changeName is called when model changes
        this.render();
    },
    render      : function() {
        this.$el.html(this.nameTemplate(this.model.toJSON()));
        // TODO: hash this out a bit more
    },
    events      : {
        'click' : 'enterGame'
    },
    enterGame : function() {
        // TODO: handle click
    } 
})