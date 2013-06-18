define([
    "backbone",
    "views/userview",
    "collections/UserList"
  ], function (Backbone, GameView, Gallery) {

var UserListView = Backbone.View.extend({
    el : "#user-list",

    // Function overrides
    initialize : function(users) {
        this.collection = new UserList(users);
        this.render();
    },
    render : function() {
        this.$el.html("");
        this.collection.each(function(user) {
            this.$el.append((new UserView({model : user})).render().el);
        }, this);
    }
});

return UserListView;
});