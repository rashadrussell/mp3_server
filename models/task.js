// Load required packages
var mongoose = require('mongoose');
	
var TaskSchema = new mongoose.Schema({
  name: String,
  description: String,
  deadline: Date,
  completed: Boolean,
  assignedUser: String,
  assignedUserName: String,
  dateCreated: Date
});

// Export the Mongoose model
module.exports = mongoose.model('Task', TaskSchema);

var User = require('./user');

TaskSchema.pre('remove', function(next) {

	if(this.assignedUser) {
		User.update({_id: this.assignedUser}, {$pull: {pendingTasks: this._id}}).exec();
	}

	next();
});
