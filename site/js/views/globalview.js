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

        // Socket.io stuff
        baseURL : window.location.origin,
        chat   : null,
        invite : null,
        gameConn : null,
        game     : null,

        // Function overrides
        initialize : function(args) {
            $(".bar").on("click", this.setWidths);

            //=============================================================================
            // Global Listeners
            //=============================================================================
            globalEvents.on('gameSelectEvent', this.setGame, this);
            globalEvents.on('gameLaunchEvent', this.launchGame, this);

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
            evt.preventDefault();

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
                that.toggleDropdown(null);
                that.configureSockets(username);
            });
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
        launchGame : function(evt) {
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
            this.gameConn = io.connect(this.baseURL + "/game");

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

            // Assign listeners for game socket
            this.gameConn.on('load', function (opponentUsername) {
                //game = initGame();
            });
            this.gameConn.on('start', function (opponentId) {
            });
            this.gameConn.on('state', function (json) {
            });
            this.gameConn.on('end', function (json) {
            });



            this.chat.emit('connection_success', username);
        }
    });

    return GlobalView;
});