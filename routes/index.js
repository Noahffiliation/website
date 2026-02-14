const express = require('express');
const router = express.Router();
require('dotenv').config();
const axios = require('axios');
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

const getStats = async () => {
	try {
		const statsUrls = [
			'https://api.trakt.tv/users/noahffiliation/stats',
			'https://api.trakt.tv/users/noahffiliation/watchlist/movies',
			'https://api.trakt.tv/users/noahffiliation/watchlist/shows',
			'https://api.myanimelist.net/v2/users/noahffiliation/animelist?limit=' + MAL_LIMIT + '&status=completed',
			'https://api.myanimelist.net/v2/users/noahffiliation/animelist?limit=' + MAL_LIMIT + '&status=plan_to_watch'
		];
		const headers = [
			TRAKT_HEADER,
			TRAKT_HEADER,
			TRAKT_HEADER,
			MAL_HEADER,
			MAL_HEADER
		];
		const responses = await Promise.all(statsUrls.map((url, index) => axios.get(url, { headers: headers[index] })));
		const stats = {
			'movies_watched': responses[0].data.movies.watched,
			'shows_watched': responses[0].data.shows.watched,
			'anime_completed': responses[3].data.data.length,
			'movies_total': responses[0].data.movies.watched + responses[1].data.length,
			'shows_total': responses[0].data.shows.watched + responses[2].data.length,
			'anime_total': responses[3].data.data.length + responses[4].data.data.length,
		};
		return stats;
	} catch (error) {
		console.error(error);
	}
};

router.get('/stats', async (_req, res) => {
	const stats = await getStats();
	res.render('stats', { title: 'Stats', stats: stats });
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
		for (const page of response.results) {
			games.push(page);
		}
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

router.get('/movies', (_req, res, next) => {
	axios({
		method: "GET",
		url: "https://api.trakt.tv/users/noahffiliation/watchlist/movies/released",
		headers: TRAKT_HEADER
	}).then((response) => {
		response.data = response.data.reverse();
		res.render("movies", { title: "Movie Watchlist", movies: response.data });
	}).catch((error) => {
		next(error);
	});
});

router.get('/movie/:id', (req, res) => {
	if (/^\d+$/.test(req.params.id)) {
		const movieId = encodeURIComponent(req.params.id);
		axios({
			method: 'GET',
			url: `https://api.trakt.tv/movies/${movieId}`,
			headers: TRAKT_HEADER,
			params: {
				extended: 'full'
			}
		}).then((response) => {
			res.render("movie_detail", { title: response.title, movie: response });
		}).catch((error) => {
			console.error(error);
		});
	} else {
		res.redirect('/movies');
	}
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
	axios({
		method: "GET",
		url: "https://api.trakt.tv/users/noahffiliation/watchlist/shows/released",
		headers: TRAKT_HEADER
	}).then((response) => {
		response.data = response.data.reverse();
		res.render("tv", { title: "TV Watchlist", tv: response.data });
	}).catch((error) => {
		console.error(error);
	});
});

router.get('/tv/:id', (req, res) => {
	if (/^\d+$/.test(req.params.id)) {
		const id = encodeURIComponent(req.query.id);
		axios({
			method: 'GET',
			url: 'https://api.trakt.tv/shows/' + id + '?extended=full',
			headers: TRAKT_HEADER
		}).then((response) => {
			res.render("tv_detail", { title: response.data.title, show: response.data });
		}).catch((error) => {
			console.error(error);
		});
	} else {
		res.redirect('/tv');
	}
});

// EPISODE ROUTES

router.get('/episodes', (_req, res) => {
	axios({
		method: 'GET',
		url: 'https://api.trakt.tv/users/noahffiliation/history/shows?limit=' + TRAKT_LIMIT,
		headers: TRAKT_HEADER
	}).then((response) => {
		res.render('episodes', { title: 'Recently Watched', history: response.data });
	}).catch((error) => {
		console.error(error);
	});
});

router.get('/episode/:id/:season/:episode', (req, res) => {
	if (/^\d+$/.test(req.params.id) && /^\d+$/.test(req.params.season) && /^\d+$/.test(req.params.episode)) {
		const season = encodeURIComponent(req.query.season);
		const episode = encodeURIComponent(req.query.episode);
		const episodeId = encodeURIComponent(req.query.id);
		axios({
			method: 'GET',
			url: `https://api.trakt.tv/shows/${episodeId}/seasons/${season}/episodes/${episode}?extended=full`,
			headers: TRAKT_HEADER
		}).then((response) => {
			res.render("episode_detail", { title: response.data.title, episode: response.data });
		}).catch((error) => {
			console.error(error);
		});
	} else {
		res.redirect('/episodes');
	}
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
