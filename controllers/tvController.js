const request = require("request");
require("dotenv").config();

const TRAKT_HEADERS = {
	"Content-Type": "application/json",
	"trakt-api-version": "2",
	"trakt-api-key": process.env.TRAKT_API_KEY
}

exports.tvList = (req, res) => {
	request({
		method: "GET",
		url: "https://api.trakt.tv/users/noahffiliation/watchlist/shows/released",
		headers: TRAKT_HEADERS
	}, function (error, response, body) {
		body = JSON.parse(body);
		body = body.reverse();
		res.render("tv", { title: "TV Watchlist", tv: body });
	});
};

exports.tv_detail = (req, res) => {
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/shows/'+req.params.id+'?extended=full',
		headers: TRAKT_HEADERS
		}, function (error, response, body) {
			body = JSON.parse(body);
			res.render("tv_detail", { title: body.title, show: body });
	});
};
