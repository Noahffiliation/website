const express = require('express');
const router = express.Router();
require('dotenv').config();
const axios = require('axios');
const LastFmNode = require('lastfm').LastFmNode;
const Parser = require('rss-parser');
const parser = new Parser({ timeout: 10000 });
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_KEY });

const TRAKT_USER = process.env.TRAKT_USERNAME || 'noahffiliation';
const MAL_USER = process.env.MAL_USERNAME || 'noahffiliation';
const LETTERBOXD_USER = process.env.LETTERBOXD_USERNAME || 'noahffiliation';
const LASTFM_USER = process.env.LASTFM_USERNAME || 'noahffiliation';

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
const HTTP_TIMEOUT = 10000;

// HOME ROUTE

router.get('/', (_req, res) => {
	res.render('index', { title: 'Home' });
});

// STATS ROUTE

const getStats = async () => {
	const statsUrls = [
		`https://api.trakt.tv/users/${TRAKT_USER}/stats`,
		`https://api.trakt.tv/users/${TRAKT_USER}/watchlist/movies`,
		`https://api.trakt.tv/users/${TRAKT_USER}/watchlist/shows`,
		`https://api.myanimelist.net/v2/users/${MAL_USER}/animelist?limit=${MAL_LIMIT}&status=completed`,
		`https://api.myanimelist.net/v2/users/${MAL_USER}/animelist?limit=${MAL_LIMIT}&status=plan_to_watch`
	];
	const headers = [
		TRAKT_HEADER,
		TRAKT_HEADER,
		TRAKT_HEADER,
		MAL_HEADER,
		MAL_HEADER
	];
	const responses = await Promise.all(
		statsUrls.map((url, index) => axios.get(url, { headers: headers[index], timeout: HTTP_TIMEOUT }))
	);
	return {
		movies_watched: responses[0].data.movies.watched,
		shows_watched: responses[0].data.shows.watched,
		anime_completed: responses[3].data.data.length,
		movies_total: responses[0].data.movies.watched + responses[1].data.length,
		shows_total: responses[0].data.shows.watched + responses[2].data.length,
		anime_total: responses[3].data.data.length + responses[4].data.data.length
	};
};

router.get('/stats', async (_req, res, next) => {
	try {
		const stats = await getStats();
		res.render('stats', { title: 'Stats', stats });
	} catch (error) {
		next(error);
	}
});

// GAME ROUTES

router.get('/games', async (_req, res, next) => {
	try {
		const databaseId = process.env.NOTION_DATABASE_ID;
		const response = await notion.databases.query({
			database_id: databaseId,
			filter: {
				or: [
					{
						property: 'Priority',
						multi_select: {
							contains: 'Current'
						}
					}
				]
			},
			sorts: [{
				property: 'Name',
				direction: 'ascending'
			}]
		});
		res.render('games', { title: 'Games', games: response.results });
	} catch (error) {
		next(error);
	}
});

router.get('/game/:id', async (req, res, next) => {
	try {
		const pageId = req.params.id;
		const response = await notion.pages.retrieve({
			page_id: pageId
		});
		res.render('game_detail', { title: response.properties['Name'].title[0].plain_text, game: response.properties });
	} catch (error) {
		next(error);
	}
});

// MOVIE ROUTES

router.get('/movies', async (_req, res, next) => {
	try {
		const response = await axios.get(`https://api.trakt.tv/users/${TRAKT_USER}/watchlist/movies/released`, {
			headers: TRAKT_HEADER,
			timeout: HTTP_TIMEOUT
		});
		const movies = [...response.data].reverse();
		res.render('movies', { title: 'Movie Watchlist', movies });
	} catch (error) {
		next(error);
	}
});

router.get('/movie/:id', async (req, res, next) => {
	if (/^\d+$/.test(req.params.id)) {
		try {
			const movieId = encodeURIComponent(req.params.id);
			const response = await axios.get(`https://api.trakt.tv/movies/${movieId}`, {
				headers: TRAKT_HEADER,
				params: {
					extended: 'full'
				},
				timeout: HTTP_TIMEOUT
			});
			res.render('movie_detail', { title: response.data.title, movie: response.data });
		} catch (error) {
			next(error);
		}
	} else {
		res.redirect('/movies');
	}
});

// LETTERBOXD ROUTE

router.get('/letterboxd', async (_req, res, next) => {
	try {
		const feed = await parser.parseURL(`https://letterboxd.com/${LETTERBOXD_USER}/rss/`);
		res.render('letterboxd', { title: 'Letterboxd', items: feed.items });
	} catch (error) {
		next(error);
	}
});

// TV ROUTES

router.get('/tv', async (_req, res, next) => {
	try {
		const response = await axios.get(`https://api.trakt.tv/users/${TRAKT_USER}/watchlist/shows/released`, {
			headers: TRAKT_HEADER,
			timeout: HTTP_TIMEOUT
		});
		const tv = [...response.data].reverse();
		res.render('tv', { title: 'TV Watchlist', tv });
	} catch (error) {
		next(error);
	}
});

router.get('/tv/:id', async (req, res, next) => {
	if (/^\d+$/.test(req.params.id)) {
		try {
			const id = encodeURIComponent(req.params.id);
			const response = await axios.get(`https://api.trakt.tv/shows/${id}`, {
				headers: TRAKT_HEADER,
				params: {
					extended: 'full'
				},
				timeout: HTTP_TIMEOUT
			});
			res.render('tv_detail', { title: response.data.title, show: response.data });
		} catch (error) {
			next(error);
		}
	} else {
		res.redirect('/tv');
	}
});

// EPISODE ROUTES

router.get('/episodes', async (_req, res, next) => {
	try {
		const response = await axios.get(`https://api.trakt.tv/users/${TRAKT_USER}/history/shows?limit=${TRAKT_LIMIT}`, {
			headers: TRAKT_HEADER,
			timeout: HTTP_TIMEOUT
		});
		res.render('episodes', { title: 'Recently Watched', history: response.data });
	} catch (error) {
		next(error);
	}
});

router.get('/episode/:id/:season/:episode', async (req, res, next) => {
	if (/^\d+$/.test(req.params.id) && /^\d+$/.test(req.params.season) && /^\d+$/.test(req.params.episode)) {
		try {
			const season = encodeURIComponent(req.params.season);
			const episode = encodeURIComponent(req.params.episode);
			const episodeId = encodeURIComponent(req.params.id);
			const response = await axios.get(`https://api.trakt.tv/shows/${episodeId}/seasons/${season}/episodes/${episode}`, {
				headers: TRAKT_HEADER,
				params: {
					extended: 'full'
				},
				timeout: HTTP_TIMEOUT
			});
			res.render('episode_detail', { title: response.data.title, episode: response.data });
		} catch (error) {
			next(error);
		}
	} else {
		res.redirect('/episodes');
	}
});

// LASTFM ROUTE

router.get('/lastfm', (_req, res, next) => {
	const lastfm = new LastFmNode({
		api_key: process.env.LASTFM_API_KEY
	});
	lastfm.request('user.getRecentTracks', {
		user: LASTFM_USER,
		handlers: {
			success: (data) => {
				res.render('lastfm', { title: 'Last.fm', data });
			},
			error: (error) => {
				next(error);
			}
		}
	});
});

module.exports = router;
