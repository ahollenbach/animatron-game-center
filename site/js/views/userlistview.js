define([
    "backbone",
    "handlebars",
    "views/userview",
    "collections/userlist"
  ], function (Backbone, Handlebars, UserView, UserList) {

var UserListView = Backbone.View.extend({
    el : ".bar.middle",
    url : "/api/users",

    curGameId : 0,

    template: Handlebars.compile(getTemplate("playerselect-template")),

    // Function overrides
    initialize : function() {
        globalEvents.on('gameSelectEvent', this.setView, this);


        this.collection = new UserList();
        this.listenTo(this.collection, 'add', this.renderUser);
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
        'click .playerIcon' : 'setPlayerIcons'
    },
    setPlayerIcons : function(evt) {
        $(evt.toElement).removeClass("dullify").addClass('illuminate');
        $(evt.toElement).siblings().addClass("dullify").removeClass('illuminate');
    },
    setView : function(evt) {
        var evtId = evt.attributes._id;
        if(evtId != this.curGameId) {
            this.collection.fetch({ url : "/api/users", reset : true });
            this.render(evt);
            // Autoselect 1 player
            $('#1p').removeClass('dullify').addClass('illuminate');
            this.curGameId = evtId;
        }
    }
});

return UserListView;
});