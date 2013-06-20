// Module dependencies.
var application_root = __dirname,
    express = require( 'express' ), //Web framework
    path = require( 'path' ), //Utilities for dealing with file paths
    mongoose = require( 'mongoose' ); //MongoDB integration

// Create server
var app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

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

// Configure server
app.configure( function() {
    //parses request body and populates request.body
    app.use( express.bodyParser() );

    //checks request.body for HTTP method overrides
    app.use( express.methodOverride() );

    //perform route lookup based on url and HTTP method
    app.use( app.router );

    //Where to serve static content
    app.use( express.static( path.join( application_root, 'site') ) );

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
    return UserModel.find(function(error, users) {
        return !error ? response.send(users) : console.log(error);
    });
});

// Add a user
app.post('/api/users', function(request, response) {
    var user = new UserModel({
        username : request.body.username,
        inGame : false
    });

    user.save(function(error) {
        return console.log(!error ? 'added user ' + request.body.username : error);
    });

    // TODO: Broadcast that a new user has been added

    return response.send(user);
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

//=============================================================================
// Socket.io Implementation
//
// As a convention, I am use single quotes for event types and double quotes
// for any other type of string
//=============================================================================
var chat = io.of("/chat"),
    invite = io.of("/invite"),
    game = io.of("/game");

// Chat namespace
chat.on('connection', function(socket) {
    console.log("### received a connection to chat");

    socket.on('connection_success', function(username) {
        console.log(username + " has connected to the server.");

        // Create the socket so that messages can be directed to it from other
        // sockets by username.
        socket.join(username);

        socket.set("username", username, function() {
             socket.broadcast.emit('user_connected', username);
        });      
    });

    socket.on('message', function(message) {
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
            io.of("/chat").in(username).emit('received', inviter, gameName);
        });
    });

    socket.on('accept', function(inviter, gameName) {
        // TODO: Add bot users to a room of some sort
    });

    socket.on('decline', function(invitee, gameName) {
        // TODO: Allow user to invite another user        
    });
});