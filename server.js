//=============================================================================
// Mongoose/MongoDB
//=============================================================================
var mongoose = require('mongoose');

// Connect to database
mongoose.connect('mongodb://78.46.229.104:27017/gamecenter');

mongoose.connection.on('error', function (err) {
    console.log(err);
});

// Define schemas
var Game = new mongoose.Schema({
    name : String,
    developers : String,
    created : Date, 
    singlePlayer : Boolean,
    multiPlayer : Boolean
}, { collection : "games" });

var User = new mongoose.Schema({
    username : String,
    inGame : Boolean
}, { collection : "users" });

// Define models
var GameModel = mongoose.model('Game', Game);
var UserModel = mongoose.model('User', User);

// TODO: Modularize this code
//=============================================================================
// User List Module
// Temporary location - will be modularized later
//=============================================================================
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

// TODO: Modularize this code
//=============================================================================
// Game Session List Module 
// Temporary location - will be modularized later
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

//=============================================================================
// Actual Server Stuff
//=============================================================================
// Module dependencies.
var express = require( 'express' ), //Web framework
    path = require( 'path' ); //Utilities for dealing with file paths

var usernameValidator = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;
var onlineUsers = new UserList();
var gameSessions = new GameSessionList();

// Create server
var app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

// Configure server
app.configure( function() {
    //parses request body and populates request.body
    app.use( express.bodyParser() );

    //checks request.body for HTTP method overrides
    app.use( express.methodOverride() );

    //perform route lookup based on url and HTTP method
    app.use( app.router );

    //Favicon
    app.use(express.favicon(path.join(__dirname, 'site/assets/animatron_icon.png')));

    //Where to serve static content
    app.use( express.static( path.join( __dirname, 'site') ) );

    //Also serve the static history file
    app.use( express.static( path.join( __dirname, 'site/history') ) );

    //Show all errors in development
    app.use( express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//Start server
server.listen(1234);
console.log("Server started");

// RESTful API
app.get('/api', function(request, response) {
    response.send("Server online.");
});

// Get list of all game types
app.get('/api/games', function(request, response) {
    return GameModel.find(function(error, games) {
        return !error ? response.send(games) : console.log(error);
    });
});

// Get list of all users
app.get('/api/users', function(request, response) {
    return response.send(onlineUsers.retrieve());
});

// Add a user
app.post('/api/users', function(request, response) {
    // Check that the username using valid syntactical elements
    if (usernameValidator.test(request.body.username)) {
        // Check that the username is not already taken
        UserModel.findOne({ username : request.body.username }, function(error, user) {
            if (error) {
                console.log(error);
                return response.send('500', { 
                    error : "The server was not able to query database for " +
                        request.body.username
                });
            } else if (user) {
                return response.send('400', {
                    error : "Someone has already taken the username " + 
                        request.body.username
                });
            } else {
                var u = new UserModel({
                    username : request.body.username,
                    inGame : false
                });

                // u.save(function(error) {
                //     return console.log(!error ? 'added user ' + request.body.username : error);
                // });

                return response.send(u);
            }
        });
    } else {
        return response.send('400', { 
            error : "The username \"" +
                request.body.username + "\" is invalid.\nUsernames can only consist of alphanumeric characters, underscores, hyphens, and spaces."
        });
    }
});

// Update a user
app.put('/api/users/:id', function(request, response) {
    return UserModel.findById(request.params.id, function(error, user) {
        user.username = request.body.username;
        user.inGame = request.body.inGame;

        return user.save(function(error) {
            if (!error)
                console.log(request.body.username + " is " + 
                    (request.body.inGame ? "" : " not ") + " in game.");
            else
                console.log(error);

            return response.send(user);
        });
    });
});

// TODO: Add a login entry point via RESTful API

// On crash, properly close
app.on('uncaughtException', function (ex) {
    mongoose.disconnect();
    app.close();
});

//=============================================================================
// Socket.io Implementation
//
// As a convention, I am use single quotes for event types and double quotes
// for any other type of string
//=============================================================================
var chat   = io.of("/chat"),
    invite = io.of("/invite"),
    game   = io.of("/game");

// General connection
io.on('connection', function(socket) {
    socket.on('disconnect', function() {
        socket.get("username", function(error, username) {
            if (!error) {
                onlineUsers.remove(username);
                console.log(username + " has disconnected");
                
                io.of("/chat").emit("user_disconnected", username);
            } else {
                console.log("There was an error with finding the username of " +
                    socket.id);
            }
        });
    });
});

// Chat namespace
chat.on('connection', function(socket) {
    console.log("### received a connection to chat");

    socket.on('connection_success', function(username) {
        console.log(username + " has connected to the server.");

        onlineUsers.add(username, socket.id);

        socket.set("username", username, function() {
            socket.emit('user_connected', username);
            socket.broadcast.emit('user_connected', username);
        });      
    });

    socket.on('message', function(message) {
        console.log("i got a message");
        socket.get("username", function(error, username) {
            var time = (new Date()).getTime();

            socket.emit('message', time, 'Me', message);
            socket.broadcast.emit('message', time, username, message);
        });
    });
});

// Invite namespace
invite.on('connection', function(socket) {
    socket.on('send', function(invitee, gameName) {
        console.log("%%%%% received a send message");
        socket.get("username", function(error, inviter) {
            var id = onlineUsers.getId(invitee);
            invite.socket(id).emit('received', inviter, gameName);
        });
    });

    socket.on('accept', function(inviter, gameName) {
        // TODO: Add bot users to a room of some sort
        socket.get("username", function(error, invitee) {
            var id = onlineUsers.getId(inviter);
            invite.socket(id).emit('accepted', invitee, gameName);
        });
    });

    socket.on('decline', function(inviter, gameName) {
        // TODO: Allow user to invite another user 
        socket.get("username", function(error, invitee) {
            var id = onlineUsers.getId(inviter);
            invite.socket(id).emit('declined', invitee, gameName);
        });   
    });
});

// Game namespace
game.on('connection', function(socket) {
    socket.on('initiate', function(gameData, players) {
        socket.get("username", function(error, username) {
            players.splice(0, 0, username);
            var id = gameSessions.addGameSession(gameData.name, players);

            players.forEach(function(player) {
                onlineUsers.setGameId(player, id);
                var socketId = onlineUsers.getId(player);
                game.socket(socketId).join(id);
            });

            game.in(id).emit('load', gameData);
        });
    });

    socket.on('confirmation', function() {
        socket.get("username", function(error, username) {
            var id = onlineUsers.getGameId(username);
            gameSessions.addConfirmation(id, username);

            if (gameSessions.getConfirmationStatus(id)) {
                // Will change to be dynamic, for now, just Pong
                var game = new Pong(gameSessions.getPlayers(id), id);
                gameSessions.setGame(id, game);
                game.init();
            }
        });
    });

    socket.on('state', function(id, state) {
        console.log(state);
        socket.get("username", function(error, username) {
            gameSessions.processState(onlineUsers.getGameId(username), id, state);
        });
    });
});

// TODO: Modularize this code
//=============================================================================
// Pong Game Module
// Temporary location - will be modularized later
//=============================================================================
var Pong = (function() {
    var c = function(p, r) {
        var players = p;
        var room = r;

        this.init = function() {
            players.forEach(function(player, id) {
                game.socket(onlineUsers.getId(player)).emit('start', id);
            });
        }

        this.updateState = function(id, state) {
            game
                .socket(onlineUsers.getId(players[id]))
                .broadcast.to(room)
                .emit('state', id, state);
        };
    };

    return c;
})();