define(['backbone', 'models/user'], function (Backbone, User) {
    var UserList = Backbone.Collection.extend({
        // Model definition
        model : User,
        
        // Helper functions
        getAvailablePlayers : function() {
            return this.filter(function(game) {
                return !game.get('inGame');
            });
        },
        getByUsername: function(username){
            return this.filter(function(user) {
                return user.get("username") === username;
            });
        },
        addUser : function(username) {
            this.add(new User({ username : username }));
        },
        removeUser : function(username) {
            this.remove(this.getByUsername(username));
        }
    });

    return UserList;
});