define(['backbone', 'handlebars', 'socketio', 'moment',
    'views/galleryview',
    'views/userlistview',
    'views/settingsview',
    'views/sessionview'], 
function (Backbone, Handlebars, io, moment, GalleryView, UserListView, SettingsView, SessionView) {
    var GlobalView = Backbone.View.extend({
        el: 'body',

        username : null,

        timeFormat : "[(]h:mm:ss A[)] ",

        // Socket.io stuff
        baseURL : "http://192.168.40.73",
        chat : null,
        invite : null,

        // Function overrides
        initialize : function(args) {
            //=================================================================
            // Deal with the sliding bars. Yuck.
            //=================================================================
            
            // size of the smallest non-zero element
            const widths = [ 100, 35, 25 ];
            
            $(".dropdown").height("100%");
            $("#message-box").height("0");

            $(".bar").on("click", function(evt) {
                setWidths(this);
            });

            function setWidths(elm) {
                var bars = $("#bars"), active = $(elm);

                // Make sure proper number of bars are set visible
                var visibleBars = bars.children(".visible").length;
                if($(elm).index() == visibleBars-1 && visibleBars < 3 && active.hasClass("active")) {
                    bars.children().removeClass("active");
                    active = bars.children().eq(visibleBars++).addClass("visible").addClass("active");
                } else {
                    bars.children().removeClass("active");
                    active.addClass("active");
                }
                
                // Adjust the widths
                bars.children().each(function() {
                    if(!$(this).hasClass("active")) {
                        $(this).animate({width: widths[visibleBars-1] + "%"},EASE_LEN, EASING);
                    }
                });
                active.animate({width: 100-(widths[visibleBars-1]*(visibleBars-1)) + "%"},EASE_LEN, EASING);
            }

            // Start with gallery of games
            new GalleryView();
        },

        // Event definitions and handlers
        events : {
            'click #dropdownToggle' : 'toggleDropdown',
            'click #chatToggle'     : 'toggleChat',
            'click #login button'   : 'login',

            'keydown #chat-message' : 'sendChatMessage',

            'gameSelectEvent' : 'setGame',
            'gameLaunchEvent' : 'launchGame'
        },
        toggleDropdown: function(evt) {
            var dropdown = $(".dropdown");
            if     (dropdown.hasClass("inactive")) dropdown.removeClass("inactive").addClass("active")  .animate({height: "40%"}, EASE_LEN, EASING);
            else if(dropdown.hasClass("active"))   dropdown.removeClass("active")  .addClass("inactive").animate({height: "0%" }, EASE_LEN, EASING);
        },
        toggleChat: function(evt) {
            var box = $("#message-box");
            if     (box.hasClass("inactive")) box.removeClass("inactive").addClass("active")  .animate({height: "330"}, EASE_LEN, EASING);
            else if(box.hasClass("active"))   box.removeClass("active")  .addClass("inactive").animate({height: "0" }, EASE_LEN, EASING);
        },
        login: function(evt) {
            evt.preventDefault();

            var box = $("#message-box");
            if     (box.hasClass("inactive")) box.removeClass("inactive").addClass("active")  .animate({height: "330"}, EASE_LEN, EASING);
            else if(box.hasClass("active"))   box.removeClass("active")  .addClass("inactive").animate({height: "0" }, EASE_LEN, EASING);

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
        setGame : function(evt, model) {
            // Check if multiplayer
            new UserListView();
            new SettingsView({ model : model });
        },
        launchGame : function(evt, model) {
            console.log("wazzup");
            new SessionView({ model : model });

            $('#session-page').css({'margin-left':window.innerWidth})
                              .animate({'margin-left': 0},200,'linear');
            //$("#bars").animate({'margin-left': -window.innerWidth},200,'linear');
            //$("#bars").animate({display:'none'},200,'linear');
            //$(".bar").animate({'margin-left': -window.innerWidth},200,'linear');
            evt.stopImmediatePropagation();
        },

        // Helper functions
        addMessageToBox : function(message) {
            var box = $("#messages");
            box.val(box.val() + (!$.trim(box.val()) ? "" : "\n") + message);
            box.attr("scrollTop", box.attr("scrollHeight"));
        },
        configureSockets : function(username) {
            this.chat = io.connect(this.baseURL + "/chat");
            this.invite = io.connect(this.baseURL + "/invite");

            var that = this;

            // Assign listeners for chat socket
            this.chat.on('user_connected', function(username) {
                console.log(username + " connected");
                that.addMessageToBox(username + " has joined Animatron Game Center");
            });
            this.chat.on('message', function(time, author, message) {
                console.log("got a message");
                that.addMessageToBox(moment(time).format(that.timeFormat) + author +
                    ": " + message);
            });

            // Assign listeners for invite socket
            // TODO: Setup these listeners

            this.chat.emit('connection_success', username);
        }
    });

    return GlobalView;
});