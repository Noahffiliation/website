const request = require("request");
require("dotenv").config();

exports.tvList = (req, res) => {
	request({
		method: "GET",
		url: "https://api.trakt.tv/users/noahffiliation/watchlist/shows/released",
		headers: {
			"Content-Type": "application/json",
			"trakt-api-version": "2",
			"trakt-api-key": process.env.TRAKT_API_KEY
		} }, function (error, response, body) {
		body = JSON.parse(body);
		body = body.reverse();
		res.render("tv", { title: "TV Watchlist", tv: body });
	});
};

// Exports.tv_detail = (req, res, next) => {

// };
