import os
from flask import Flask, render_template
from urllib.request import Request, urlopen
import feedparser
import json

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
        'https://api.trakt.tv/users/noahffiliation/history/', headers=headers)
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


@app.route('/watchlist')
def watchlist():
    headers = {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': os.environ.get('TRAKT_API_KEY')
    }

    watchlist_request = Request(
        'https://api.trakt.tv/users/noahffiliation/watchlist/', headers=headers)
    response = urlopen(watchlist_request).read()
    watchlist = json.loads(response)
    return render_template('watchlist.html', watchlist=watchlist)