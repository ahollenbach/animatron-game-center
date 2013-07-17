define(['backbone', 'handlebars', 'socketio', 'moment', 'jqueryui',
    'views/galleryview',
    'views/userlistview',
    'views/settingsview',
    'views/sessionview'], 
function (Backbone, Handlebars, io, moment, JQueryUI, GalleryView, UserListView, SettingsView, SessionView) {
    var GlobalView = Backbone.View.extend({
        el: 'body',

        username : null,

        timeFormat : "[(]h:mm:ss A[)] ",

        inviteTemplate  : Handlebars.compile(getTemplate("invite-template")),
        waitingTemplate : Handlebars.compile(getTemplate("waiting-template")),

        // Socket.io stuff
        baseURL  : window.location.origin,
        chat     : null,
        invite   : null,
        game     : null,

        canAcceptInvites : true,

        // Function overrides
        initialize : function(args) {
            $(".bar").on("click", this.setWidths);

            //=============================================================================
            // Global Listeners
            //=============================================================================
            globalEvents.on('gameSelectEvent', this.setGame, this);
            globalEvents.on('gameLaunchEvent', this.launchGame, this);
            globalEvents.on('sendInvite', this.sendInvite, this);

            new GalleryView();
            new UserListView();
            new SettingsView();
            new SessionView();
        },

        // Event definitions and handlers
        events : {
            'click #dropdownToggle' : 'toggleDropdown',
            'click #chatToggle'     : 'toggleChat',
            'click #login button'   : 'login',
            'keydown #login input'  : 'checkForEnter',
            'click .playerIcon'     : 'selectPlayers',

            'keydown #chat-message' : 'sendChatMessage'
        },
        toggleDropdown: function(evt) {
            var dropdown = $(".dropdown");
            if(dropdown.hasClass('fullscreen')) dropdown.removeClass('fullscreen', EASE_LEN, EASING);
            else dropdown.toggleClass("active", EASE_LEN, EASING);
        },
        toggleChat: function(evt) {
            var chatBox = $("#message-box");
            chatBox.toggleClass("active", EASE_LEN, EASING);
        },
        login: function(evt) {
            this.toggleChat();

            // Add user via RESTful API
            var username = $("#login input[name='username']").val().trim();
            var that = this;
            $.post('/api/users', {
                username : username
            }, function(data, textStatus, jqXHR) {
                console.dir(data);
                console.log(textStatus);
                console.dir(jqXHR);

                that.username = username;
                globalEvents.trigger("usernameSet", username);

                that.toggleDropdown();
                that.configureSockets(username);
                sessionStorage.setItem("username", username)
            });
        },
        checkForEnter : function(evt) {
            if (evt.keyCode === 13)
                this.login();
        },
        selectPlayers : function(evt) {
            $(this).siblings().removeClass('selected');
            $(this).addClass('selected');
        },
        sendChatMessage : function(e) {
            if (e.which == 13 && this.chat != null) {
                console.log("sending a message now");

                var m = $("#chat-message");
                if (m.val() != "") {
                    this.chat.emit('message', $.trim(m.val()));
                    m.val("");
                }
            }
        },
        setGame : function(evt) {
        },
        launchGame : function(modelJSON, otherPlayers) {
            if (otherPlayers.length != 0)
                this.game.emit('initiate', modelJSON, otherPlayers);
            else
                globalEvents.trigger('toSessionView', 1, modelJSON);
        },
        sendInvite : function(username, gameId) {
            this.invite.emit('send', username, gameId);
        },
        
        // helpers
        setWidths : function (evt) {
            // size of the smallest non-zero element
            const widths = [ 100, 35, 25 ];

            var bars = $("#bars"), active = $(this), activeChanged = true;
            var visibleBars = bars.children(".visible").length, indexClicked = active.index();

            if(indexClicked == visibleBars-1 && visibleBars < 3 && active.hasClass("active")) {
                bars.children().removeClass("active");
                active = bars.children().eq(visibleBars++).addClass("visible").addClass("active");
            } else if(active.hasClass("active")) {
                activeChanged = false;
            } else {
                bars.children().removeClass("active");
                active.addClass("active");
            }
        
            if(activeChanged) {
                // Adjust widths
                bars.children().each(function() {
                    if(!$(this).hasClass("active")) {
                        $(this).animate({width: widths[visibleBars-1] + "%"},EASE_LEN, EASING);
                    }
                });
                active.animate({width: 100-(widths[visibleBars-1]*(visibleBars-1)) + "%"},EASE_LEN, EASING);
            }
        },
        addMessageToBox : function(message) {
            var box = $("#messages");
            box.val(box.val() + (!$.trim(box.val()) ? "" : "\n") + message);
            box.get(0).scrollTop = box.get(0).scrollHeight;
        },
        configureSockets : function(username) {
            this.chat = io.connect(this.baseURL + "/chat", { 
                'sync disconnect on unload' : true
            });
            this.invite = io.connect(this.baseURL + "/invite");
            this.game = io.connect(this.baseURL + "/game");

            var that = this;

            // Assign listeners for chat socket
            this.chat.on('user_connected', function(username) {
                console.log(username + " connected");

                if (username != that.username)
                    globalEvents.trigger('userConnected', username);
                that.addMessageToBox(username + " has joined Animatron Game Center");
            });
            this.chat.on('user_disconnected', function(username) {
                console.log(username + " disconnected");

                if (username != that.username)
                    globalEvents.trigger('userDisconnected', username);
                that.addMessageToBox(username + " has left Animatron Game Center");
            });
            this.chat.on('message', function(time, author, message) {
                console.log("got a message");
                that.addMessageToBox(moment(time).format(that.timeFormat) + author +
                    ": " + message);
            });
            this.chat.on('server_message', function(message) {
                console.log("got a message from the server");
                that.addMessageToBox(message);
            });

            //TODO: On invite received:
            // data has to have inviter and game attributes
            // Also check the listeners
            this.invite.on('received', function(inviter, gameName){
                if (that.canAcceptInvites) {
                    that.canAcceptInvites = false;
                    console.log(inviter + " has invited you to play " + gameName);
                    
                    that.toggleChat();
                    window.focus();
                    that.$el.append(that.inviteTemplate({ inviter : inviter, game : gameName }));

                    var popup = $("div.curtain");
                    popup.on('click', 'button[value="accept"]', { socket : that.invite }, function(e) {
                        e.data.socket.emit('accept', inviter, gameName);
                        $(".invite.popup").html(that.waitingTemplate({ host : inviter }));
                    });
                    popup.on('click', 'button[value="decline"]', { socket : that.invite }, function(e) {
                        e.data.socket.emit('decline', inviter, gameName);
                        console.log("hello, declined");
                        popup.remove();
                    });  
                } else {
                    that.invite.emit('decline', inviter, gameName);
                }
            });

            this.invite.on('accepted', function(invitee, gameName) {
                console.log(invitee + " accepted your invite");
                globalEvents.trigger('userAccepted', invitee);
            });

            this.invite.on('declined', function(invitee, gameName) {
                // TODO: Alert host that the user has declined
            });

            // Assign listeners for game socket
            this.game.on('load', function (modelJSON) {
                globalEvents.trigger('toSessionView', 3, modelJSON);
            });
            this.game.on('start', function (opponentId) {
            });
            this.game.on('state', function (json) {
            });
            this.game.on('end', function (json) {
            });

            this.chat.emit('connection_success', username);
        }
    });

    return GlobalView;
});