// Step 3: Caching (DI + Singleton)
// Why Cache?
// Reduce latency by storing frequently accessed URLs in memory.

class Cache {
    constructor() {
      this.store = new Map();       // shortCode → longURL
      this.ttl = 60 * 60 * 1000;    // 1 hour TTL (time-to-live)
    }
  
    set(shortCode, longUrl) {
      this.store.set(shortCode, longUrl);
      setTimeout(() => this.store.delete(shortCode), this.ttl);
    }
  
    get(shortCode) {
      return this.store.get(shortCode);
    }
  }

  module.exports = Cache;