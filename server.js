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
			res.json({
				"message": "Internal Server Error: " + err,
				"data": {}
			});
			res.status(500);
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
			res.json({
				"message": "Server Error",
				"data": {}
			});
			res.status(500);

		} else {
			if(!users) {
				res.json({
					"message": "Users Not Found",
					"data": {}
				});
				res.status(404);
			} else {
				res.json({
					"message": "OK",
					"data": users
				});
				res.status(200);
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
		res.json({
			"message": "Name or email not included",
			"data": {}
		});
		res.status(400);
		return;
	}

	User.count({"email": email}, function(err, count) {

		if(err) {
			res.json({
				"message": "Internal Server Error: " + err,
				"data": {}
			});
			res.status(500);
			return;
		}

		if(count > 0) {
			res.json({
				"message": "User with this email already exists",
				"data": {}
			});
			res.status(400);
			return;
		}		

	});

	newUser = new User({
		"name": name,
		"email": email,
		"pendingTasks": [],
		"dateCreated": date
	});

	console.log(newUser);
	newUser.save();
	res.json({
		"message": "OK",
		"data": newUser
	});
	res.status(200);
})
.options(function(req, res){
      res.writeHead(200);
      res.end();
});

// User router
var userRoute = router.route('/users/:id');

userRoute.get(function(req, res) {

	User.findById(req.params.id, 'name email pendingTasks', function(err, user) {
		if(err) {
			res.json({
				"message": "Internal Server Error: " + err,
				"data": {}
			});
			res.status(500);
			return;
		}

		if(!user) {
			res.json({
				"message": "Not Found - User with ID: " + req.params.id,
				"data": {}
			});
			res.status(404);
			return;
		}

		res.json({
			"message": "OK",
			"data": user
		});
		res.status(200);
	});
})
.delete(function(req, res) {

	var query = User.find({_id: req.params.id}, function(err, user) {
		if(err) {
			console.error(err);
			res.json({
				"message": "Error: " + err,
				"data": {}
			});
			res.status(500);
			return;
		}

		if(!user[0]) {
			res.json({
				"message": "User Not Found",
				"data": {}
			});
			res.status(404);
			return;

		} else {
			user[0].remove();
			res.json({
				"message": "OK",
				"data": {}
			});
			res.status(200);
			return;
		}

	});

});

// Tasks router
var tasksRoute = router.route('/tasks');

tasksRoute.get(function(req, res) {
	
	var query = Task.find(function(err, tasks) {
		if(err) {
			res.json({
				"message": "Internal Server Error: " + err,
				"data": {}
			});
			res.status(500);
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
		query.limit(JSON.parse(req.query.limit));
	}

	if(("count" in req.query) && JSON.parse(req.query.count)) {
		query = query.count();
	}

	query.exec(function(err, tasks) {
		if(err) {
			res.json({
				"message": "Server Error",
				"data": {}
			});
			res.status(500);

		} else {
			if(!tasks) {
				res.json({
					"message": "Tasks Not Found",
					"data": {}
				});
				res.status(404);
			} else {
				res.json({
					"message": "OK",
					"data": tasks
				});
				res.status(200);
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
	res.json({
		"message": "OK",
		"data": newTask
	});
	res.status(200);
})
.options(function(req, res){
      res.writeHead(200);
      res.end();
});

// Task router
var taskRoute = router.route('/tasks/:id');

taskRoute.get(function(req, res) {
	Task.findById(req.params.id, function(err, task) {
		if(err) {
			res.json({
				"message": "Internal Server Error: " + err,
				"data": {}
			});
			res.status(500);
			return;
		}

		if(!task) {
			res.json({
				"message": "Not Found - Task with ID: " + req.params.id,
				"data": {}
			});
			res.status(404);
			return;
		}
		res.json({
			"message": "OK",
			"data": task
		});
		res.status(200);
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

    
	Task.findById(req.params.id, function(err, task) {

		if(task.assignedUser !== "" && (editedUser.assignedUser !== task.assignedUser)) {

			User.findById(task.assignedUser, function(err, user) {
				
				if(user) {
					User.findByIdAndUpdate(user._id, {$pull: {pendingTasks: req.params.id}}, function(err, numAffected, res) {
						
					});
				}
				
			});
		}
		
		if(editedUser.assignedUser !== "" && (editedUser.assignedUser !== task.assignedUser) ) {
			

			User.findById(editedUser.assignedUser, function(err, user) {
				if(user) {
					User.findByIdAndUpdate(user._id, {$push: {pendingTasks: req.params.id}}, function(err, numAffected, res) {
					
					});

				}
				
			});
			
		}

		task.update(editedUser, function(err, numAffected, res) {
			console.log(res);
		});
		
	});

})
.delete(function(req, res) {

	Task.find({_id: req.params.id}, function(err, task) {

		if(err) {
			res.json({
				"message": "Error: " + err,
				"data": {}
			});
			res.status(500);
			return;

		} 

		if(!task[0]) {
			res.json({
				"message": "Task Not Found",
				"data": {}
			});
			res.status(404);
			return;

		} else {
			task[0].remove();
			res.json({
				"message": "OK",
				"data": {}
			});
			res.status(200);
		}

	});

});


// Start the server
app.listen(port);
console.log('Server running on port ' + port); 