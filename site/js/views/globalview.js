define(['backbone', 'handlebars', 'jqueryui',
    'views/galleryview',
    'views/userlistview',
    'views/settingsview',
    'views/sessionview'],
function (Backbone, Handlebars, JQueryUI, GalleryView, UserListView, SettingsView, SessionView) {
    var GlobalView = Backbone.View.extend({
        el: 'body',

        // Function overrides
        initialize : function(args) {
            //=================================================================
            // Deal with the sliding bars. Yuck.
            //=================================================================
            
            // size of the smallest non-zero element
            const widths = [ 100, 35, 25 ];

            $(".bar").on("click", function(evt) {
                setWidths(this);
            });

            function setWidths(elm) {
                var bars = $("#bars"), active = $(elm), activeChanged = true;
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
            }

            //=============================================================================
            // Global Listeners
            //=============================================================================
            globalEvents.on('gameSelectEvent', this.setGame, this);

            new GalleryView();
            new UserListView();
            new SettingsView();
        },

        // Event definitions and handlers
        events : {
            'click #dropdownToggle' : 'toggleDropdown',
            'click #chatToggle'     : 'toggleChat',

            'gameSelectEvent' : 'setGame',
            'gameLaunchEvent' : 'launchGame'
        },
        toggleDropdown: function(evt) {
            var dropdown = $(".dropdown");
            if(dropdown.hasClass('fullscreen')) dropdown.removeClass('fullscreen', EASE_LEN, EASING);
            else dropdown.toggleClass("active", EASE_LEN, EASING);
        },
        toggleChat: function(evt) {
            var chat = $("#message-box");
            chat.toggleClass("active", EASE_LEN, EASING);
        },

        setGame : function(evt) {
            this.drawPlayerSelect(evt.attributes.singlePlayer,evt.attributes.multiPlayer);
            //new SettingsView({ model : model });

        },
        launchGame : function(evt, model) {
            new SessionView({ model : model });

            $('#session-page').css({'left':window.innerWidth})
                              .animate({'left': 0},EASE_LEN,EASING);
            evt.stopImmediatePropagation();
        },


        // helpers
        drawPlayerSelect: function(singlePlayer,multiPlayer) {
            console.log(singlePlayer,multiPlayer)
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
        }
    });

    return GlobalView;
});