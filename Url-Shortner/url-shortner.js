class UrlShortener {
    // Inject dependencies: database, cache, encoder
    constructor(database, cache, encoder) {
      this.database = database;
      this.cache = cache;
      this.encoder = encoder;
    }
  
    shorten(longUrl) {
      // Check if URL is already shortened
      for (const [shortCode, url] of this.database.urlMap) {
        if (url === longUrl) return shortCode;
      }
  
      // Generate short code
      const id = this.database.getNextId();
      const shortCode = this.encoder.encode(id);
      
      // Save to database and cache
      this.database.urlMap.set(shortCode, longUrl);
      this.cache.set(shortCode, longUrl);
      
      return shortCode;
    }
  
    resolve(shortCode) {
      // Check cache first
      const cachedUrl = this.cache.get(shortCode);
      if (cachedUrl) return cachedUrl;
  
      // Fallback to database
      const longUrl = this.database.urlMap.get(shortCode);
      if (longUrl) this.cache.set(shortCode, longUrl); // Refresh cache
      
      return longUrl || null;
    }
  }

module.exports = UrlShortener;