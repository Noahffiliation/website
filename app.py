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
    return render_template('dashboard.html')


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
        "Authorization": "Bearer " + os.environ.get('NOTION_KEY')
    }

    url = "https://api.notion.com/v1/databases/" + \
        os.environ.get('NOTION_DATABASE_ID')
    response = requests.get(url, headers=headers)
    gamelist = json.loads(response.text)
    print(gamelist)
    return render_template('games.html', gamelist=gamelist)


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
