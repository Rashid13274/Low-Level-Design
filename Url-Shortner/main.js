// Step 6: Putting It All Together

const Database = require('./database');
const Cache = require('./cache');
const Base62Encoder = require('./encoder');
const UrlShortener = require('./urlShortener');

// Initialize Dependencies
const database = new Database();
const cache = new Cache();
const encoder = new Base62Encoder();
const shortener = new UrlShortener(database, cache, encoder);

// Example usage
const longUrl = "https://www.example.com/very-long-path";
const shortCode = shortener.shorten(longUrl);
console.log(`Shortened URL: https://short.url/${shortCode}`);

const resolvedUrl = shortener.resolve(shortCode);
console.log(`Resolved URL: ${resolvedUrl}`);

module.exports = {
    shortener,
    database,
    cache
};