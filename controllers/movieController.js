var request = require('request');
require('dotenv').config();

exports.movie_list = (req, res, next) => {
    request({
        method: 'GET',
        url: 'https://api.trakt.tv/users/noahffiliation/watchlist/movies/released',
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-version': '2',
          'trakt-api-key': process.env.TRAKT_API_KEY
        }}, function (error, response, body) {
            body = JSON.parse(body);
            body = body.reverse();
            res.render('movies', { title: "Movie Watchlist", movies: body })
      });
};

exports.movie_detail = (req, res, next) => {

};