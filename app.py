from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return f'<h1>Soon<sup>TM</sup></h1>'