define(['backbone', 'handlebars',
    'views/galleryview',
    'views/userlistview',
    'views/settingsview',
    'views/sessionview'], 
function (Backbone, Handlebars, GalleryView, UserListView, SettingsView, SessionView) {
    var GlobalView = Backbone.View.extend({
        el: 'body',

        // Function overrides
        initialize : function(args) {
            //=================================================================
            // Deal with the sliding bars. Yuck.
            //=================================================================
            
            // size of the smallest non-zero element
            const widths = [ 100, 35, 25 ];
            
            $(".dropdown").height("100%");

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

            //=================================================================
            // Dropdown menu
            //=================================================================

            $(".dropdownToggle").on("click", function(evt) {
                var dropdown = $(".dropdown");
                if     (dropdown.hasClass("inactive")) dropdown.removeClass("inactive").addClass("active")  .animate({height: "40%"}, EASE_LEN, EASING);
                else if(dropdown.hasClass("active"))   dropdown.removeClass("active")  .addClass("inactive").animate({height: "0%" }, EASE_LEN, EASING);
            });

            // Start with gallery of games
            new GalleryView();
        },

        // Event definitions and handlers
        events : {
            'gameSelectEvent' : 'setGame',
            'gameLaunchEvent' : 'launchGame'
        },
        setGame : function(evt, model) {
            // Check if multiplayer
            new UserListView();
            new SettingsView({ model : model });
        },
        launchGame : function(evt, model) {
            new SessionView({ model : model });

            $('#session-page').css({'margin-left':window.innerWidth})
                              .animate({'margin-left': 0},200,'linear');
            //$("#bars").animate({'margin-left': -window.innerWidth},200,'linear');
            //$("#bars").animate({display:'none'},200,'linear');
            //$(".bar").animate({'margin-left': -window.innerWidth},200,'linear');
            evt.stopImmediatePropagation();
        }
    });

    return GlobalView;
});