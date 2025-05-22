const { shortener } = require('./main.js');

// Test 1: URL Shortening
console.log('\n--- Test 1: URL Shortening ---');
const longUrl = "https://www.example.com/very-long-path?param=123";
const shortCode = shortener.shorten(longUrl);
console.log(`Original URL: ${longUrl}`);
console.log(`Shortened URL: https://short.url/${shortCode}`);

// Test 2: URL Resolution
console.log('\n--- Test 2: URL Resolution ---');
const resolved = shortener.resolve(shortCode);
console.log(`Resolved URL: ${resolved}`);
console.log(`Resolution successful: ${resolved === longUrl ? '✅' : '❌'}`);


// cd "c:\Users\TAMANNA RAHMAN\OneDrive\Documents\Low Level Design\Url-Shortner\src"
// node test.js