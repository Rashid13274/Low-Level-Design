# Redis Interview Questions for Software Developers

This comprehensive collection covers performance-related Redis concepts with tricky MCQs, real-world scenarios, and Node.js/Express.js examples for all interview levels.[1][2][3]

## Basic Level MCQs

### Question 1: Cache Expiration Strategy

**Scenario:** You're building an e-commerce API where product prices change frequently. You need to cache product data but ensure stale data doesn't persist.[2][3]

```javascript
const express = require('express');
const redis = require('redis');
const client = redis.createClient();

app.get('/product/:id', async (req, res) => {
  const productId = req.params.id;
  const cachedProduct = await client.get(`product:${productId}`);
  
  if (cachedProduct) {
    return res.json(JSON.parse(cachedProduct));
  }
  
  const product = await db.getProduct(productId);
  // Which command should you use here?
});
```

**Which Redis command should you use to set a key with automatic expiration?**

A) `client.set('product:123', JSON.stringify(data))`  
B) `client.setEx('product:123', 3600, JSON.stringify(data))`  
C) `client.set('product:123', JSON.stringify(data), 'TTL', 3600)`  
D) `client.expire('product:123', 3600)`

**Answer: B**

**Explanation:** `setEx()` atomically sets both the value and expiration time in a single command, which is more efficient than separate `set()` and `expire()` calls. The second parameter is the expiration time in seconds. Option D only sets expiration on an existing key, and option C uses incorrect syntax.[3][2]

***

### Question 2: Connection Pooling

**Scenario:** Your Node.js application creates a new Redis connection for every incoming request, causing performance degradation under high load.[2]

**What's the performance issue with creating new Redis connections per request?**

A) Redis doesn't support multiple connections  
B) Connection creation is expensive and increases latency  
C) Redis has a maximum of 10 connections  
D) It causes memory leaks only

**Answer: B**

**Explanation:** Creating new connections for every request is expensive due to TCP handshake overhead, authentication, and socket initialization. Using a connection pool with reusable connections significantly reduces latency and improves performance. Redis can handle thousands of connections, but connection creation overhead is the real bottleneck.[4][2]

***

### Question 3: Data Structure Selection

**Scenario:** You need to store user session data containing multiple fields (userId, username, email, lastLogin).[5]

```javascript
// Approach 1
await client.set('session:abc123:userId', '456');
await client.set('session:abc123:username', 'john');
await client.set('session:abc123:email', 'john@example.com');

// Approach 2
await client.hSet('session:abc123', {
  userId: '456',
  username: 'john',
  email: 'john@example.com'
});
```

**Which approach is more memory-efficient for storing session data?**

A) Approach 1 - Multiple string keys  
B) Approach 2 - Hash data structure  
C) Both are equally efficient  
D) Depends on the number of fields

**Answer: B**

**Explanation:** Redis hashes are specifically designed for storing objects with multiple fields and are more memory-efficient than individual string keys. Hashes use special encoding for small objects that significantly reduces memory overhead. Additionally, using `HGETALL` to retrieve all fields is faster than multiple `GET` operations.[6][5]

***

## Intermediate Level MCQs

### Question 4: Cache Stampede Problem

**Scenario:** During a traffic spike, when cache expires, multiple requests simultaneously query the database, causing overload.[1][4]

```javascript
app.get('/popular-products', async (req, res) => {
  const cached = await client.get('popular_products');
  
  if (!cached) {
    // Multiple requests reach here simultaneously
    const products = await db.query('SELECT * FROM products ORDER BY sales DESC LIMIT 10');
    await client.setEx('popular_products', 300, JSON.stringify(products));
    return res.json(products);
  }
  
  res.json(JSON.parse(cached));
});
```

**Which technique best prevents cache stampede?**

A) Decrease cache expiration time  
B) Use Redis locks with SETNX or lock mechanisms  
C) Disable caching during high traffic  
D) Increase database connection pool

**Answer: B**

**Explanation:** The cache stampede problem occurs when multiple processes try to regenerate the same cache simultaneously. Using distributed locks with `SETNX` (Set if Not Exists) or Redis lock libraries ensures only one process regenerates the cache while others wait. Probabilistic early expiration or lock-based patterns prevent database overload during cache misses.[4][1]

```javascript
const locked = await client.set('lock:popular_products', 'locked', {
  NX: true,
  EX: 10
});

if (locked) {
  const products = await db.query('...');
  await client.setEx('popular_products', 300, JSON.stringify(products));
  await client.del('lock:popular_products');
}
```

***

### Question 5: Redis Pipelining Performance

**Scenario:** You need to fetch data for 1000 user IDs from Redis.[2]

```javascript
// Approach 1
for (let i = 0; i < 1000; i++) {
  const user = await client.get(`user:${userIds[i]}`);
  users.push(user);
}

// Approach 2
const pipeline = client.pipeline();
for (let i = 0; i < 1000; i++) {
  pipeline.get(`user:${userIds[i]}`);
}
const users = await pipeline.exec();
```

**What's the primary performance benefit of pipelining (Approach 2)?**

A) Redis processes pipelined commands faster  
B) Reduces network round-trip time  
C) Uses less memory  
D) Automatically caches results

**Answer: B**

**Explanation:** Pipelining sends multiple commands in a single network request without waiting for individual responses, dramatically reducing network latency. For 1000 commands, Approach 1 requires 1000 round trips, while pipelining requires just one. This is especially valuable in high-latency networks. Redis still processes commands sequentially, but network overhead is minimized.[4][2]

***

### Question 6: Eviction Policies

**Scenario:** Your Redis instance has reached max memory limit while caching API responses with varying importance.[5]

**Which eviction policy removes the least recently used keys among those with an expiration set?**

A) `allkeys-lru`  
B) `volatile-lru`  
C) `volatile-ttl`  
D) `noeviction`

**Answer: B**

**Explanation:** `volatile-lru` removes least recently used keys only among those with an expiration (TTL) set. This is ideal when you want to preserve important persistent data while allowing cache entries to be evicted. `allkeys-lru` considers all keys regardless of TTL, `volatile-ttl` removes keys with the shortest remaining TTL, and `noeviction` returns errors when memory is full.[6][5]

***

### Question 7: Real-World Caching Middleware

**Scenario:** Implement caching middleware for Express.js that caches API responses.[3][1]

```javascript
const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    // What's the issue with this approach?
    next();
  };
};

app.get('/weather/:city', cacheMiddleware(3600), async (req, res) => {
  const data = await fetchWeatherAPI(req.params.city);
  res.json(data);
});
```

**What's missing from this caching middleware?**

A) Error handling for Redis failures  
B) Cache storage after the response is sent  
C) TTL configuration  
D) Cache key validation

**Answer: B**

**Explanation:** The middleware correctly retrieves cached data but never stores the response in Redis. You need to intercept the response using `res.json` override or response event listeners to cache the data. A complete implementation should wrap the original `res.json` method to store data before sending it to the client.[7][1][3]

```javascript
res.originalJson = res.json;
res.json = (data) => {
  client.setEx(key, duration, JSON.stringify(data));
  res.originalJson(data);
};
next();
```

***

## Advanced/Deeper Level MCQs

### Question 8: Redis Cluster Performance

**Scenario:** You're implementing Redis Cluster for horizontal scaling across multiple nodes.[2]

```javascript
const Redis = require('ioredis');

const cluster = new Redis.Cluster([
  { host: '127.0.0.1', port: 7000 },
  { host: '127.0.0.1', port: 7001 },
  { host: '127.0.0.1', port: 7002 }
]);

// Which operation will NOT work efficiently in cluster mode?
```

**Which operation has performance implications in Redis Cluster?**

A) `GET` operations on single keys  
B) `MGET` operations on keys in different hash slots  
C) `SET` operations with single keys  
D) `HGET` operations on hash fields

**Answer: B**

**Explanation:** Redis Cluster uses hash slots to distribute keys across nodes. `MGET` with keys in different hash slots requires multiple node requests, losing the performance benefit of batch operations. Commands operating on multiple keys work efficiently only when all keys belong to the same hash slot. Use hash tags (`{user:123}:profile`, `{user:123}:orders`) to ensure related keys map to the same slot.[4][2]

***

### Question 9: Memory Optimization Tricky Scenario

**Scenario:** Your Redis instance stores 1 million user objects.[5][6]

```javascript
// Approach 1: Individual strings
await client.set(`user:${id}:name`, name);
await client.set(`user:${id}:email`, email);
await client.set(`user:${id}:age`, age);

// Approach 2: Hash per user
await client.hSet(`user:${id}`, { name, email, age });

// Approach 3: Serialized JSON string
await client.set(`user:${id}`, JSON.stringify({ name, email, age }));
```

**For small objects (3-5 fields), which approach uses the LEAST memory?**

A) Approach 1 - Multiple string keys  
B) Approach 2 - Hash data structure  
C) Approach 3 - JSON serialization  
D) All use the same memory

**Answer: B**

**Explanation:** Redis uses ziplist encoding for small hashes (configurable with `hash-max-ziplist-entries`), which is extremely memory-efficient. For small objects, hashes can use up to 5-10x less memory than individual strings or JSON serialization. However, this optimization only applies when hashes are small; large hashes use standard encoding. The threshold is controlled by `hash-max-ziplist-entries` (default 512) and `hash-max-ziplist-value` (default 64 bytes).[6][5]

***

### Question 10: Redis Sentinel High Availability

**Scenario:** Implementing automatic failover for production Redis deployment.[2]

```javascript
const Redis = require('ioredis');

const redis = new Redis({
  sentinels: [
    { host: '127.0.0.1', port: 26379 },
    { host: '127.0.0.1', port: 26380 }
  ],
  name: 'mymaster',
  sentinelRetryStrategy: (times) => {
    return Math.min(times * 100, 2000);
  }
});
```

**What happens when the master node fails in Redis Sentinel?**

A) All operations immediately fail until manual intervention  
B) Sentinel automatically promotes a replica to master  
C) Data is lost and needs restoration  
D) Connections switch to read-only mode permanently

**Answer: B**

**Explanation:** Redis Sentinel monitors master and replica nodes, automatically promoting a replica to master when failure is detected. Sentinel ensures high availability with minimal downtime. The client library automatically reconnects to the new master. However, there's a brief window during failover where writes may fail. Using proper retry strategies and connection handling ensures resilience during failover events.[4][2]

***

### Question 11: Cache-Aside vs. Write-Through Pattern

**Scenario:** Implementing caching strategy for a high-write, high-read e-commerce inventory system.[1][4]

```javascript
// Pattern 1: Cache-Aside (Lazy Loading)
app.get('/inventory/:id', async (req, res) => {
  let item = await client.get(`inventory:${req.params.id}`);
  if (!item) {
    item = await db.getInventory(req.params.id);
    await client.setEx(`inventory:${req.params.id}`, 300, JSON.stringify(item));
  }
  res.json(JSON.parse(item));
});

// Pattern 2: Write-Through
app.post('/inventory/:id/update', async (req, res) => {
  await db.updateInventory(req.params.id, req.body);
  await client.setEx(`inventory:${req.params.id}`, 300, JSON.stringify(req.body));
  res.json({ success: true });
});
```

**When is Cache-Aside pattern BETTER than Write-Through?**

A) When write operations are more frequent than reads  
B) When read operations are more frequent than writes  
C) When data consistency is critical  
D) When cache size is unlimited

**Answer: B**

**Explanation:** Cache-Aside (lazy loading) is ideal when reads significantly outnumber writes. It only caches data that's actually requested, preventing cache pollution. Write-Through updates cache on every write, which is wasteful if data isn't frequently read. However, Cache-Aside can have stale data issues. For high-write scenarios with consistency requirements, combine patterns or use cache invalidation strategies.[1][4]

***

### Question 12: Redis Pub/Sub Performance Limitation

**Scenario:** Building a real-time notification system using Redis Pub/Sub.[8][9]

```javascript
const subscriber = redis.duplicate();

subscriber.subscribe('notifications', (err, count) => {
  console.log(`Subscribed to ${count} channels`);
});

subscriber.on('message', async (channel, message) => {
  // Process message
  await processNotification(JSON.parse(message));
});

publisher.publish('notifications', JSON.stringify({ userId: 123, text: 'New order' }));
```

**What's the critical limitation of Redis Pub/Sub for messaging?**

A) Maximum message size is 1KB  
B) Messages are not persisted; offline subscribers miss them  
C) Only one subscriber allowed per channel  
D) Pub/Sub is slower than regular GET/SET

**Answer: B**

**Explanation:** Redis Pub/Sub operates in fire-and-forget mode without message persistence. If a subscriber is offline or disconnected, it permanently loses those messages. For reliable messaging requiring delivery guarantees, use Redis Streams or external message queues (RabbitMQ, Kafka). Pub/Sub is excellent for real-time notifications where missing occasional messages is acceptable, but not for critical event processing.[9][8]

***

### Question 13: Redis Transaction Performance

**Scenario:** Processing multiple related operations atomically.[2]

```javascript
// Scenario: Transfer points between users
app.post('/transfer-points', async (req, res) => {
  const { fromUser, toUser, points } = req.body;
  
  const multi = client.multi();
  multi.decrBy(`user:${fromUser}:points`, points);
  multi.incrBy(`user:${toUser}:points`, points);
  
  const results = await multi.exec();
  res.json({ success: true });
});
```

**What's TRUE about Redis transactions (MULTI/EXEC)?**

A) They provide full ACID isolation like SQL transactions  
B) Commands are queued and executed atomically, but without rollback  
C) Other clients' commands can interleave during execution  
D) Transactions automatically retry on failure

**Answer: B**

**Explanation:** Redis transactions guarantee atomicity (all commands execute together) but don't provide rollback capabilities. If a command fails during execution, other commands still execute. Redis transactions ensure commands execute sequentially without interleaving from other clients. For conditional execution based on key values, use WATCH for optimistic locking. This is different from SQL transactions which provide full ACID guarantees with rollback support.[4][2]

***

### Question 14: Complex Real-World Scenario - Rate Limiting

**Scenario:** Implement API rate limiting using Redis with sliding window algorithm.[8][4]

```javascript
const rateLimit = async (userId, maxRequests, windowSeconds) => {
  const key = `rate:${userId}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  
  const multi = client.multi();
  multi.zRemRangeByScore(key, 0, windowStart);
  multi.zAdd(key, now, `${now}-${Math.random()}`);
  multi.zCard(key);
  multi.expire(key, windowSeconds);
  
  const results = await multi.exec();
  const requestCount = results[2][1];
  
  return requestCount <= maxRequests;
};

app.use(async (req, res, next) => {
  const allowed = await rateLimit(req.userId, 100, 60);
  if (!allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  next();
});
```

**Why is Sorted Set (ZSET) optimal for sliding window rate limiting?**

A) Sorted Sets use less memory than strings  
B) ZREM operations are faster than DEL  
C) Score-based range queries efficiently remove old timestamps  
D) Sorted Sets automatically expire entries

**Answer: C**

**Explanation:** Sorted Sets with timestamp scores enable efficient sliding window implementation. `ZREMRANGEBYSCORE` efficiently removes expired entries based on timestamp ranges, and `ZCARD` counts current requests. This provides accurate rate limiting compared to fixed window approaches. The score-based indexing makes range operations O(log(N) + M) efficient. Alternative approaches using strings or counters can't efficiently implement true sliding windows.[8][4]

***

### Question 15: Redis Memory Fragmentation

**Scenario:** Production Redis instance shows high memory usage but relatively few keys.[5][6]

```bash
INFO memory
used_memory:5368709120
used_memory_rss:8589934592
mem_fragmentation_ratio:1.60
```

**What does a mem_fragmentation_ratio of 1.60 indicate?**

A) 60% of memory is wasted and Redis should be restarted  
B) Redis is using 60% more physical memory than allocated  
C) Cache hit ratio is 60%  
D) 60% of keys are fragmented

**Answer: B**

**Explanation:** Memory fragmentation ratio = RSS memory / used memory. A ratio of 1.60 means Redis uses 60% more physical RAM than its logical memory due to fragmentation. Values between 1.0-1.5 are normal; above 1.5 suggests significant fragmentation caused by frequent updates/deletes. Solutions include `MEMORY PURGE` command, Redis restart, or adjusting `activedefrag` settings. Fragmentation occurs because memory allocators don't perfectly pack data, leaving gaps.[6][5]

***

## Performance Optimization Best Practices

**Key Takeaways for Production Systems:**

Use appropriate data structures: Hashes for objects, Sorted Sets for leaderboards, Sets for unique collections.[5][6]

Implement connection pooling: Reuse connections instead of creating new ones per request.[2]

Apply expiration strategies: Always set TTL for cache entries to prevent memory overflow.[3][2]

Monitor key metrics: Track memory usage, cache hit ratio, fragmentation ratio, and latency.[5]

Use pipelining for bulk operations: Reduce network round trips for multiple commands.[4][2]

Configure eviction policies: Choose appropriate policy based on application needs.[5]

These MCQs cover real-world scenarios developers encounter when building high-performance applications with Redis, Node.js, and Express.js.[3][1][2][4]

[1](https://betterstack.com/community/guides/scaling-nodejs/nodejs-caching-redis/)
[2](https://dev.to/documatic/redis-performance-tuning-how-to-optimize-redis-for-high-traffic-applications-51km)
[3](https://blog.stackademic.com/building-a-weather-app-with-redis-caching-using-node-js-and-express-51088d1146b8)
[4](https://blog.appsignal.com/2021/03/10/powerful-caching-with-redis-in-node.html)
[5](https://www.dragonflydb.io/guides/redis-memory-and-performance-optimization)
[6](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/)
[7](https://www.youtube.com/watch?v=k0_DK4bzHiU)
[8](https://blogs.perficient.com/2023/08/09/boosting-node-js-performance-and-efficiency-with-redis/)
[9](https://www.sitepoint.com/using-redis-node-js/)
[10](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/benchmarks/)
[11](https://stackoverflow.com/questions/5709866/redis-performance-issues)
[12](https://redis.io/learn/howtos/antipatterns)
[13](https://dev.to/patoliyainfotech/caching-in-nodejs-using-redis-for-performance-boost-5hjg)
[14](https://www.slideshare.net/slideshow/redis-data-structure-and-performance-optimization/266235233)
[15](https://redis.io/learn/develop/node/nodecrashcourse/caching)
[16](https://www.ksolves.com/blog/big-data/best-open-source-tools-for-redis)
[17](https://www.mindbowser.com/nodejs-app-speed-boost-caching-redis/)
[18](https://blog.bitsrc.io/optimizing-node-js-performance-with-redis-caching-f509edf33e04)
[19](https://www.scaleway.com/en/blog/redis/)
[20](https://javascript.plainenglish.io/how-i-turned-a-simple-express-server-into-a-production-ready-system-that-handles-real-world-traffic-88d9a500eef5)