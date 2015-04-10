// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  pendingTasks: [String],
  dateCreated: Date
});

// Export the User model
module.exports = mongoose.model('User', UserSchema);

var Task = require('./task');


UserSchema.pre('remove', function(next) {
	
	Task.update({_id: {$in: this.pendingTasks}}, {assignedUser: "", assignedUserName: ""}, {multi: true}, function(err, numAffected, rawResponse) {
		if(err) console.error(err);
	});

	next();
});


