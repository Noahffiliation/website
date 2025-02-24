const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("cookie-session");
const logger = require("morgan");
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const apicache = require('apicache');
let cache = apicache.middleware;

const indexRouter = require("./routes/index");

const app = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.set('trust proxy', 1);

app.locals.moment = require('moment');

app.use(session({
	name: "session",
	secret: process.env.SESSION_SECRET,
	cookie: {
		secure: true,
		httpOnly: true,
	}
}));

const limiter = rateLimit({
	max: 400,
	windowMs: 60 * 1000,
	message: 'Too many requests from this IP, please try again in a minute!'
});

app.use(helmet());
app.use(compression());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.csrf());
app.use(cookieParser());
app.use(limiter);
app.use(cache('5 minutes'));
app.use(express.static(path.join(__dirname, "public")));
app.use("/favicon.ico", express.static("public/images/favicon.ico"));

app.disable('x-powered-by');

app.use("/", indexRouter);

// Catch 404 and forward to error handler
app.use((_req, _res, next) => {
	next(createError(404));
});

// Error handler
app.use((err, req, res) =>{
	// Set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// Render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;
