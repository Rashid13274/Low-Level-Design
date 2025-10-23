# Redis 101: A Beginner's Guide


## Redis-Docker Setup:
```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```
* 👉 On this port our Redis actually runs: **6379:6379**
* 👉 On this port we visualize our Redis: **8001**
---
## 🖥️ Accessing Redis CLI
```bash
docker exec -it container_id(3c696059510edbd8066f3fc477bb9b819cedd9bbf0b9d7f13222bf9c6e8dffa2). bash
```
Then enter the Redis CLI:
```bash
redis-cli
```
Test the connection:
```bash
ping
# → pong
```
---
## 1. What is Redis?
Redis (Remote Dictionary Server) is an open-source, in-memory data structure store used as a database, cache, message broker, and streaming engine. It supports versatile data structures, offers sub-millisecond latency, and is designed for high-performance applications.

---

## 2. Key Features
- **In-Memory Storage**: Data resides in RAM for blazing-fast access.
- **Data Structures**: Supports strings, hashes, lists, sets, sorted sets, bitmaps, hyperloglogs, streams, and geospatial indexes.
- **Persistence**: Optional disk persistence via snapshots (RDB) or append-only logs (AOF).
- **Replication & High Availability**: Master-replica replication, Redis Sentinel for failover, and Redis Cluster for horizontal scaling.
- **Pub/Sub**: Publish-subscribe messaging for real-time communication.
- **Atomic Operations**: All operations are atomic, ensuring thread-safe concurrency.

---

## 3. Common Use Cases
- **Caching**: Accelerate web apps by caching frequent queries.
- **Session Storage**: Store user sessions with TTL (time-to-live).
- **Real-Time Analytics**: Track metrics like page views or leaderboards.
- **Message Queues**: Use lists or streams for job queues (e.g., background tasks).
- **Geospatial Data**: Store and query locations (e.g., "find nearby restaurants").

---

## 4. Installation & Quick Start

### Install Redis:
- **Ubuntu**: `sudo apt-get install redis-server`
- **Mac**: `brew install redis`

### Start Redis Server:
```bash
redis-server
```

### Connect via CLI:
```bash
redis-cli
```

### Basic Commands:
```bash
SET name "Alice"       # Store a string
GET name               # Returns "Alice"
INCR counter           # Increment an integer
EXPIRE name 10         # Delete 'name' after 10 seconds
```

---

## 5. Data Structures & Examples

### Strings: Simple key-value pairs
```bash
SET user:1 "Alice"
```

### Hashes: Store objects (e.g., user profiles)
```bash
HSET user:1 name "Alice" age 30 email "alice@example.com"
HGETALL user:1
```

### Lists: Ordered collections (e.g., queues)
```bash
LPUSH tasks "task1"
RPOP tasks
```

### Sets: Unordered unique elements (e.g., tags)
```bash
SADD tags "redis" "database"
SMEMBERS tags
```

### Sorted Sets: Ranked elements by score (e.g., leaderboards)
```bash
ZADD leaderboard 100 "Alice" 90 "Bob"
ZRANGE leaderboard 0 -1 WITHSCORES
```

---

## 6. Persistence & Durability
- **RDB (Snapshotting)**: Periodically save dataset to disk. Configure via `save` in `redis.conf`.
- **AOF (Append-Only File)**: Log every write operation for better durability. Enable with `appendonly yes`.

---

## 7. Security & Best Practices
- **Authentication**: Enable `requirepass yourpassword` in `redis.conf`.
- **Encryption**: Use TLS for data in transit (Redis 6+).
- **ACLs**: Restrict commands per user (Redis 6+).
- **Avoid Long Blocking Operations**: Use pipelines for bulk operations.
- **Monitor Memory**: Use `INFO memory` and set `maxmemory` policies.

---

## 8. Redis Clients & Tools
- **Python**: `redis-py`
- **Node.js**: `node_redis`
- **Java**: `Jedis`
- **GUI Tools**: RedisInsight, Redli, or command-line `redis-cli`.

---

## 9. Learning Resources
- **Official Redis Documentation**
- **Redis University** (free courses)
- **Books**: *Redis in Action*, *The Little Redis Book*

---

## Why Redis?
Redis excels in scenarios requiring speed, flexibility, and scalability. Its rich data structures simplify complex use cases, while in-memory storage ensures unmatched performance.

### Try Redis Online:
```bash
docker run -p 6379:6379 redis
```
Then connect with `redis-cli` and start experimenting!


## Cache Manager: Simplifying Caching in Applications

A **Cache Manager** is a software component or library that simplifies the management of caching in applications. It provides an abstraction layer to store, retrieve, update, and evict cached data efficiently, while handling complexities like cache expiration, eviction policies, and synchronization with underlying data sources (e.g., databases, APIs).

---

### Key Roles of a Cache Manager

#### 1. Abstraction
- Hides low-level cache implementation details (e.g., Redis, Memcached, in-memory caches).
- Provides a unified API to interact with the cache.

#### 2. Cache Policies
- Manages eviction policies (e.g., LRU, LFU, FIFO) to remove old or less-used data.
- Sets TTL (Time-to-Live) for cached items to auto-expire stale data.

#### 3. Performance Optimization
- Reduces latency by serving cached data instead of querying slower sources (e.g., databases).
- Minimizes redundant computations (e.g., caching results of expensive operations).

#### 4. Monitoring & Metrics
- Tracks cache hits, misses, and efficiency.
- Logs evictions and errors for debugging.

#### 5. Integration
- Works seamlessly with frameworks (e.g., Spring Cache, Django Caching, .NET’s MemoryCache).

---

### Popular Cache Managers

| **Cache Manager**   | **Language/Platform** | **Description**                                      |
|----------------------|-----------------------|------------------------------------------------------|
| Spring Cache         | Java (Spring)        | Annotation-driven caching with Redis, Ehcache, etc. |
| Redis Cache          | All                  | Manages Redis-based caching (e.g., redis-py, Redisson). |
| Memcached            | All                  | Distributed in-memory key-value store.              |
| Django Caching       | Python (Django)      | Built-in cache framework with Redis/Memcached support. |
| ASP.NET Cache        | .NET                 | IMemoryCache and IDistributedCache interfaces.      |

---

### How Cache Managers Work

1. **Check Cache First**:
    - When data is requested, the cache manager checks if it exists in the cache.
    - **Cache Hit**: Return cached data.
    - **Cache Miss**: Fetch from the source (e.g., database), then cache it.

2. **Eviction & Expiration**:
    - Automatically removes old data based on TTL or eviction policies.
    - Example: Redis’s `EXPIRE` command or Spring’s `@CacheEvict`.

3. **Concurrency Control**:
    - Ensures thread safety in multi-threaded environments.

---

### Example: Caching with Redis (Python)

Using `redis-py` as a simple cache manager:

```python
import redis  

# Connect to Redis  
r = redis.Redis(host='localhost', port=6379, db=0)  

def get_data(key):  
     # Check cache  
     cached_data = r.get(key)  
     if cached_data:  
          return cached_data  
     else:  
          # Fetch from database/API  
          data = fetch_from_database(key)  
          # Cache with 60-second TTL  
          r.setex(key, 60, data)  
          return data  
```

---

### Types of Cache Managers

#### 1. In-Memory Cache Managers
- Store data in application memory (e.g., Python’s `lru_cache`, .NET’s `MemoryCache`).
- Fast but limited to a single instance.

#### 2. Distributed Cache Managers
- Use Redis, Memcached, or Hazelcast for multi-node environments.
- Ideal for microservices or scalable systems.
