//=============================================================================
// Mongoose/MongoDB
//=============================================================================
var mongoose = require('mongoose');

// Connect to database
mongoose.connect('mongodb://192.168.40.73:27017/gamecenter');

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
            users[username] = { id : id, inGame : false };
        };

        this.remove = function(username) {
            delete users[username];
        };

        this.setInGame = function(username, inGame) {
            if (username.hasOwnProperty(username))
                users[username].inGame = inGame;
        };

        this.isInGame = function(username) {
            return users[username].inGame;
        };

        this.getId = function(username) {
            return users[username].id;
        };

        this.retrieve = function() {
            var list = [];

            for (var u in users)
                list.push(new UserModel({
                    username : u,
                    inGame : users[u].inGame
                }));

            return list;
        };
    };
    
    return c;
})();

// TODO: Modularize this code
//=============================================================================
// Pong Game Module
// Temporary location - will be modularized later
//=============================================================================



//=============================================================================
// Actual Server Stuff
//=============================================================================
// Module dependencies.
var express = require( 'express' ), //Web framework
    path = require( 'path' ); //Utilities for dealing with file paths

var usernameValidator = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;
var onlineUsers = new UserList();

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

    //Show all errors in development
    app.use( express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//Start server
server.listen(80);
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
        socket.get("username", function(error, inviter) {
            var id = onlineUsers.getId(username);
            io.sockets.socket(id).emit('received', inviter, gameName);
        });
    });

    socket.on('accept', function(inviter, gameName) {
        // TODO: Add bot users to a room of some sort
    });

    socket.on('decline', function(invitee, gameName) {
        // TODO: Allow user to invite another user        
    });
});