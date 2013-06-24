define([
    "backbone",
    "handlebars",
    "socketio",
    "views/userview",
    "collections/userlist"
  ], function (Backbone, Handlebars, io, UserView, UserList) {

var UserListView = Backbone.View.extend({
    el : ".bar.middle",
    url : "/api/users",

    curGameId : 0,
    selectedUsers : [],

    // Socket io connection
    invite : null,

    template: Handlebars.compile(getTemplate("playerselect-template")),

    // Function overrides
    initialize : function() {
        this.invite = io.connect(window.location.origin + "/invite");

        this.invite.on('received', function(inviter, gameName){
            // TODO: Alert about received invite and ask if they will accept
            console.log(inviter + " has invited you to play " + gameName);
        });

        // Global events
        globalEvents.on('gameSelectEvent', this.setView, this);
        globalEvents.on('userConnected', this.addUser, this);
        globalEvents.on('userDisconnected', this.removeUser, this);
        globalEvents.on('inviteeSelected', this.updateSelectedUsers, this);

        this.collection = new UserList();
        this.listenTo(this.collection, 'add', this.renderUser);
        this.listenTo(this.collection, 'remove', this.render);
        this.listenTo(this.collection, 'reset', this.render);
    },
    render : function(evt) {
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
        'click .playerIcon'   : 'setPlayerIcons',
        'click button#invite' : 'invitePlayers'
    },
    setPlayerIcons : function(evt) {
        this.illuminateIcon($(evt.toElement));
    },
    invitePlayers : function(e) {
        // curGameId will be changed at some point
        this.selectedUsers.map(function(username) {
            console.log("username: " + username);
            this.invite.emit('send', username, this.curGameId);
        }, this);
    },
    setView : function(evt) {
        var evtId = evt.attributes._id;
        if(evtId != this.curGameId) {
            this.collection.fetch({ url : "/api/users", reset : true });
            this.render(evt);
            // Autoselect 1 player
            this.illuminateIcon($('#1p'));
            this.curGameId = evtId;
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