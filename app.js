var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
var indexRouter = require("./src/routes/index");
var apiResponse = require("./src/helpers/apiResponse");
var cors = require("cors");
require('./workers/chainlog-worker')

// DB connection
var MONGODB_URL = process.env.MONGODB_URL;
var mongoose = require("mongoose");
mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		//don't show the log when it is test
		if(process.env.NODE_ENV !== "test") {
			console.log("Connected to %s", MONGODB_URL);
			console.log("App is running ... \n");
			console.log("Press CTRL + C to stop the process. \n");
		}
	})
	.catch(err => {
		console.error("App starting error:", err.message);
		process.exit(1);
	});

var app = express();

//don't show the log when it is test
if(process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}

// sets port 3000 to default or unless otherwise specified in the environment
app.set('port', process.env.PORT || 6013);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//To allow cross-origin requests
app.use(cors());

//Route Prefixes
app.use("/", indexRouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
	return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
	if(err.name == "UnauthorizedError"){
		return apiResponse.unauthorizedResponse(res, err.message);
	}
});

module.exports = app;