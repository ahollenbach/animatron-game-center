define([
    "backbone",
    "views/userview",
    "collections/userlist"
  ], function (Backbone, UserView, UserList) {

var UserListView = Backbone.View.extend({
    el : "#user-list",
    url : "/api/users",

    // Function overrides
    initialize : function() {
        globalEvents.on('gameSelectEvent', this.updateView, this);
    },
    render : function() {
        this.$el.html("");
        this.collection.each(function(user) {
            this.renderUser(user);
        }, this);
    },
    // Helper functions
    renderUser : function(user) {
        this.$el.append((new UserView({ model : user })).render().el);
    },
    events: {
        'gameSelectEvent' : 'updateView'
    },

    updateView : function(evt, model) {
        this.collection = new UserList();
        this.collection.fetch({ url : "/api/users", reset : true });
        this.render();

        this.listenTo(this.collection, 'add', this.renderGame);
        this.listenTo(this.collection, 'reset', this.render);
    }
});

return UserListView;
});