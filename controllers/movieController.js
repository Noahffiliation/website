const request = require("request");
require("dotenv").config();

const TRAKT_HEADERS = {
	"Content-Type": "application/json",
	"trakt-api-version": "2",
	"trakt-api-key": process.env.TRAKT_API_KEY
}

exports.movieList = (req, res) => {
	request({
		method: "GET",
		url: "https://api.trakt.tv/users/noahffiliation/watchlist/movies/released",
		headers: TRAKT_HEADERS
		}, function (error, response, body) {
			body = JSON.parse(body);
			body = body.reverse();
			res.render("movies", { title: "Movie Watchlist", movies: body });
	});
};

exports.movie_detail = (req, res) => {
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/movies/'+req.params.id+'?extended=full',
		headers: TRAKT_HEADERS
		}, function (error, response, body) {
			body = JSON.parse(body);
			res.render("movie_detail", { show: body });
	});
};
