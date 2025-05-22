# URL Shortener System

## Project Structure
```
Url-Shortner/
│
├── src/
│   ├── database.js      # Singleton pattern for database
│   ├── cache.js         # Cache implementation
│   ├── encoder.js       # Strategy pattern for encoding
│   ├── urlShortener.js  # Core service with DI
│   └── index.js         # System initialization
│
└── README.md
```

 build a URL Shortener in JavaScript while explaining Low-Level Design (LLD) concepts step by step. We’ll use Dependency Injection (DI), Singleton, Caching, and Encoding Strategies, and explain each concept before implementing it.

Step 1: Key LLD Concepts in a URL Shortener
Singleton: A single database/cache instance to avoid duplication.

Dependency Injection: Decouple components (e.g., database, cache) for testability.

Encoding Strategy: Convert long URLs to short codes (e.g., Base62).

Caching: Store frequently accessed URLs to reduce database calls.

Atomic Operations: Ensure thread-safe ID generation (simulated here).



Role of LLD Concepts
Singleton Database:

Ensures a single source of truth for URL mappings and ID generation.

Dependency Injection:

UrlShortener receives database, cache, and encoder as external dependencies, making it easy to swap components (e.g., use Redis instead of in-memory cache).

Caching:

Reduces database load by storing frequently resolved URLs in memory.

Encoding Strategy:

Base62 converts numeric IDs to short strings (Strategy Pattern).

Atomic Operations:

getNextId() simulates atomic ID generation (critical for avoiding duplicates in distributed systems).

How to Extend This System
Custom Encoding:
Swap Base62Encoder with another encoder (e.g., MD5 hashing for collision resistance).

Persistence:
Replace the in-memory Map with a database like PostgreSQL or Redis.

Analytics:
Track clicks by injecting a Tracker service via DI.

Expiration:
Add TTL for URLs in the Database class.

