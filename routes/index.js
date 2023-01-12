const express = require('express');
const router = express.Router();
require('dotenv').config();
const request = require('request');
const LastFmNode = require('lastfm').LastFmNode;
const Parser = require('rss-parser');
const parser = new Parser();

const game_controller = require('../controllers/gameController');
const movie_controller = require('../controllers/movieController');
const tv_controller = require('../controllers/tvController');

// / HOME ROUTE ///

router.get('/', function(req, res) {
	res.render('index', { title: 'Home' });
});

// / STATS ROUTE ///

router.get('/stats', function(req, res) {
	let stats = {};
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/users/noahffiliation/stats',
		headers: {
			'Content-Type': 'application/json',
			'trakt-api-version': '2',
			'trakt-api-key': process.env.TRAKT_API_KEY,
		}}, function(error, response, body) {
			body = JSON.parse(body);
			stats['movies_watched'] = body.movies.watched;
			stats['shows_watched'] = body.shows.watched;
		}
	);
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/users/noahffiliation/watchlist/movies',
		headers: {
			'Content-Type': 'application/json',
			'trakt-api-version': '2',
			'trakt-api-key': process.env.TRAKT_API_KEY,
		}}, function(error, response, body) {
			body = JSON.parse(body);
			stats['movies_length'] = body.length;
		}
	);
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/users/noahffiliation/watchlist/shows',
		headers: {
			'Content-Type': 'application/json',
			'trakt-api-version': '2',
			'trakt-api-key': process.env.TRAKT_API_KEY,
		}}, function(error, response, body) {
			body = JSON.parse(body);
			stats['shows_length'] = body.length;
		}
	);
	request({
		method: 'GET',
		url: 'https://api.myanimelist.net/v2/users/noahffiliation/animelist?limit=400&status=completed',
		headers: {
			'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID,
		}}, function(error, response, body) {
			body = JSON.parse(body);
			stats['anime_completed'] = body.data.length;
		}
	);
	request({
		method: 'GET',
		url: 'https://api.myanimelist.net/v2/users/noahffiliation/animelist?limit=400&status=plan_to_watch',
		headers: {
			'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID,
		}}, function(error, response, body) {
			body = JSON.parse(body);
			stats['movies_total'] = stats['movies_watched'] + stats['movies_length'];
			stats['shows_total'] = stats['shows_watched'] + stats['shows_length'];
			stats['anime_total'] = stats['anime_completed'] + body.data.length
			res.render('stats', { title: 'Stats', stats: stats });
		}
	);
});

// / GAME ROUTES ///

// router.get('/game/create', game_controller.game_create_get);

// router.post('/game/create', game_controller.game_create_post);

router.get('/games', game_controller.gameList);

// router.get('/game/:id', game_controller.game_detail);

// router.get('/game/:id/update', game_controller.game_update_get);

// router.post('/game/:id/update', game_controller.game_update_post);

// router.get('/game/:id/delete', game_controller.game_delete_get);

// router.post('/game/:id/delete', game_controller.game_delete_post);

// / MOVIE ROUTES ///

// router.get('/movie/create', movie_controller.movie_create_get);

// router.post('/movie/create', movie_controller.movie_create_post);

router.get('/movies', movie_controller.movieList);

// router.get('/movie/:id', movie_controller.movie_detail);

// router.get('/movie/:id/update', movie_controller.movie_update_get);

// router.post('/movie/:id/update', movie_controller.movie_update_post);

// router.get('/movie/:id/delete', movie_controller.movie_delete_get);

// router.post('/movie/:id/delete', movie_controller.movie_delete_post);

// / LETTERBOXD ROUTE ///

router.get('/letterboxd', function(req, res) {
	(async () => {
		const feed = await parser.parseURL('https://letterboxd.com/noahffiliation/rss/');
		res.render('letterboxd', { title: 'Letterboxd', items: feed.items });
	})();
});

// / TV ROUTES ///

// router.get('/tv/create', tv_controller.tv_create_get);

// router.post('/tv/create', tv_controller.tv_create_post);

router.get('/tv', tv_controller.tvList);

// router.get('/tv/:id', tv_controller.tv_detail);

// router.get('/tv/:id/update', tv_controller.tv_update_get);

// router.post('/tv/:id/update', tv_controller.tv_update_post);

// router.get('/tv/:id/delete', tv_controller.tv_delete_get);

// router.post('/tv/:id/delete', tv_controller.tv_delete_post);

// / RECENT TV HISTORY ROUTE ///

router.get('/recently_watched', function(req, res) {
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/users/noahffiliation/history/shows',
		headers: {
			'Content-Type': 'application/json',
			'trakt-api-version': '2',
			'trakt-api-key': process.env.TRAKT_API_KEY,
		} }, function(error, response, body) {
		body = JSON.parse(body);
		// console.log(body[0].watched_at);
		res.render('recently_watched', { title: 'Recently Watched', history: body });
	});
});

// / LASTFM ROUTE ///

router.get('/lastfm', function(req, res) {
	const lastfm = new LastFmNode({
		api_key: process.env.LASTFM_API_KEY,
	});
	lastfm.request('user.getRecentTracks', {
		user: 'noahffiliation',
		handlers: {
			success: function(data) {
				res.render('lastfm', { title: 'Last.fm', data: data });
			},
		},
	});
});

module.exports = router;
