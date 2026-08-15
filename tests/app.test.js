const request = require('supertest');
let app;
const axios = require('axios');

const mockQuery = jest.fn();
const mockRetrieve = jest.fn();
const mockParseURL = jest.fn();
const mockLastfmRequest = jest.fn();

// Mock dependencies
jest.mock('apicache', () => ({
    middleware: jest.fn((duration, toggle) => (req, res, next) => {
        if (typeof toggle === 'function') {
            toggle(req, res);
        }
        return next();
    }),
}));

jest.mock('axios');

jest.mock('rss-parser', () => {
    return jest.fn().mockImplementation(() => {
        return { parseURL: mockParseURL };
    });
});

jest.mock('@notionhq/client', () => {
    return {
        Client: jest.fn().mockImplementation(() => {
            return {
                databases: { query: mockQuery },
                pages: { retrieve: mockRetrieve }
            };
        })
    };
});

jest.mock('lastfm', () => {
    return {
        LastFmNode: jest.fn().mockImplementation(() => {
            return {
                request: mockLastfmRequest
            };
        })
    };
});

describe('App and Routes', () => {
    beforeAll(async () => {
        try {
            app = (await import('../app.mjs')).default;
        } catch (error) {
            console.error('Failed to import app.mjs:', error);
            throw error;
        }
    });

    beforeEach(() => {
        mockQuery.mockResolvedValue({
            results: [{ id: '1', properties: { Name: { title: [{ plain_text: 'Game 1' }] } } }]
        });
        mockRetrieve.mockResolvedValue({
            properties: {
                Name: { title: [{ plain_text: 'Game 1' }] },
                Priority: { multi_select: [{ name: 'High' }] },
                Platform: { multi_select: [{ name: 'PC' }] }
            }
        });
        mockParseURL.mockResolvedValue({ items: [] });
        mockLastfmRequest.mockImplementation((method, params) => {
            if (params.handlers?.success) {
                params.handlers.success({ recenttracks: { track: [] } });
            }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /', () => {
        it('should render the index page', async () => {
            const res = await request(app).get('/');
            expect(res.statusCode).toEqual(200);
            expect(res.text).toContain('<!DOCTYPE html>');
        });
    });

    describe('GET /stats', () => {
        it('should render stats page with data', async () => {
            axios.get
                .mockResolvedValueOnce({ data: { movies: { watched: 10 }, shows: { watched: 5 } } })
                .mockResolvedValueOnce({ data: [] })
                .mockResolvedValueOnce({ data: [] })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } });

            const res = await request(app).get('/stats');
            expect(res.statusCode).toEqual(200);
            expect(axios.get).toHaveBeenCalledTimes(5);
        });

        it('should handle errors gracefully', async () => {
            axios.get.mockRejectedValue(new Error('API Error'));
            const res = await request(app).get('/stats');
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('GET /games', () => {
        it('should render games page', async () => {
            const res = await request(app).get('/games');
            expect(res.statusCode).toEqual(200);
        });

        it('should handle notion query error', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Notion DB Error'));
            const res = await request(app).get('/games');
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('GET /game/:id', () => {
        it('should render game detail page', async () => {
            const res = await request(app).get('/game/123');
            expect(res.statusCode).toEqual(200);
        });

        it('should handle notion page retrieve error', async () => {
            mockRetrieve.mockRejectedValueOnce(new Error('Notion Page Error'));
            const res = await request(app).get('/game/123');
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('GET /movies', () => {
        it('should render movies page', async () => {
            axios.get.mockResolvedValueOnce({ data: [] });
            const res = await request(app).get('/movies');
            expect(res.statusCode).toEqual(200);
        });

        it('should handle errors', async () => {
            axios.get.mockRejectedValueOnce(new Error('API Error'));
            const res = await request(app).get('/movies');
            expect(res.statusCode).toEqual(500);
            expect(res.text).toContain('Error');
        });
    });

    describe('GET /movie/:id', () => {
        it('should render movie detail page for valid ID', async () => {
            axios.get.mockResolvedValueOnce({ data: { title: 'Movie 1', year: 2024, tagline: 'A great movie', overview: 'Movie overview' } });
            const res = await request(app).get('/movie/123');
            expect(res.statusCode).toEqual(200);
            expect(res.text).toContain('Movie 1');
            expect(res.text).toContain('A great movie');
        });

        it('should redirect for invalid ID', async () => {
            const res = await request(app).get('/movie/abc');
            expect(res.statusCode).toEqual(302);
            expect(res.header.location).toBe('/movies');
        });

        it('should handle error when movie fetch fails', async () => {
            axios.get.mockRejectedValueOnce(new Error('Movie fetch error'));
            const res = await request(app).get('/movie/123');
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('GET /letterboxd', () => {
        it('should render letterboxd page', async () => {
            const res = await request(app).get('/letterboxd');
            expect(res.statusCode).toEqual(200);
        });

        it('should handle RSS parse error', async () => {
            mockParseURL.mockRejectedValueOnce(new Error('RSS Error'));
            const res = await request(app).get('/letterboxd');
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('GET /tv', () => {
        it('should render tv page', async () => {
            axios.get.mockResolvedValueOnce({ data: [] });
            const res = await request(app).get('/tv');
            expect(res.statusCode).toEqual(200);
        });

        it('should handle error in tv list', async () => {
            axios.get.mockRejectedValueOnce(new Error('TV List Error'));
            const res = await request(app).get('/tv');
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('GET /tv/:id', () => {
        it('should render tv detail page for valid ID', async () => {
            axios.get.mockResolvedValueOnce({ data: { title: 'Show 1', year: 2023, overview: 'Show overview' } });
            const res = await request(app).get('/tv/123');
            expect(res.statusCode).toEqual(200);
            expect(axios.get).toHaveBeenCalledWith(
                'https://api.trakt.tv/shows/123',
                expect.objectContaining({
                    params: { extended: 'full' }
                })
            );
        });

        it('should redirect for invalid ID', async () => {
            const res = await request(app).get('/tv/abc');
            expect(res.statusCode).toEqual(302);
            expect(res.header.location).toBe('/tv');
        });

        it('should handle error in tv detail', async () => {
            axios.get.mockRejectedValueOnce(new Error('TV detail error'));
            const res = await request(app).get('/tv/123');
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('GET /episodes', () => {
        it('should render episodes page', async () => {
            axios.get.mockResolvedValueOnce({ data: [] });
            const res = await request(app).get('/episodes');
            expect(res.statusCode).toEqual(200);
        });

        it('should handle error in episodes list', async () => {
            axios.get.mockRejectedValueOnce(new Error('Episodes list error'));
            const res = await request(app).get('/episodes');
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('GET /episode/:id/:season/:episode', () => {
        it('should render episode detail page for valid params', async () => {
            axios.get.mockResolvedValueOnce({ data: { title: 'Episode 1', overview: 'Episode overview' } });
            const res = await request(app).get('/episode/123/1/2');
            expect(res.statusCode).toEqual(200);
            expect(axios.get).toHaveBeenCalledWith(
                'https://api.trakt.tv/shows/123/seasons/1/episodes/2',
                expect.objectContaining({
                    params: { extended: 'full' }
                })
            );
        });

        it('should redirect for invalid params', async () => {
            const res = await request(app).get('/episode/abc/1/1');
            expect(res.statusCode).toEqual(302);
            expect(res.header.location).toBe('/episodes');
        });

        it('should handle error in episode detail', async () => {
            axios.get.mockRejectedValueOnce(new Error('Episode detail error'));
            const res = await request(app).get('/episode/123/1/2');
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('GET /lastfm', () => {
        it('should render lastfm page', async () => {
            const res = await request(app).get('/lastfm');
            expect(res.statusCode).toEqual(200);
        });

        it('should handle lastfm request error', async () => {
            mockLastfmRequest.mockImplementationOnce((method, params) => {
                if (params.handlers?.error) {
                    params.handlers.error(new Error('LastFM API Error'));
                }
            });
            const res = await request(app).get('/lastfm');
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/unknown-route');
            expect(res.statusCode).toEqual(404);
        });
    });

    describe('Error Handler', () => {
        it('should render error details in development', async () => {
            app.set('env', 'development');
            axios.get.mockRejectedValueOnce(new Error('Dev Error'));
            const res = await request(app).get('/movies');
            expect(res.statusCode).toEqual(500);
            expect(res.text).toContain('Dev Error');
            app.set('env', 'test');
        });

        it('should not render error details in production', async () => {
            app.set('env', 'production');
            axios.get.mockRejectedValueOnce(new Error('Prod Error'));
            const res = await request(app).get('/movies');
            expect(res.statusCode).toEqual(500);
            app.set('env', 'test');
        });
    });
});
