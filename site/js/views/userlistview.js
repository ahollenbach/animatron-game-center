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
        this.illuminateIcon($(evt.toElement));
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