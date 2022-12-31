var express = require('express');
var router = express.Router();

const game_controller = require('../controllers/gameController');
const movie_controller = require('../controllers/movieController');
const tv_controller = require('../controllers/tvController');

/// HOME ROUTE ///

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home' });
});

/// STATS ROUTE ///

router.get('/stats', function(req, res, next) {
  // TODO Get Trakt stats and lengths
  res.render('stats', { title: 'Stats' });
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

router.get('/stats', function(req, res, next) {
  // TODO Get RSS Feed
  res.render('letterboxd', { title: 'Letterboxd' });
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
  // TODO Get last.fm recent tracks
  res.render('lastfm', { title: 'Last.fm' });
});

module.exports = router;
