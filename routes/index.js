const express = require('express');
const router = express.Router();
require('dotenv').config();
const request = require('request');
const LastFmNode = require('lastfm').LastFmNode;
const Parser = require('rss-parser');
const parser = new Parser();
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_KEY });
const rateLimit = require('express-rate-limit');

const TRAKT_HEADER = {
	'Content-Type': 'application/json',
	'trakt-api-version': '2',
	'trakt-api-key': process.env.TRAKT_API_KEY
};
const MAL_HEADER = {
	'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID
};

const MAL_LIMIT = 400;
const TRAKT_LIMIT = 25;

// HOME ROUTE

router.get('/', rateLimit(), (_req, res) => {
	res.render('index', { title: 'Home' });
});

// STATS ROUTE

router.get('/stats', (_req, res) => {
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/users/noahffiliation/stats',
		headers: TRAKT_HEADER
	}, (error, _response, body) => {
		if (error) {
			console.error(error);
		}
		body = JSON.parse(body);
		const movies_watched = body.movies.watched;
		const shows_watched = body.shows.watched;
		request({
			method: 'GET',
			url: 'https://api.trakt.tv/users/noahffiliation/watchlist/movies',
			headers: TRAKT_HEADER
		}, (error, _response, body) => {
			if (error) {
				console.error(error);
			}
			body = JSON.parse(body);
			const movies_length = body.length;
			request({
				method: 'GET',
				url: 'https://api.trakt.tv/users/noahffiliation/watchlist/shows',
				headers: TRAKT_HEADER
			}, (error, _response, body) => {
				if (error) {
					console.error(error);
				}
				body = JSON.parse(body);
				const shows_length = body.length;
				request({
					method: 'GET',
					url: 'https://api.myanimelist.net/v2/users/noahffiliation/animelist?limit='+MAL_LIMIT+'&status=completed',
					headers: MAL_HEADER
				}, (error, _response, body) => {
					if (error) {
						console.error(error);
					}
					body = JSON.parse(body);
					const anime_completed = body.data.length;
					request({
						method: 'GET',
						url: 'https://api.myanimelist.net/v2/users/noahffiliation/animelist?limit='+MAL_LIMIT+'&status=plan_to_watch',
						headers: MAL_HEADER
					}, (error, _response, body) => {
						if (error) {
							console.error(error);
						}
						body = JSON.parse(body);
						const anime_length = body.data.length;
						const stats = {
							'movies_watched': movies_watched,
							'shows_watched': shows_watched,
							'anime_completed': anime_completed,
							'movies_total': movies_watched + movies_length,
							'shows_total': shows_watched + shows_length,
							'anime_total': anime_completed + anime_length,
						};
						res.render('stats', { title: 'Stats', stats: stats });
					});
				});
			});
		});
	});
});

// GAME ROUTES

router.get('/games', (_req, res) => {
	(async () => {
		const databaseId = process.env.NOTION_DATABASE_ID;
		const response = await notion.databases.query({
			database_id: databaseId,
			filter: {
				"or": [
					{
						property: 'Priority',
						multi_select: {
							contains: 'Current',
						},
					},
				]
			},
			sorts: [{
				property: 'Name',
				direction: 'ascending',
			}],
		});
		const games = [];
		response.results.forEach(page => {
			games.push(page);
		});
		res.render('games', { title: 'Games', games: games });
	})();
});

router.get('/game/:id', (req, res) => {
	(async () => {
		const pageId = req.params.id;
		const response = await notion.pages.retrieve({
			page_id: pageId
		});
		res.render('game_detail', { title: response.properties['Name'].title[0].plain_text, game: response.properties });
	})();
});

// MOVIE ROUTES

router.get('/movies', (_req, res) => {
	request({
		method: "GET",
		url: "https://api.trakt.tv/users/noahffiliation/watchlist/movies/released",
		headers: TRAKT_HEADER
	}, (error, _response, body) => {
		if (error) {
			console.error(error);
		}
		body = JSON.parse(body);
		body = body.reverse();
		res.render("movies", { title: "Movie Watchlist", movies: body });
	});
});

router.get('/movie/:id', (req, res) => {
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/movies/'+req.params.id+'?extended=full',
		headers: TRAKT_HEADER
	}, (error, _response, body) => {
		if (error) {
			console.error(error);
		}
		body = JSON.parse(body);
		res.render("movie_detail", { title: body.title , movie: body });
	});
});

// LETTERBOXD ROUTE

router.get('/letterboxd', (_req, res) => {
	(async () => {
		const feed = await parser.parseURL('https://letterboxd.com/noahffiliation/rss/');
		res.render('letterboxd', { title: 'Letterboxd', items: feed.items });
	})();
});

// TV ROUTES

router.get('/tv', (_req, res) => {
	request({
		method: "GET",
		url: "https://api.trakt.tv/users/noahffiliation/watchlist/shows/released",
		headers: TRAKT_HEADER
	}, (error, _response, body) => {
		if (error) {
			console.error(error);
		}
		body = JSON.parse(body);
		body = body.reverse();
		res.render("tv", { title: "TV Watchlist", tv: body });
	});
});

router.get('/tv/:id', (req, res) => {
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/shows/'+req.params.id+'?extended=full',
		headers: TRAKT_HEADER
	}, (error, _response, body) => {
		if (error) {
			console.error(error);
		}
		body = JSON.parse(body);
		res.render("tv_detail", { title: body.title, show: body });
	});
});

// EPISODE ROUTES

router.get('/episodes', (_req, res) => {
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/users/noahffiliation/history/shows?limit='+TRAKT_LIMIT,
		headers: TRAKT_HEADER
	}, (error, _response, body) => {
		if (error) {
			console.error(error);
		}
		body = JSON.parse(body);
		res.render('episodes', { title: 'Recently Watched', history: body });
	});
});

router.get('/episode/:id/:season/:episode', (req, res) => {
	request({
		method: 'GET',
		url: 'https://api.trakt.tv/shows/'+req.params.id+'/seasons/'+req.params.season+'/episodes/'+req.params.episode+'?extended=full',
		headers: TRAKT_HEADER
	}, (error, _response, body) => {
		if (error) {
			console.error(error);
		}
		body = JSON.parse(body);
		res.render("episode_detail", { title: body.title, episode: body });
	});
});

// LASTFM ROUTE

router.get('/lastfm', (_req, res) => {
	const lastfm = new LastFmNode({
		api_key: process.env.LASTFM_API_KEY,
	});
	lastfm.request('user.getRecentTracks', {
		user: 'noahffiliation',
		handlers: {
			success: (data) => {
				res.render('lastfm', { title: 'Last.fm', data: data });
			},
		},
	});
});

module.exports = router;
