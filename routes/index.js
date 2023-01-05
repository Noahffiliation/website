var express = require('express');
var router = express.Router();
require('dotenv').config();
var request = require('request');
var LastFmNode = require('lastfm').LastFmNode;
let Parser = require('rss-parser');
let parser = new Parser();

const game_controller = require('../controllers/gameController');
const movie_controller = require('../controllers/movieController');
const tv_controller = require('../controllers/tvController');

/// HOME ROUTE ///

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home' });
});

/// STATS ROUTE ///

router.get('/stats', function(req, res, next) {
  request({
    method: 'GET',
    url: 'https://api.trakt.tv/users/noahffiliation/stats',
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': process.env.TRAKT_API_KEY
    }}, function (error, response, body) {
      body = JSON.parse(body);
      var movies_watched = body.movies.watched;
      var shows_watched = body.shows.watched;
      request({
        method: 'GET',
        url: 'https://api.trakt.tv/users/noahffiliation/watchlist/movies',
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-version': '2',
          'trakt-api-key': process.env.TRAKT_API_KEY
        }}, function (error, response, body) {
          body = JSON.parse(body);
          var movies_length = body.length;
          request({
            method: 'GET',
            url: 'https://api.trakt.tv/users/noahffiliation/watchlist/shows',
            headers: {
              'Content-Type': 'application/json',
              'trakt-api-version': '2',
              'trakt-api-key': process.env.TRAKT_API_KEY
            }}, function (error, response, body) {
              body = JSON.parse(body);
              var shows_length = body.length;
              request({
                method: 'GET',
                url: 'https://api.myanimelist.net/v2/users/noahffiliation/animelist?limit=400&status=completed',
                headers: {
                  'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID
                }
              }, function (error, response, body) {
                body = JSON.parse(body);
                var anime_completed = body.data.length
                request({
                  method: 'GET',
                  url: 'https://api.myanimelist.net/v2/users/noahffiliation/animelist?limit=400&status=plan_to_watch',
                  headers: {
                    'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID
                  }
                }, function (error, response, body) {
                  body = JSON.parse(body);
                  var anime_length = body.data.length
                  console.log(anime_length)
                  let stats = {
                    "movies_watched": movies_watched,
                    "shows_watched": shows_watched,
                    "anime_completed": anime_completed,
                    "movies_total": movies_watched + movies_length,
                    "shows_total": shows_watched + shows_length,
                    "anime_total": anime_completed + anime_length
                  }
                  res.render('stats', { title: 'Stats', stats: stats });
                });
              });
          });
      });
  });
});

/// GAME ROUTES ///

// router.get('/game/create', game_controller.game_create_get);

// router.post('/game/create', game_controller.game_create_post);

router.get('/games', game_controller.game_list);

router.get('/game/:id', game_controller.game_detail);

// router.get('/game/:id/update', game_controller.game_update_get);

// router.post('/game/:id/update', game_controller.game_update_post);

// router.get('/game/:id/delete', game_controller.game_delete_get);

// router.post('/game/:id/delete', game_controller.game_delete_post);

/// LETTERBOXD ROUTE ///

router.get('/letterboxd', function(req, res, next) {
  (async () => {
    let feed = await parser.parseURL('https://letterboxd.com/noahffiliation/rss/');
    res.render('letterboxd', { title: 'Letterboxd', items: feed.items });
  })();
});

/// MOVIE ROUTES ///

// router.get('/movie/create', movie_controller.movie_create_get);

// router.post('/movie/create', movie_controller.movie_create_post);

router.get('/movies', movie_controller.movie_list);

router.get('/movie/:id', movie_controller.movie_detail);

// router.get('/movie/:id/update', movie_controller.movie_update_get);

// router.post('/movie/:id/update', movie_controller.movie_update_post);

// router.get('/movie/:id/delete', movie_controller.movie_delete_get);

// router.post('/movie/:id/delete', movie_controller.movie_delete_post);

/// TV ROUTES ///

// router.get('/tv/create', tv_controller.tv_create_get);

// router.post('/tv/create', tv_controller.tv_create_post);

router.get('/tv', tv_controller.tv_list);

router.get('/tv/:id', tv_controller.tv_detail);

// router.get('/tv/:id/update', tv_controller.tv_update_get);

// router.post('/tv/:id/update', tv_controller.tv_update_post);

// router.get('/tv/:id/delete', tv_controller.tv_delete_get);

// router.post('/tv/:id/delete', tv_controller.tv_delete_post);

/// LASTFM ROUTE ///

router.get('/lastfm', function(req, res, next) {
  var lastfm = new LastFmNode({
    api_key: process.env.LASTFM_API_KEY
  });
  lastfm.request("user.getRecentTracks", {
    user: "noahffiliation",
    handlers: {
      success: function(data) {
        res.render('lastfm', { title: 'Last.fm', data: data });
      }
    }
  });
});

module.exports = router;
