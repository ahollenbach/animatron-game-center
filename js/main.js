require.config({
    baseUrl: "js/",
    paths: {
        jquery     : 'libs/jquery-1.9.1',
        underscore : 'libs/underscore',
        backbone   : 'libs/backbone',
        handlebars : 'libs/handlebars'
    },
    shim: {
        underscore: {
            exports : '_'
        },
        backbone: {
            deps    : ["underscore", "jquery"],
            exports : "Backbone"
        }, 
        handlebars : {
            exports : "Handlebars"
        }
    }
});

var games = [
{
    name         : 'Pong',
    developers   : 'Atari',
    created      : 1972,
    singlePlayer : true,
    multiPlayer  : true
},
{
    name         : 'Racing!',
    developers   : 'Andrew Hollenbach & Brian Clanton',
    created      : 2013,
    singlePlayer : true,
    multiPlayer  : false
},
{
    name         : 'Blahdiblah',
    developers   : 'Andrew Hollenbach & Brian Clanton',
    created      : 2013,
    singlePlayer : true,
    multiPlayer  : false
}
];

function getTemplate(id) {
    return $("#" + id).html();
}

var g;

//var gamesView = new GameCenter.Views.Games({ collection : gameCollection});
//$(document.body).append(gamesView.el);

require(
  ["jquery",
    "underscore",
    "backbone",
    "views/galleryview"
  ],
  function($, _, Backbone, GalleryView) {
     $(function() {
        $(document).ready(function() {
            const EASE_LEN = 200, EASING = "linear";
            const widths = [ 100, 35, 25 ]; // size of the smallest non-zero element
            
            $(".bar.left").width("100%"); $(".dropdown").height("0%");

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

            $(".dropdownToggle").on("click", function(evt) {
                var dropdown = $(".dropdown");
                if     (dropdown.hasClass("inactive")) dropdown.removeClass("inactive").addClass("active")  .animate({height: "40%"}, EASE_LEN, EASING);
                else if(dropdown.hasClass("active"))   dropdown.removeClass("active")  .addClass("inactive").animate({height: "0%" }, EASE_LEN, EASING);
            });

            $(".game-info").hover(function() {});

            // Generate users
            initUserList([
                "Andrew Hollenbach",
                "Brian Clanton",
                "Test Users",
                "Lorem Ipsum"
            ]);
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
        });

      g = new GalleryView(games);
    });

    //var gameCenter = GameCenter;
    //Backbone.history.start();
});