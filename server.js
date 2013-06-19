// Module dependencies.
var application_root = __dirname,
    express = require( 'express' ), //Web framework
    path = require( 'path' ), //Utilities for dealing with file paths
    mongoose = require( 'mongoose' ); //MongoDB integration

// Create server
var app = express();

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
var port = 1337;
app.listen( port, function() {
    console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
});

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

            // TODO: Broadcast that user's in game status has changed

            return response.send(user);
        });
    });
});