define(['backbone'], function (Backbone) {
	var User = Backbone.Model.extend({
		// Default values
		defaults : {
			username : "Bob Loblaw",
			inGame : false
		},
		
		// Custom properties
		usernameValidator : /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/,

		// Function overrides
		initialize : function() {
			this.on("error", function(model, error) {
				console.log(error);
			});
		},

		// Validation
		validate : function(attributes) {
			if (!this.usernameValidator.test(attributes.username))
				return "The username \"" + attributes.username + "\" is invalid.\nUsernames can only consist of alphanumeric characters, underscores, hyphens, and spaces."
		}
	});

	return User;
});