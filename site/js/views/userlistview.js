define([
    "backbone",
    "handlebars",
    "views/userview",
    "collections/userlist"
  ], function (Backbone, Handlebars, UserView, UserList) {

var UserListView = Backbone.View.extend({
    el : ".bar.middle",
    url : "/api/users",

    template: Handlebars.compile(getTemplate("playerselect-template")),

    // Function overrides
    initialize : function() {
        globalEvents.on('gameSelectEvent', this.updateView, this);
    },
    render : function(evt) {
        console.log(evt)
        if(evt.attributes) this.$el.html(this.template(evt.attributes)); //add num player select
        else $('#user-list').html("");
        this.collection.each(function(user) { // then players?
            this.renderUser(user);
        }, this);
    },
    // Helper functions
    renderUser : function(user) {
        $('#user-list').append((new UserView({ model : user })).render().el);
    },
    events: {
        'click .playerIcon' : 'setPlayerIcons',
        'gameSelectEvent' : 'updateView'
    },
    setPlayerIcons : function(evt) {
        console.log($(evt.toElement))
        $(evt.toElement).removeClass("dullify").addClass('illuminate');
        $(evt.toElement).siblings().addClass("dullify").removeClass('illuminate');
    },
    updateView : function(evt) {
        this.collection = new UserList();
        this.collection.fetch({ url : "/api/users", reset : true });
        this.render(evt);
        console.log('illuminating')
        $('#1p').removeClass('dullify').addClass('illuminate');

        this.listenTo(this.collection, 'add', this.renderGame);
        this.listenTo(this.collection, 'reset', this.render);
    }
});

return UserListView;
});