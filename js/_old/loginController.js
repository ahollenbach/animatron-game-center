App.LoginController = Ember.ObjectController.extend({
  loginUser: function() {
        var box = document.querySelector("#messages");
        var input = document.querySelector("#input-message");
        var game,playerId,playerName,opponentName;

        createConn($("button[name=login]").val());

        initChat(ws, input);

        function addMessageToBox(message) {
            box.appendChild(document.createTextNode((box.value == "" ? "" : "\n") + message));
            box.scrollTop = box.scrollHeight;
        }

        function initUserList(users) {
            var html = "<ul class=\"scroll\">"
            if(users != null) {
                for (var i = 0; i < users.length; i++) {
                    var user = users[i];
                    if(i==0) html += makeUser(user,true);
                    else     html += makeUser(user);
                }
            }
            html += "</ul>";
            document.getElementById("user-list").innerHTML = html;

            //add listener to each user button, onclick invite to game
            var userElems = $('.user');
            for (var i = 0; i < userElems.length; i++) {
                var user = $(userElems[i]);
                attachListener(user);
            }
        }

        function makeUser(user,firstElem) {
            return "<li id=\"" + user + "\" class=\"user" + (firstElem?" firstElem":"") + "\">" + user + "</li>";
        }

        function attachListener(user) {
            user.click(function() {
                var username = this.id;
                sendMessage(ws,ClientMessage.SEND_INVITE,{ inviteeUsername : username, gameType : "Pong" });
            });
        }
  },

  loginGuest: function() {
    loginUser("anon");
  }
});