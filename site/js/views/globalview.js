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
        chat : null,
        invite : null,

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

            'keydown #chat-message' : 'sendChatMessage',

            'gameSelectEvent' : 'setGame',
            'gameLaunchEvent' : 'launchGame'
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

            var chatBox = $("#message-box");
            if     (chatBox.hasClass("inactive")) chatBox.removeClass("inactive").addClass("active")  .animate({height: "330"}, EASE_LEN, EASING);
            else if(chatBox.hasClass("active"))   chatBox.removeClass("active")  .addClass("inactive").animate({height: "0" }, EASE_LEN, EASING);

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
            this.drawPlayerSelect(evt.attributes.singlePlayer,evt.attributes.multiPlayer);        
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
        drawPlayerSelect: function(singlePlayer,multiPlayer) {
            var canvas = document.getElementById('singlePlayer');
            canvas.width = canvas.height;
            var h=canvas.height,w=canvas.width,m=w/3,y=h/2+m,r=m/2,x; //m is model width, height should be m*2

            if(!singlePlayer) $(canvas).addClass('disabled');
            else $(canvas).removeClass('disabled');
            var ctx = canvas.getContext('2d');
            setStyle(ctx);
            drawModel(ctx,x=w/2-m/2,y,r,m);

            canvas = document.getElementById('multiPlayer');
            canvas.width = canvas.height;
            if(!multiPlayer) $(canvas).addClass('disabled');
            else $(canvas).removeClass('disabled');
            ctx = canvas.getContext('2d');
            setStyle(ctx);
            x = w/8; var limit = x+5*m/4;
            for(;x<=limit;x+=5*m/4) {
                drawModel(ctx,x,y,r,m);
            }

            function drawModel(ctx,x,y,r,m) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.bezierCurveTo(x, y-3*m/2, x+m, y-3*m/2, x+m, y);
                ctx.closePath();
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(x+m/2, y-h/2-r/3, r, 0, 2 * Math.PI, false);
                ctx.stroke();
            }

            function setStyle(ctx) {
                ctx.strokeStyle = 'black';
                ctx.fillStyle = '#F2F2F2';
                ctx.lineWidth = w/30;
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

            var that = this;

            // Assign listeners for chat socket
            this.chat.on('user_connected', function(username) {
                console.log(username + " connected");
                that.addMessageToBox(username + " has joined Animatron Game Center");
            });
            this.chat.on('user_disconnected', function(username) {
                console.log(username + " disconnected");
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

            // Assign listeners for invite socket
            // TODO: Setup these listeners

            this.chat.emit('connection_success', username);
        }
    });

    return GlobalView;
});