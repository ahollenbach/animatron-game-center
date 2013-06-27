//=============================================================================
// User List Module
//=============================================================================
var UserModel = require('database').UserModel;

var UserList = (function() {
    // Constructor
    var c = function() {
        var users = {};

        this.add = function(username, id) {
            users[username] = { id : id, gameId : -1 };
        };

        this.remove = function(username) {
            delete users[username];
        };

        this.setGameId = function(username, gameId) {
            if (users.hasOwnProperty(username))
                users[username].gameId = gameId;
        };

        this.getGameId = function(username) {
            if (users.hasOwnProperty(username))
                return users[username].gameId;
            return null;
        };

        this.isInGame = function(username) {
            return users[username].gameId != -1;
        };

        this.getId = function(username) {
            return users[username].id;
        };

        this.retrieve = function() {
            var list = [];

            for (var u in users)
                list.push(new UserModel({
                    username : u,
                    inGame : users[u].gameId != -1
                }));

            return list;
        };
    };
    
    return c;
})();

//=============================================================================
// Game Session List Module 
//=============================================================================
var GameSession = (function() {
    var nextID = 0;

    // Constructor
    var c = function(type, players) {
        this.type = type;
        this.players = players;
        this.game = null;

        this.id = nextID++;
        this.confirmations = {};

        for (var i = 0; i < this.players.length; i++)
            this.confirmations[this.players[i]] = false;

        // Returns true if all players have confirmed
        this.allConfirmed = function() {
            var confirmationStatus = true;

            for (var i = 0; confirmationStatus && i < this.players.length; i++)
                confirmationStatus = this.confirmations[this.players[i]];

            return confirmationStatus;
        };
    };

    c.prototype = {
        
    };

    return c;
})();

var GameSessionList = (function() {
    // Constructor
    var c = function() {
        var gameSessions = {};
        var numberOfGames = 0;

        this.size = function() { return numberOfGames; };

        this.addGameSession = function(type, players) {
            var session = new GameSession(type, players);
            gameSessions[session.id] = session;

            return session.id;
        };

        this.removeGameSession = function(id) {
            delete gameSessions[id];
        };

        this.getConfirmationStatus = function(id) {
            return gameSessions[id].allConfirmed();
        };

        this.addConfirmation = function(id, player) {
            gameSessions[id].confirmations[player] = true;
        };

        this.getByType = function(type) {
            var sessionsOfType = [];

            for (var gameSession in gameSessions)
                if (gameSession.type == type)
                    sessionsOfType.push(gameSession);

            return gameSession;
        };

        this.getPlayers = function(id) {
            return gameSessions[id].players;
        };

        this.getType = function(id) {
            return gameSessions[id].type;
        };

        this.setGame = function(id, game) {
            gameSessions[id].game = game;
        }

        this.processState = function(id, playerId, state) {
            gameSessions[id].game.updateState(playerId, state);
        };
    };

    c.prototype = {
        
    };

    return c;
})();

exports.UserList = UserList;
exports.GameSessionList = GameSessionList;