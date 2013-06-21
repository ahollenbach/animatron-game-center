App = Ember.Application.create();

App.Store = DS.Store.extend({
  revision: 1,
  adapter: DS.RESTAdapter.extend({
    url: 'http://localhost:3000'
  })
});

App.Router.map(function() {
  this.resource('login',{ path: ''       });
  this.resource('lobby',{ path: '/lobby' });
  this.resource('game', { path: '/game'  });
});

App.UserList = Ember.Route.extend({
  username: DS.attr('string'),
  userId:   DS.attr('string')
});