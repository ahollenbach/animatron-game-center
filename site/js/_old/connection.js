function createConn(username) {
    ws = new WebSocket('ws://192.168.40.73:1337');
    ws.onopen = function() {
        playerName = username;
        ws.send(JSON.stringify({
            type : ClientMessage.INITIAL,
            data : {
                username : username
            }
        }));
    };

    ws.onmessage = function(message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        // console.log(json);

        switch (json.type) {
            case ServerMessage.MESSAGE:
                addMessageToBox(
                    (json.data.author ?
                        "(" + dateFormat(new Date(json.data.time), "mediumTime") + ") " +
                        json.data.author + ": "
                        : "") +
                    json.data.text
                );
                break;

            case ServerMessage.CONNECTION_SUCCESS:
                initUserList(json.data.userList);
                addMessageToBox(json.data.message);
                $("#login").hide();
                $("#lobby").show();
                // start pinging
                var now = new Date().getTime();
                sendMessage(ws,ClientMessage.PING,{timeSent : now});
                break;

            case ServerMessage.SERVER_STOPPED:
                addMessageToBox(json.data.message);
                break;

            case ServerMessage.NEW_USER:
                addMessageToBox(json.data.message);
                var userList = $("ul.scroll");
                var firstElem = (userList.children().length == 0) ? true : false;
                userList.append(makeUser(json.data.username,firstElem));
                var user = $("#"+json.data.username);
                attachListener(user);
                break;

            case ServerMessage.INVITE:
                var sender = json.data.sender;
                var result = confirm(sender + " invites you to play " + json.data.gameType);
                var type = result ? ClientMessage.ACCEPT_INVITE : ClientMessage.DECLINE_INVITE;
                sendMessage(ws,type,{inviterUsername : sender, gameType : json.data.gameType});
                break;

            case ServerMessage.INVITE_DECLINED:
                alert("You were declined by " + json.data.inviteeUsername + ".");
                break;

            case ServerMessage.LOAD_GAME:
                opponentName = json.data.opponentUsername;
                game = initPong(ws, audioContext);
                $("#game").show();
                $("#lobby").hide();
                break;

            case "game_initialization":
                playerId = json.data.id;

                // set player labels
                $("#player1").html((playerId == 0) ? playerName : opponentName);
                $("#player2").html((playerId == 1) ? playerName : opponentName);

                game.startGame(playerId);
                break;

            case "paddle_location":
                game.setOpponentData(json.data.location);
                break;

            case "collision":
                game.updateLocation(json.data.collision);
                break;

            case "point_scored":
                game.setNewScore(json.data.id,json.data.puckInfo);
                break;

            case ServerMessage.USER_LEFT:
                addMessageToBox(json.data.message);
                var element = document.getElementById(json.data.username);
                element.parentNode.removeChild(element);
                break;

            case ServerMessage.CONNECTION_FAILURE:
                addMessageToBox(json.data.message)

                ws.close();
                break;

            case ServerMessage.PING:
                var now = new Date().getTime();
                var ping = now - json.data.timeSent;
                var pingElem = document.getElementById("pingNum")
                if(Math.abs(pingElem.innerHTML - ping) > 2) pingElem.innerHTML = ping;
                sendMessage(ws,ClientMessage.PING,{timeSent : now});
                break;
        }
    };

    ws.onclose = function() {
        addMessageToBox("You have been disconnected from the chat server.");
    };
    return ws;
}