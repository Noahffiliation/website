import os
from flask import Flask, render_template
from urllib.request import Request, urlopen
import feedparser
import json
import dateutil.parser
import requests

app = Flask(__name__)


@app.route('/')
def home():
    headers = {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': os.environ.get('TRAKT_API_KEY')
    }

    trakt_request = Request(
        'https://api.trakt.tv/users/noahffiliation/stats', headers=headers)
    response = urlopen(trakt_request).read()
    trakt_stats = json.loads(response)
    movies_shows_lengths = get_user_lists()
    mal_lengths = get_mal_data()
    return render_template('dashboard.html', trakt_stats=trakt_stats, movies_shows_lengths=movies_shows_lengths, mal_lengths=mal_lengths)


def get_user_lists():
    headers = {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': os.environ.get('TRAKT_API_KEY')
    }

    trakt_movies_request = Request(
        'https://api.trakt.tv/users/noahffiliation/watchlist/movies', headers=headers)
    trakt_shows_request = Request(
        'https://api.trakt.tv/users/noahffiliation/watchlist/shows', headers=headers)
    response_movies = urlopen(trakt_movies_request).read()
    response_shows = urlopen(trakt_shows_request).read()
    movies = json.loads(response_movies)
    shows = json.loads(response_shows)
    return {'movies': len(movies), 'shows': len(shows)}


def get_mal_data():
    headers = {
        'X-MAL-CLIENT-ID': os.environ.get('MAL_CLIENT_ID')
    }

    mal_completed_request = Request(
        'https://api.myanimelist.net/v2/users/noahffiliation/animelist?limit=400&status=completed', headers=headers)
    mal_plan_to_watch_request = Request(
        'https://api.myanimelist.net/v2/users/noahffiliation/animelist?limit=400&status=plan_to_watch', headers=headers)
    response_completed = urlopen(mal_completed_request).read()
    response_plan_to_watch = urlopen(mal_plan_to_watch_request).read()
    anime_completed = json.loads(response_completed)
    anime_plan_to_watch = json.loads(response_plan_to_watch)
    return {'completed': len(anime_completed['data']), 'plan_to_watch': len(anime_plan_to_watch['data'])}


@app.route('/recently_watched')
def recently_watched():
    headers = {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': os.environ.get('TRAKT_API_KEY')
    }

    trakt_request = Request(
        'https://api.trakt.tv/users/noahffiliation/history/shows', headers=headers)
    response = urlopen(trakt_request).read()
    trakt_list = json.loads(response)
    return render_template('recently_watched.html', trakt_list=trakt_list)


@app.route('/letterboxd')
def letterboxd():
    rss_feed = feedparser.parse('https://letterboxd.com/noahffiliation/rss/')
    return render_template('letterboxd.html', rss_feed=rss_feed)


@app.route('/lastfm')
def lastfm():
    url = 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=noahffiliation&api_key=' + \
        os.environ.get('LASTFM_API_KEY')+'&format=json'
    response = urlopen(url).read()
    lastfm_dict = json.loads(response)
    return render_template('lastfm.html', lastfm_dict=lastfm_dict)


@app.route('/tv_watchlist')
def tv_watchlist():
    headers = {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': os.environ.get('TRAKT_API_KEY')
    }

    watchlist_request = Request(
        'https://api.trakt.tv/users/noahffiliation/watchlist/shows/released', headers=headers)
    response = urlopen(watchlist_request).read()
    watchlist = json.loads(response)
    # Default order for 'released' is newest first
    watchlist.reverse()
    return render_template('tv_watchlist.html', watchlist=watchlist)


@app.route('/movie_watchlist')
def movie_watchlist():
    headers = {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': os.environ.get('TRAKT_API_KEY')
    }

    watchlist_request = Request(
        'https://api.trakt.tv/users/noahffiliation/watchlist/movies/released', headers=headers)
    response = urlopen(watchlist_request).read()
    watchlist = json.loads(response)
    # Default order for 'released' is newest first
    watchlist.reverse()
    return render_template('movie_watchlist.html', watchlist=watchlist)


@app.route('/games')
def games():
    headers = {
        "Accept": "application/json",
        "Notion-Version": "2022-06-28",
        "Authorization": "Bearer " + os.environ.get('NOTION_KEY'),
        "Content-Type": "application/json"
    }
    url = "https://api.notion.com/v1/databases/" + \
        os.environ.get('NOTION_DATABASE_ID') + "/query"
    payload = {"page_size": 30, "filter": {"property": "Priority", "multi_select": {
        "contains": "Current"}}, "sorts": [{"property": "Name", "direction": "ascending"}]}
    response = requests.post(url, json=payload, headers=headers)
    db_object = json.loads(response.text)
    blocklist = []
    for block in db_object["results"]:
        blockHeaders = {
            "Accept": "application/json",
            "Notion-Version": "2022-06-28",
            "Authorization": "Bearer " + os.environ.get('NOTION_KEY')
        }
        blockUrl = "https://api.notion.com/v1/blocks/" + block["id"]
        blockResponse = requests.get(blockUrl, headers=blockHeaders)
        responseObject = json.loads(blockResponse.text)
        blocklist.append(responseObject)
    return render_template('games.html', blocklist=blocklist)


@app.route('/live')
def live():
    return render_template('live.html')


@app.template_filter('strftime')
def _filter_datetime(date, fmt=None):
    date = dateutil.parser.parse(date)
    native = date.replace(tzinfo=None)
    if not fmt:
        fmt = '%B %d %Y %H:%M:%S'
    return native.strftime(fmt)
