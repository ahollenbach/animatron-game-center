//=============================================================================
// Mongoose/MongoDB
//=============================================================================
var mongoose = require('mongoose');

// Connect to database
mongoose.connect('mongodb://192.168.40.73:27017/gamecenter');
console.log("#$@# Opened connection to database");

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

exports.GameModel = GameModel;
exports.UserModel = UserModel;