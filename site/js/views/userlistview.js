define([
    "backbone",
    "jquery",
    "handlebars",
    "socketio",
    "views/userview",
    "collections/userlist"
  ], function (Backbone, $, Handlebars, io, UserView, UserList) {

var UserListView = Backbone.View.extend({
    el : ".bar.middle",
    url : "/api/users",

    currentGameName : "???",
    selectedUsers : [],
    acceptedUsers : [],
    username : null,
    attributes : null,

    // Socket io connection
    invite : null,

    template: Handlebars.compile(getTemplate("playerselect-template")),

    // Function overrides
    initialize : function() {
        // Global events
        globalEvents.on('gameSelectEvent', this.setView, this);
        globalEvents.on('userConnected', this.addUser, this);
        globalEvents.on('userDisconnected', this.removeUser, this);
        globalEvents.on('inviteeSelected', this.updateSelectedUsers, this);
        globalEvents.on('usernameSet', this.setUsername, this);
        globalEvents.on('userAccepted', this.updateAcceptedUsers, this);
        globalEvents.on('finalizePlayers', this.finalizePlayers, this);

        this.collection = new UserList();
        this.listenTo(this.collection, 'add', this.renderUser);
        this.listenTo(this.collection, 'remove', this.render);
        this.listenTo(this.collection, 'reset', this.render);
    },
    render : function(evt) {
        if(evt.attributes && evt.attributes.maxPlayers) this.attributes = evt.attributes;
        this.$el.html(this.template(this.attributes)); //add num player select
        //else $('#user-list').html("");
        this.collection.each(function(user) { // then players?
            if (user.get("username") != this.username)
                this.renderUser(user);
        }, this);
    },
    // Helper functions
    renderUser : function(user) {
        $('#user-list').append((new UserView({ model : user })).render().el);
    },

    events: {
        'click .playerIcon'   : 'setPlayerIcons',
        'click button#invite' : 'invitePlayers',

        'click .popup accept'   : 'acceptInvite',
        'click .popup decline'  : 'declineInvite', 
    },
    setPlayerIcons : function(evt) {
        this.illuminateIcon($(evt.toElement));
    },
    invitePlayers : function(e) {
        // currentGameName will be changed at some point
        this.selectedUsers.map(function(username) {
            console.log("username: " + username);
            globalEvents.trigger('sendInvite', username, this.currentGameName);
        }, this);
    },
    setView : function(evt) {
        var gameName = evt.attributes.name;
        if(gameName != this.currentGameName) {
            this.collection.fetch({ 
                url   : "/api/users",
                reset : true 
            });
            this.render(evt);
            // Autoselect 1 player
            this.illuminateIcon($('#1p'));
            this.currentGameName = gameName;
        }
    },
    addUser : function(username) {
        console.log("this is the username: " + username);
        this.collection.addUser(username);
    },
    removeUser : function(username) {
        console.log("this is the username: " + username);
        this.collection.removeUser(username);
    },
    updateSelectedUsers : function(username) {
        var index = this.selectedUsers.indexOf(username);
        if (index == -1)
            this.selectedUsers.push(username);
        else
            this.selectedUsers.splice(index, 1);
    },
    setUsername : function(username) {
        this.username = username;
    },
    updateAcceptedUsers : function(username) {
        var index = this.acceptedUsers.indexOf(username);
        if (index == -1) {
            this.acceptedUsers.push(username);
            var user = $("li#" + username);
            user.toggleClass('accepted', true);
            console.log(user);
        }
    },
    finalizePlayers : function(json) {
        globalEvents.trigger("gameLaunchEvent", json, this.acceptedUsers);
    },

    illuminateIcon : function(elm) {
        elm.removeClass("dullify").addClass('illuminate');
        elm.siblings().addClass("dullify").removeClass('illuminate');
        if(elm.id == '1p') {
            //TODO: show AI instead
        }
	}
});

return UserListView;
});