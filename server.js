// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var Llama = require('./models/llama');
var User = require('./models/user');
var Task = require('./models/task');
var bodyParser = require('body-parser');
var router = express.Router();

//replace this with your Mongolab URL
mongoose.connect('mongodb://cs498mp3:mp3@ds033307.mongolab.com:33307/mp3_3');

// Create our Express application
var app = express();

// Use environment defined port or 4000
var port = process.env.PORT || 4000;

//Allow CORS so that backend and frontend could pe put on different servers
var allowCrossDomain = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS, DELETE");
  next();
};
app.use(allowCrossDomain);

// Use the body-parser package in our application
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// All our routes will start with /api
app.use('/api', router);

//Default route here
var homeRoute = router.route('/');

homeRoute.get(function(req, res) {
  res.json({ message: 'Hello World!' });
});

// Users route
var usersRoute = router.route('/users');

usersRoute.get(function(req, res) {

	var query = User.find('name email id', function(err, users) {

		if(err) {
			res.status(500).json({
				"message": "Internal Server Error: " + err,
				"data": {}
			});
			console.log('hi');
			return;
		}

	});

	if("where" in req.query) {
		query = query.where(JSON.parse(req.query.where));
	} 
	
	if("sort" in req.query) {
		query = query.sort(JSON.parse(req.query.sort));
	}

	if("select" in req.query) {
		query = query.select(JSON.parse(req.query.select));
	}

	if("skip" in req.query) {
		query.skip(JSON.parse(req.query.skip));
	}

	if("limit" in req.query) {
		query.limit(req.query.limit);
	}

	if(("count" in req.query) && JSON.parse(req.query.count)) {
		query = query.count();
	}

	query.exec(function(err, users) {
		if(err) {

			res.status(500).json({
				"message": "Server Error",
				"data": {}
			});

		} else {
			if(!users) {
				res.status(404).json({
					"message": "Users Not Found",
					"data": {}
				});
			} else {
				res.status(200).json({
					"message": "OK",
					"data": users
				});
			}

		}
	});
	
})
.post(function(req, res) {
	var name = req.body.name,
		email = req.body.email,
		date = new Date(),
		newUser;

	if(!name || !email) {
		res.status(400).json({
			"message": "Name or email not included",
			"data": {}
		})
		return;
	}

	User.count({"email": email}, function(err, count) {

		if(err) {
			res.status(500).json({
				"message": "Internal Server Error: " + err,
				"data": {}
			});
			return;
		}

		if(count > 0) {
			res.status(400).json({
				"message": "User with this email already exists",
				"data": {}
			});
			return;
		}		

	});

	newUser = new User({
		"name": name,
		"email": email,
		"pendingTasks": [],
		"dateCreated": date
	});
	newUser.save();
	res.status(200).json({
		"message": "OK",
		"data": newUser
	});
	return;
})
.options(function(req, res) {
	//res.status(200).json();
});


// User router
var userRoute = router.route('/users/:id');

userRoute.get(function(req, res) {

	User.findById(req.params.id, 'name email pendingTasks', function(err, user) {
		if(err) {
			res.status(500).json({
				"message": "Internal Server Error: " + err,
				"data": {}
			});
			return;
		}

		if(!user) {
			res.status(404).json({
				"message": "Not Found - User with ID: " + req.params.id,
				"data": {}
			});
			return;
		}

		res.status(200).json({
			"message": "OK",
			"data": user
		});
	});
})
.delete(function(req, res) {

	var query = User.findOne({_id: req.params.id}, function(err, user) {

		if(err) {
			console.error(err);
			res.status(500).json({
				"message": "Error: " + err,
				"data": {}
			});
			return;
		}

		if(!user) {
			res.status(404).json({
				"message": "User Not Found",
				"data": {}
			});
			return;

		} else {
			user.remove();
			res.status(200).json({
				"message": "OK",
				"data": {}
			});
			return;
		}

	});

});

// Tasks router
var tasksRoute = router.route('/tasks');

tasksRoute.get(function(req, res) {
	
	var query = Task.find(function(err, tasks) {
		if(err) {
			res.status(500).json({
				"message": "Internal Server Error: " + err,
				"data": {}
			});
			return;
		}
	});

	if("where" in req.query) {
		query = query.where(JSON.parse(req.query.where));
	} 
	
	if("sort" in req.query) {
		query = query.sort(JSON.parse(req.query.sort));
	}

	if("select" in req.query) {
		query = query.select(JSON.parse(req.query.select));
	}

	if("skip" in req.query) {
		query.skip(JSON.parse(req.query.skip));
	}

	if("limit" in req.query) {
		query.limit(req.query.limit);
	}

	if(("count" in req.query) && JSON.parse(req.query.count)) {
		query = query.count();
	}

	query.exec(function(err, tasks) {
		if(err) {

			res.status(500).json({
				"message": "Server Error",
				"data": {}
			});

		} else {
			if(!tasks) {
				res.status(404).json({
					"message": "Tasks Not Found",
					"data": {}
				});
			} else {
				res.status(200).json({
					"message": "OK",
					"data": tasks
				});
			}

		}
	});


})
.post(function(req, res) {
	var name             = req.body.name,
		description      = req.body.description,
		deadline         = req.body.deadline,
		assignedUser     = req.body.assignedUser,
		assignedUserName = req.body.assignedUserName,
		dateCreated      = new Date(),
		newTask;

	newTask = new Task({
		"name":             name, 
		"description":      description,
		"deadline":         Date(deadline),
		"completed":        false,
		"assignedUser":     assignedUser,
		"assignedUserName": assignedUserName,
		"dateCreated":      dateCreated
	});

	if(assignedUser !== "") {
		User.findByIdAndUpdate(assignedUser, {$push: {'pendingTasks': newTask._id}}, function(err, user) {
			//if(err) return handleError(err);
		});
	}
	

	newTask.save();
	res.status(200).json({
		"message": "OK",
		"data": newTask
	});
});
/*
.options(function(req, res) {
	//res.status(200).json();
});
*/

// Task router
var taskRoute = router.route('/tasks/:id');

taskRoute.get(function(req, res) {
	Task.findById(req.params.id, function(err, task) {
		if(err) {
			res.status(500).json({
				"message": "Internal Server Error: " + err,
				"data": {}
			});
			return;
		}

		if(!task) {
			res.status(404).json({
				"message": "Not Found - Task with ID: " + req.params.id,
				"data": {}
			});
			return;
		}
		res.status(200).json({
			"message": "OK",
			"data": task
		});
	});
})
.put(function(req, res) {

	var editedUser = {
        "name": req.body.name,
        "description": req.body.description,
        "deadline": Date(req.body.deadline),
        "assignedUser": req.body.assignedUser,
        "assignedUserName": req.body.assignedUserName,
        "completed": req.body.completed
      }

      console.log(req.body.assignedUser == "");
      console.log(req.body.assignedUser  === false);
      console.log(req.body.assignedUser == false);
      //console.log(JSON.parse(req.body.assignedUser) === "");

	Task.findById(req.params.id, function(err, task) {
		console.log(task);
		if(editedUser.assignedUser !== "") {
			User.findById(task.assignedUser, function(err, user) {
				console.log("Old Assigned User: " + task.assignedUser);
				console.log("Old Username: " + task.assignedUserName);
				user.update({$pull: {pendingTasks: req.params.id}}).exec();
			});

			User.findById(editedUser.assignedUser, function(err, user) {
				console.log("New Assigned User: " + editedUser.assignedUser);
				console.log("New Assigned Username: " + editedUser.assignedUserName);
				user.update({$push: {pendingTasks: req.params.id}}).exec();
			});
		}

		task.update(editedUser).exec();
		
	});

})
.delete(function(req, res) {

	Task.findOne({_id: req.params.id}, function(err, task) {

		if(err) {
			res.status(500).json({
				"message": "Error: " + err,
				"data": {}
			});
			return;

		} 

		if(!task) {
			res.status(404).json({
				"message": "Task Not Found",
				"data": {}
			});
			return;

		} else {
			task.remove();
			res.status(200).json({
				"message": "OK",
				"data": {}
			});
		}

	});

});


// Start the server
app.listen(port);
console.log('Server running on port ' + port); 