// Possible message types that can be received from clients


// Regular expression used to check username validity. The rules are as follows:
// Usernames can consist of lowercase and capitals
// Usernames can consist of alphanumeric characters
// Usernames can consist of underscore and hyphens and spaces
// Cannot be two underscores, two hypens or two spaces in a row
// Cannot have a underscore, hypen or space at the start or end
var usernameValidator = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;

// Module imports
var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;

var lobbyUtils = require('lobby-utils');
var ClientList = lobbyUtils.ClientList;
var GameSessionList = lobbyUtils.GameSessionList;

var Message = require('message');
var ClientMessage = Message.ClientMessage;
var ServerMessage = Message.ServerMessage;

var clients = new ClientList();
var gameSessions = new GameSessionList();

var gameID = 0;
var games = [];

// Open server on port 1337
var wss = new WebSocketServer({port: 1337});

console.log("Server started");

wss.on('connection', function(ws) {
	// var index = clients.push(ws) - 1;
	var username = "Bob Loblaw";
    var game = null;

    // Event handler for incoming messages
    ws.on('message', function(message) {
        // Verify that message is JSON
        try {
            var json = JSON.parse(message);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message);
            return;
        }

        switch (json.type) {
            // Initial message from client, which sends user data such as username
            case ClientMessage.INITIAL:
                // Connect to chat if the username is valid, or else report invalid username and refuse connection
                if (usernameValidator.test(json.data.username)) {
                    if (!clients.hasUser(json.data.username)) {
                        username = json.data.username;
                        console.log(username + " has connected.");

                        // Send connection success message
                        Message.sendMessage(ws, ServerMessage.CONNECTION_SUCCESS, {
                            userList : clients.getUsers(),
                            message : "Welcome to the chat " + username + "."
                        });

                        clients.forEach(function() {
                            Message.sendMessage(this.connection, ServerMessage.NEW_USER, {
                                username : username,
                                message : username + " has joined the chat room."
                            });
                        });

                        clients.pushClient(username, ws, {});

                        logClients();
                    } else {
                       // Send connection failure message, username in use
                        Message.sendMessage(ws, ServerMessage.CONNECTION_FAILURE, {
                            message : "The username \"" + json.data.username + "\" is already in use."
                        });  
                    }
                } else {
                    // Send connection failure message, invalid username
                    Message.sendMessage(ws, ServerMessage.CONNECTION_FAILURE, {
                        message : "The username \"" + json.data.username + "\" is invalid.\nUsernames can only consist of alphanumeric characters, underscores, hyphens, and spaces."
                    });
                }               
                break;

            // Chat message
            case ClientMessage.MESSAGE:
                // Broadcast chat message to all users
                clients.forEach(function() {
                    sendTextMessage(this, username == this.username ? "Me" : username, json.data.message);
                });
                break;

            case ClientMessage.SEND_INVITE:
                var inviteeConnection = clients.getConnection(json.data.inviteeUsername);
                console.log(username + " sent and invite to " + json.data.inviteeUsername);

                if (inviteeConnection)
                    Message.sendMessage(inviteeConnection, ServerMessage.INVITE, {
                        sender : username,
                        gameType : json.data.gameType
                    });
                break;

            case ClientMessage.ACCEPT_INVITE:
                var inviterConnection = clients.getConnection(json.data.inviterUsername);

                if (inviterConnection) {
                    var id = gameSessions.addGameSession(json.data.gameType, [json.data.inviterUsername, username]);
                    clients.addData(json.data.inviterUsername, { gameSessionID : id });
                    clients.addData(username, { gameSessionID : id });

                    Message.sendMessage(ws, ServerMessage.LOAD_GAME, {
                        gameType : json.data.gameType,
                        opponentUsername : json.data.inviterUsername
                    });

                    Message.sendMessage(inviterConnection, ServerMessage.LOAD_GAME, {
                        gameType : json.data.gameType,
                        opponentUsername : username
                    });                    
                }
                break;

            case ClientMessage.DECLINE_INVITE:
                var inviterConnection = clients.getConnection(json.data.inviterUsername);

                if (inviterConnection)
                    Message.sendMessage(inviterConnection, ServerMessage.INVITE_DECLINED, {
                        inviteeUsername : username
                    });
                break;

            case ClientMessage.CONFIRMATION:
                var id = clients.getDataByName(username, "gameSessionID");
                gameSessions.addConfirmation(id, username);

                game = require(gameSessions.getGameSessionType(id));

                if (gameSessions.getConfirmationStatus(id)) {                    
                    var connections = [];
                    gameSessions.getGameSessionPlayers(id).forEach(function(player) {
                        connections.push(clients.getConnection(player));
                    });

                    game.init(connections);
                }
                break;

            case "paddle_location":
            case "collision":
            case "point_scored":
                if (game != null)
                    game.handleMessage(json);
                break;

            // The server just sends back the ping information to the client
            case ClientMessage.PING:
                Message.sendMessage(ws, ServerMessage.PING, json.data);
                break;

            default:
                console.log("Received invalid message type: " + json.type);
                break;
        }          
    });

    // Event handler for closed connection between server and a client
    ws.on('close', function(connection) {
        if (clients.hasUser(username)) {
        	console.log(username + " has disconnected.");

            // Remove disconnected client from list of clients
        	clients.removeClient(username);

            // Tell all clients that the user has left
            clients.forEach(function() {
                Message.sendMessage(this.connection, ServerMessage.USER_LEFT, {
                    username : username,
                    message : username + " has left the chat room."
                });
            });
        	
        	logClients();
        }
    });
});

// Send message to connected clients when closed
process.on("SIGINT", function() {
    console.log("\nServer stopped gracefully via Ctrl + C.");

    clients.forEach(function() {
        if (this.connection.readyState === WebSocket.OPEN)
            Message.sendMessage(this.connection, ServerMessage.SERVER_STOPPED, { 
                message : "The server was manually stopped." 
            });
    });

    wss.close();
    process.exit();
});

// Broadcast messages to users from command line
// process.stdin.resume();
// process.stdin.setEncoding('utf8');

// process.stdin.on('data', function (text) {
//     clients.forEach(function() {
//         if (typeof this.connection !== "undefined" && this.connection.readyState === WebSocket.OPEN)
//             sendTextMessage(this.connection, "Server Admin", text);
//     });

//     console.log("Messaged online users: " + text);
// });

// Logs current number of clients to command line
function logClients() {
	console.log("There are currently " + clients.size() + " clients online.");
}

function sendMessageToUsers(usernames, message) {
    for (var i = 0; i < usernames.length; i++)
        clients.getConnection(usernames[i]).send(message);
}

// Sends message text along with other user information as JSON to a client
function sendTextMessage(client, author, message) {
	if (client.connection.readyState === WebSocket.OPEN) {
        Message.sendMessage(client.connection, ServerMessage.MESSAGE, {
            time : (new Date()).getTime(),
            author : author,
            text : message
        });
    }
}