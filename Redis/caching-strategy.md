# 3. CACHING STRATEGIES - Complete Implementation

---

## **SCENARIO 11: LRU (Least Recently Used) Cache Implementation**

### **Complete LRU Cache with Doubly Linked List (Optimal)**

```javascript
// Node for doubly linked list
class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // key -> Node
    
    // Dummy head and tail for easier operations
    this.head = new Node(0, 0); // Most recently used
    this.tail = new Node(0, 0); // Least recently used
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // Get value from cache
  get(key) {
    if (!this.cache.has(key)) {
      console.log(`Cache MISS: ${key}`);
      return -1; // Cache miss
    }

    const node = this.cache.get(key);
    
    // Move to front (most recently used)
    this.removeNode(node);
    this.addToFront(node);
    
    console.log(`Cache HIT: ${key} = ${JSON.stringify(node.value)}`);
    return node.value;
  }

  // Put key-value in cache
  put(key, value) {
    // If key exists, update value and move to front
    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;
      this.removeNode(node);
      this.addToFront(node);
      console.log(`Cache UPDATE: ${key} = ${JSON.stringify(value)}`);
      return;
    }

    // Create new node
    const newNode = new Node(key, value);
    this.cache.set(key, newNode);
    this.addToFront(newNode);
    
    console.log(`Cache SET: ${key} = ${JSON.stringify(value)}`);

    // If over capacity, remove LRU (tail.prev)
    if (this.cache.size > this.capacity) {
      const lruNode = this.tail.prev;
      this.removeNode(lruNode);
      this.cache.delete(lruNode.key);
      console.log(`Evicted LRU: ${lruNode.key}`);
    }
  }

  // Remove node from linked list
  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  // Add node to front (after head)
  addToFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  // Display current cache state
  display() {
    const items = [];
    let current = this.head.next;
    while (current !== this.tail) {
      items.push(`${current.key}: ${JSON.stringify(current.value)}`);
      current = current.next;
    }
    console.log('Cache state (MRU -> LRU):', items.join(' -> '));
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Clear cache
  clear() {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    console.log('Cache cleared');
  }
}

// Usage Example
const cache = new LRUCache(3);

cache.put('user:1', { name: 'John', age: 30 });
cache.put('user:2', { name: 'Jane', age: 25 });
cache.put('user:3', { name: 'Bob', age: 35 });
cache.display(); // user:3 -> user:2 -> user:1

cache.get('user:1'); // Cache HIT, moves to front
cache.display(); // user:1 -> user:3 -> user:2

cache.put('user:4', { name: 'Alice', age: 28 }); // Evicts user:2 (LRU)
cache.display(); // user:4 -> user:1 -> user:3

cache.get('user:2'); // Cache MISS
cache.get('user:3'); // Cache HIT
cache.display(); // user:3 -> user:4 -> user:1

// Time Complexity: O(1) for both get() and put()
// Space Complexity: O(capacity)
```

---

## **SCENARIO 12: Cache-Aside Pattern (Lazy Loading)**

**Most common caching pattern - check cache first, load from DB on miss.**

```javascript
const Redis = require('ioredis');
const redis = new Redis();

class UserService {
  constructor() {
    this.cacheTTL = 3600; // 1 hour
  }

  async getUser(userId) {
    const cacheKey = `user:${userId}`;
    
    try {
      // 1. Try to get from cache
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        console.log(`Cache HIT for ${cacheKey}`);
        return JSON.parse(cached);
      }
      
      console.log(`Cache MISS for ${cacheKey}`);
      
      // 2. Load from database
      const user = await this.loadUserFromDB(userId);
      
      if (!user) {
        return null;
      }
      
      // 3. Store in cache for future requests
      await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(user));
      console.log(`Cached ${cacheKey} for ${this.cacheTTL}s`);
      
      return user;
      
    } catch (error) {
      console.error('Cache error:', error);
      // Fallback to database if cache fails
      return await this.loadUserFromDB(userId);
    }
  }

  async loadUserFromDB(userId) {
    // Simulate database query
    console.log(`Loading user ${userId} from database...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date()
    };
  }

  async updateUser(userId, updates) {
    // 1. Update database
    await this.updateUserInDB(userId, updates);
    
    // 2. Invalidate cache
    const cacheKey = `user:${userId}`;
    await redis.del(cacheKey);
    console.log(`Invalidated cache for ${cacheKey}`);
    
    // Optional: Write-through pattern
    // const user = await this.loadUserFromDB(userId);
    // await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(user));
  }

  async updateUserInDB(userId, updates) {
    console.log(`Updating user ${userId} in database...`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Usage
(async () => {
  const service = new UserService();
  
  await service.getUser(123); // Cache MISS, loads from DB
  await service.getUser(123); // Cache HIT
  await service.getUser(123); // Cache HIT
  
  await service.updateUser(123, { name: 'Jane Doe' }); // Invalidates cache
  
  await service.getUser(123); // Cache MISS, loads updated data
  await service.getUser(123); // Cache HIT
})();
```

---

## **SCENARIO 13: Write-Through Cache**

**Data is written to cache and database simultaneously.**

```javascript
class ProductService {
  constructor() {
    this.cacheTTL = 7200; // 2 hours
  }

  async getProduct(productId) {
    const cacheKey = `product:${productId}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: ${cacheKey}`);
      return JSON.parse(cached);
    }
    
    // Load from DB
    console.log(`Cache MISS: ${cacheKey}`);
    const product = await this.loadProductFromDB(productId);
    
    // Cache it
    if (product) {
      await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(product));
    }
    
    return product;
  }

  async updateProduct(productId, updates) {
    // 1. Update database
    const product = await this.updateProductInDB(productId, updates);
    
    // 2. Update cache immediately (write-through)
    const cacheKey = `product:${productId}`;
    await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(product));
    console.log(`Write-through: Updated cache ${cacheKey}`);
    
    return product;
  }

  async createProduct(productData) {
    // 1. Create in database
    const product = await this.createProductInDB(productData);
    
    // 2. Write to cache
    const cacheKey = `product:${product.id}`;
    await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(product));
    console.log(`Write-through: Cached new product ${cacheKey}`);
    
    return product;
  }

  async loadProductFromDB(productId) {
    console.log(`Loading product ${productId} from DB`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: productId, name: 'iPhone 15', price: 999 };
  }

  async updateProductInDB(productId, updates) {
    console.log(`Updating product ${productId} in DB`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: productId, ...updates };
  }

  async createProductInDB(productData) {
    console.log('Creating product in DB');
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: Date.now(), ...productData };
  }
}
```

**Write-Through vs Cache-Aside:**

| Pattern | When to Use | Pros | Cons |
|---------|-------------|------|------|
| **Cache-Aside** | Read-heavy workloads | Simple, resilient | Cache misses cause delay |
| **Write-Through** | Write-heavy, data consistency critical | Always in sync | Write latency increased |

---

## **SCENARIO 14: Cache Stampede Prevention**

**Problem:** When cache expires, multiple requests hit database simultaneously.

```javascript
const { Mutex } = require('async-mutex');

class CacheWithStampedePrevention {
  constructor() {
    this.locks = new Map(); // key -> Mutex
  }

  async get(key, loadFunction, ttl = 3600) {
    // Try cache first
    const cached = await redis.get(key);
    if (cached) {
      console.log(`Cache HIT: ${key}`);
      return JSON.parse(cached);
    }

    console.log(`Cache MISS: ${key}`);

    // Get or create lock for this key
    if (!this.locks.has(key)) {
      this.locks.set(key, new Mutex());
    }
    const mutex = this.locks.get(key);

    // Acquire lock
    const release = await mutex.acquire();

    try {
      // Double-check cache (another thread might have loaded it)
      const cached = await redis.get(key);
      if (cached) {
        console.log(`Cache HIT after lock: ${key}`);
        return JSON.parse(cached);
      }

      // Only one thread reaches here
      console.log(`Loading from source: ${key}`);
      const data = await loadFunction();

      // Cache the result
      await redis.setex(key, ttl, JSON.stringify(data));
      console.log(`Cached: ${key}`);

      return data;

    } finally {
      release();
      
      // Clean up lock if no one is waiting
      if (!mutex.isLocked()) {
        this.locks.delete(key);
      }
    }
  }
}

// Usage
const cacheService = new CacheWithStampedePrevention();

async function getPopularProduct(productId) {
  return await cacheService.get(
    `product:${productId}`,
    async () => {
      // Expensive database query
      console.log('Executing expensive DB query...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { id: productId, name: 'iPhone 15', price: 999 };
    },
    3600
  );
}

// Simulate 100 concurrent requests
(async () => {
  const requests = [];
  for (let i = 0; i < 100; i++) {
    requests.push(getPopularProduct(123));
  }

  await Promise.all(requests);
  // Only ONE database query executed!
})();
```

---

## **SCENARIO 15: Multi-Level Cache (L1 + L2)**

**Combine in-memory cache (L1) with Redis (L2) for better performance.**

```javascript
const NodeCache = require('node-cache');
const Redis = require('ioredis');

class MultiLevelCache {
  constructor() {
    this.l1Cache = new NodeCache({ stdTTL: 60 }); // In-memory, 1 min
    this.l2Cache = new Redis(); // Redis, shared across instances
    this.l2TTL = 3600; // 1 hour
  }

  async get(key) {
    // Level 1: In-memory cache (fastest)
    const l1Value = this.l1Cache.get(key);
    if (l1Value !== undefined) {
      console.log(`L1 Cache HIT: ${key}`);
      return l1Value;
    }

    // Level 2: Redis cache (fast)
    const l2Value = await this.l2Cache.get(key);
    if (l2Value) {
      console.log(`L2 Cache HIT: ${key}`);
      const parsed = JSON.parse(l2Value);
      
      // Populate L1 cache
      this.l1Cache.set(key, parsed);
      
      return parsed;
    }

    console.log(`Cache MISS: ${key}`);
    return null;
  }

  async set(key, value, ttl = 3600) {
    // Write to both levels
    this.l1Cache.set(key, value, Math.min(ttl, 60));
    await this.l2Cache.setex(key, ttl, JSON.stringify(value));
    console.log(`Cached in L1 and L2: ${key}`);
  }

  async delete(key) {
    // Invalidate both levels
    this.l1Cache.del(key);
    await this.l2Cache.del(key);
    console.log(`Invalidated: ${key}`);
  }

  async getOrLoad(key, loadFunction, ttl = 3600) {
    // Try multi-level cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Load from source
    console.log(`Loading from source: ${key}`);
    const data = await loadFunction();

    // Cache at both levels
    await this.set(key, data, ttl);

    return data;
  }
}

// Usage
const cache = new MultiLevelCache();

async function getUser(userId) {
  return await cache.getOrLoad(
    `user:${userId}`,
    async () => {
      console.log('Loading from database...');
      await new Promise(resolve => setTimeout(resolve, 100));
      return { id: userId, name: 'John Doe' };
    }
  );
}

(async () => {
  await getUser(123); // L1 MISS, L2 MISS, loads from DB
  await getUser(123); // L1 HIT (in-memory, fastest)
  
  // Simulate another server instance
  cache.l1Cache.flushAll(); // Clear L1
  
  await getUser(123); // L1 MISS, L2 HIT (Redis), repopulates L1
  await getUser(123); // L1 HIT
})();
```

**Benefits of Multi-Level Cache:**
- **L1 (In-Memory)**: Microsecond access, but per-instance
- **L2 (Redis)**: Millisecond access, shared across all instances
- Significantly reduces Redis load
- Improves overall latency

---

## **SCENARIO 16: Cache Warming**

**Pre-load cache with frequently accessed data.**

```javascript
class CacheWarmer {
  constructor() {
    this.redis = new Redis();
  }

  // Warm up cache on application startup
  async warmUp() {
    console.log('Starting cache warm-up...');

    // 1. Load popular products
    await this.warmPopularProducts();

    // 2. Load active user sessions
    await this.warmUserSessions();

    // 3. Load configuration
    await this.warmConfiguration();

    console.log('Cache warm-up completed!');
  }

  async warmPopularProducts() {
    console.log('Warming popular products...');
    
    // Get top 100 products from analytics
    const popularProductIds = await this.getPopularProductIds();

    for (const productId of popularProductIds) {
      const product = await this.loadProductFromDB(productId);
      await this.redis.setex(
        `product:${productId}`,
        7200,
        JSON.stringify(product)
      );
    }

    console.log(`Warmed ${popularProductIds.length} products`);
  }

  async warmUserSessions() {
    console.log('Warming active user sessions...');
    
    // Get active users from database
    const activeUsers = await this.getActiveUsers();

    for (const user of activeUsers) {
      await this.redis.setex(
        `user:${user.id}`,
        3600,
        JSON.stringify(user)
      );
    }

    console.log(`Warmed ${activeUsers.length} user sessions`);
  }

  async warmConfiguration() {
    console.log('Warming configuration...');
    
    const config = await this.loadConfiguration();
    await this.redis.set('config:app', JSON.stringify(config));
    
    console.log('Configuration cached');
  }

  async getPopularProductIds() {
    // Simulate analytics query
    return [101, 102, 103, 104, 105];
  }

  async loadProductFromDB(productId) {
    await new Promise(resolve => setTimeout(resolve, 10));
    return { id: productId, name: `Product ${productId}`, price: 99 };
  }

  async getActiveUsers() {
    return [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ];
  }

  async loadConfiguration() {
    return {
      apiUrl: 'https://api.example.com',
      maxRetries: 3,
      timeout: 5000
    };
  }
}

// Run on application startup
(async () => {
  const warmer = new CacheWarmer();
  await warmer.warmUp();
})();
```

---

## **SCENARIO 17: Cache Invalidation Strategies**

### **Strategy 1: TTL-Based (Time To Live)**

```javascript
class TTLCache {
  async cacheProduct(productId, product) {
    // Different TTL based on data volatility
    const ttl = this.getTTL(product);
    await redis.setex(`product:${productId}`, ttl, JSON.stringify(product));
  }

  getTTL(product) {
    if (product.category === 'electronics') {
      return 3600; // 1 hour (prices change frequently)
    } else if (product.category === 'books') {
      return 86400; // 24 hours (stable data)
    } else {
      return 7200; // 2 hours (default)
    }
  }
}
```

### **Strategy 2: Event-Based Invalidation**

```javascript
const EventEmitter = require('events');

class CacheInvalidator extends EventEmitter {
  constructor() {
    super();
    this.redis = new Redis();
    this.setupListeners();
  }

  setupListeners() {
    // Invalidate cache when data changes
    this.on('product.updated', async (productId) => {
      await this.invalidateProduct(productId);
    });

    this.on('order.created', async (order) => {
      await this.invalidateUserOrders(order.userId);
      await this.invalidateProductStock(order.items);
    });
  }

  async invalidateProduct(productId) {
    const keys = [
      `product:${productId}`,
      `product:${productId}:reviews`,
      `category:${productId}:products` // Invalidate category list too
    ];

    await this.redis.del(...keys);
    console.log(`Invalidated product cache: ${productId}`);
  }

  async invalidateUserOrders(userId) {
    await this.redis.del(`user:${userId}:orders`);
    console.log(`Invalidated orders cache for user: ${userId}`);
  }

  async invalidateProductStock(items) {
    for (const item of items) {
      await this.redis.del(`inventory:${item.productId}`);
    }
    console.log('Invalidated inventory cache');
  }
}

// Usage
const invalidator = new CacheInvalidator();

// When product is updated
async function updateProduct(productId, updates) {
  await db.updateProduct(productId, updates);
  invalidator.emit('product.updated', productId);
}

// When order is created
async function createOrder(orderData) {
  const order = await db.createOrder(orderData);
  invalidator.emit('order.created', order);
}
```

### **Strategy 3: Cache Tagging**

```javascript
class TaggedCache {
  constructor() {
    this.redis = new Redis();
  }

  async set(key, value, tags = [], ttl = 3600) {
    // Store the value
    await this.redis.setex(key, ttl, JSON.stringify(value));

    // Associate tags with this key
    for (const tag of tags) {
      await this.redis.sadd(`tag:${tag}`, key);
    }

    console.log(`Cached ${key} with tags: ${tags.join(', ')}`);
  }

  async get(key) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async invalidateByTag(tag) {
    // Get all keys with this tag
    const keys = await this.redis.smembers(`tag:${tag}`);

    if (keys.length > 0) {
      // Delete all keys
      await this.redis.del(...keys);
      
      // Delete the tag set
      await this.redis.del(`tag:${tag}`);
      
      console.log(`Invalidated ${keys.length} keys with tag: ${tag}`);
    }
  }
}

// Usage
const taggedCache = new TaggedCache();

// Cache product with tags
await taggedCache.set(
  'product:123',
  { id: 123, name: 'iPhone', categoryId: 5 },
  ['product', 'category:5', 'electronics'],
  3600
);

// When category changes, invalidate all products in that category
await taggedCache.invalidateByTag('category:5');
```

---

## **SCENARIO 18: Distributed Cache with Redis**

### **Cache for Multiple Application Instances**

```javascript
const Redis = require('ioredis');
const { Mutex } = require('redis-semaphore');

class DistributedCache {
  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      if (value) {
        console.log(`[Instance ${process.pid}] Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      console.log(`[Instance ${process.pid}] Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      console.log(`[Instance ${process.pid}] Cached: ${key}`);
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  // Distributed lock for critical operations
  async withLock(lockKey, callback, ttl = 10000) {
    const mutex = new Mutex(this.redis, lockKey, {
      lockTimeout: ttl,
      acquireTimeout: 5000,
      retryInterval: 100
    });

    try {
      await mutex.acquire();
      console.log(`[Instance ${process.pid}] Acquired lock: ${lockKey}`);
      
      return await callback();
      
    } finally {
      await mutex.release();
      console.log(`[Instance ${process.pid}] Released lock: ${lockKey}`);
    }
  }

  // Pub/Sub for cache invalidation across instances
  async publish(channel, message) {
    await this.redis.publish(channel, JSON.stringify(message));
  }

  subscribe(channel, handler) {
    const subscriber = this.redis.duplicate();
    subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        handler(JSON.parse(message));
      }
    });
  }
}

// Usage across multiple instances
const cache = new DistributedCache();

// Subscribe to cache invalidation events
cache.subscribe('cache:invalidate', async (data) => {
  console.log(`[Instance ${process.pid}] Received invalidation:`, data);
  await cache.redis.del(data.key);
});

// Update product and notify all instances
async function updateProduct(productId, updates) {
  await cache.withLock(`lock:product:${productId}`, async () => {
    // Update database
    await db.updateProduct(productId, updates);
    
    // Invalidate cache on all instances
    await cache.publish('cache:invalidate', {
      key: `product:${productId}`,
      timestamp: Date.now()
    });
  });
}
```

---

## **SCENARIO 19: Query Result Caching**

**Cache expensive database queries.**

```javascript
const crypto = require('crypto');

class QueryCache {
  constructor() {
    this.redis = new Redis();
    this.defaultTTL = 300; // 5 minutes
  }

  // Generate cache key from query and params
  generateKey(query, params = []) {
    const hash = crypto
      .createHash('md5')
      .update(query + JSON.stringify(params))
      .digest('hex');
    return `query:${hash}`;
  }

  async execute(query, params = [], ttl = this.defaultTTL) {
    const cacheKey = this.generateKey(query, params);

    // Try cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('Query cache HIT');
      return JSON.parse(cached);
    }

    console.log('Query cache MISS - executing query...');
    
    // Execute query
    const result = await db.query(query, params);

    // Cache result
    await this.redis.setex(cacheKey, ttl, JSON.stringify(result));

    return result;
  }

  async invalidatePattern(pattern) {
    // Find all keys matching pattern
    const keys = await this.redis.keys(`query:*${pattern}*`);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
      console.log(`Invalidated ${keys.length} query caches`);
    }
  }
}

// Usage
const queryCache = new QueryCache();

// Cache expensive aggregation query
async function getOrderStats(userId) {
  const query = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_spent,
      AVG(total_amount) as avg_order_value
    FROM orders
    WHERE user_id = $1 AND status = 'completed'
  `;

  return await queryCache.execute(query, [userId], 600); // Cache 10 minutes
}

// When user places new order, invalidate their stats
async function placeOrder(userId, orderData) {
  await db.createOrder(orderData);
  
  // Invalidate cached queries for this user
  await queryCache.invalidatePattern(`user_id = ${userId}`);
}
```

---

## **SCENARIO 20: Cache Performance Metrics**

**Monitor cache effectiveness.**

```javascript
class CacheMetrics {
  constructor() {
    this.redis = new Redis();
    this.hits = 0;
    this.misses = 0;
    this.startTime = Date.now();
  }

  async get(key, loadFunction, ttl = 3600) {
    const start = Date.now();
    
    // Try cache
    const cached = await this.redis.get(key);
    
    if (cached) {
      this.hits++;
      const latency = Date.now() - start;
      console.log(`Cache HIT: ${key} (${latency}ms)`);
      
      // Track hit latency
      await this.redis.lpush('metrics:cache:hit_latency', latency);
      await this.redis.ltrim('metrics:cache:hit_latency', 0, 999); // Keep last 1000
      
      return JSON.parse(cached);
    }

    this.misses++;
    console.log(`Cache MISS: ${key}`);

    // Load data
    const data = await loadFunction();
    const loadLatency = Date.now() - start;
    
    // Track miss latency
    await this.redis.lpush('metrics:cache:miss_latency', loadLatency);
    await this.redis.ltrim('metrics:cache:miss_latency', 0, 999);
    
    // Cache it
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }

  getHitRate() {
    const total = this.hits + this.misses;
    if (total === 0) return 0;
    return ((this.hits / total) * 100).toFixed(2);
  }

  async getMetrics() {
    // Get average latencies
    const hitLatencies = await this.redis.lrange('metrics:cache:hit_latency', 0, -1);
    const missLatencies = await this.redis.lrange('metrics:cache:miss_latency', 0, -1);

    const avgHitLatency = hitLatencies.length > 0
      ? (hitLatencies.reduce((a, b) => a + parseInt(b), 0) / hitLatencies.length).toFixed(2)
      : 0;

    const avgMissLatency = missLatencies.length > 0
      ? (missLatencies.reduce((a, b) => a + parseInt(b), 0) / missLatencies.length).toFixed(2)
      : 0;

    const uptime = ((Date.now() - this.startTime) / 1000).toFixed(0);

    return {
```javascript
      hits: this.hits,
      misses: this.misses,
      total: this.hits + this.misses,
      hitRate: this.getHitRate() + '%',
      avgHitLatency: avgHitLatency + 'ms',
      avgMissLatency: avgMissLatency + 'ms',
      latencyImprovement: ((avgMissLatency - avgHitLatency) / avgMissLatency * 100).toFixed(2) + '%',
      uptime: uptime + 's'
    };
  }

  async resetMetrics() {
    this.hits = 0;
    this.misses = 0;
    this.startTime = Date.now();
    await this.redis.del('metrics:cache:hit_latency', 'metrics:cache:miss_latency');
    console.log('Metrics reset');
  }

  async printReport() {
    const metrics = await this.getMetrics();
    console.log('\n=== Cache Performance Report ===');
    console.log(`Total Requests: ${metrics.total}`);
    console.log(`Cache Hits: ${metrics.hits}`);
    console.log(`Cache Misses: ${metrics.misses}`);
    console.log(`Hit Rate: ${metrics.hitRate}`);
    console.log(`Avg Hit Latency: ${metrics.avgHitLatency}`);
    console.log(`Avg Miss Latency: ${metrics.avgMissLatency}`);
    console.log(`Latency Improvement: ${metrics.latencyImprovement}`);
    console.log(`Uptime: ${metrics.uptime}`);
    console.log('================================\n');
  }
}

// Usage
const cacheMetrics = new CacheMetrics();

async function getProduct(productId) {
  return await cacheMetrics.get(
    `product:${productId}`,
    async () => {
      // Simulate slow database query
      await new Promise(resolve => setTimeout(resolve, 200));
      return { id: productId, name: 'iPhone 15', price: 999 };
    }
  );
}

// Simulate traffic
(async () => {
  // 100 requests
  for (let i = 0; i < 100; i++) {
    const productId = Math.floor(Math.random() * 10) + 1; // 10 different products
    await getProduct(productId);
  }

  await cacheMetrics.printReport();
  
  // Example Output:
  // === Cache Performance Report ===
  // Total Requests: 100
  // Cache Hits: 90
  // Cache Misses: 10
  // Hit Rate: 90.00%
  // Avg Hit Latency: 2.34ms
  // Avg Miss Latency: 205.67ms
  // Latency Improvement: 98.86%
  // Uptime: 25s
  // ================================
})();
```

---

## **WHEN TO USE EACH CACHING STRATEGY**

### **Comprehensive Decision Matrix**

| Scenario              | Strategy                 | Tool             | Why                                  |
|------------------------|--------------------------|------------------|--------------------------------------|
| **Read-heavy API**     | Cache-Aside (Lazy Loading) | Redis           | Only cache what's actually accessed  |
| **Frequent writes**    | Write-Through            | Redis            | Keep cache always in sync            |
| **Real-time data**     | Short TTL (seconds)      | Redis            | Balance freshness vs performance     |
| **Static content**     | Long TTL (hours/days)    | CDN/Redis        | Data rarely changes                  |
| **High traffic endpoint** | Multi-level cache     | In-memory + Redis | Reduce Redis load                    |
| **Expensive queries**  | Query result caching     | Redis            | Avoid repeated DB hits               |
| **Session management** | Redis with TTL           | Redis            | Distributed sessions                 |
| **Rate limiting**      | Counter with expiry      | Redis            | Track requests per window            |
| **Leaderboard**        | Sorted Set               | Redis            | Real-time rankings                   |
| **Shopping cart**      | Hash with TTL            | Redis            | Temporary user state                 |
| **Configuration**      | Cache warming            | Redis            | Pre-load on startup                  |
| **Popular content**    | Predictive caching       | Redis            | Anticipate user needs                |

---

## **PRACTICAL PROJECT: Complete Caching Layer**

### **Full-Featured Cache Service Implementation**

```javascript
const Redis = require('ioredis');
const { Mutex } = require('async-mutex');
const EventEmitter = require('events');

class CacheService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.redis = new Redis(options.redisConfig || {});
    this.localCache = new Map(); // L1 cache
    this.locks = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      l1Hits: 0,
      l2Hits: 0
    };
    
    // Configuration
    this.config = {
      l1TTL: options.l1TTL || 60, // 1 minute
      l2TTL: options.l2TTL || 3600, // 1 hour
      enableL1: options.enableL1 !== false,
      enableMetrics: options.enableMetrics !== false,
      stampedePrevention: options.stampedePrevention !== false
    };

    // Setup periodic cleanup for L1 cache
    if (this.config.enableL1) {
      this.startL1Cleanup();
    }
  }

  // ========== GET OPERATIONS ==========

  async get(key) {
    // L1 Cache check
    if (this.config.enableL1) {
      const l1Value = this.getFromL1(key);
      if (l1Value !== undefined) {
        this.recordMetric('l1Hit');
        return l1Value;
      }
    }

    // L2 Cache check (Redis)
    const l2Value = await this.redis.get(key);
    if (l2Value) {
      this.recordMetric('l2Hit');
      const parsed = JSON.parse(l2Value);
      
      // Populate L1
      if (this.config.enableL1) {
        this.setInL1(key, parsed);
      }
      
      return parsed;
    }

    this.recordMetric('miss');
    return null;
  }

  async getOrLoad(key, loadFunction, options = {}) {
    const {
      l1TTL = this.config.l1TTL,
      l2TTL = this.config.l2TTL,
      tags = []
    } = options;

    // Try cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Stampede prevention
    if (this.config.stampedePrevention) {
      return await this.loadWithLock(key, loadFunction, { l1TTL, l2TTL, tags });
    }

    // Load without lock
    return await this.loadAndCache(key, loadFunction, { l1TTL, l2TTL, tags });
  }

  async loadWithLock(key, loadFunction, options) {
    if (!this.locks.has(key)) {
      this.locks.set(key, new Mutex());
    }
    
    const mutex = this.locks.get(key);
    const release = await mutex.acquire();

    try {
      // Double-check cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      return await this.loadAndCache(key, loadFunction, options);
      
    } finally {
      release();
      if (!mutex.isLocked()) {
        this.locks.delete(key);
      }
    }
  }

  async loadAndCache(key, loadFunction, options) {
    const { l1TTL, l2TTL, tags } = options;
    
    console.log(`Loading: ${key}`);
    const data = await loadFunction();

    await this.set(key, data, { l1TTL, l2TTL, tags });
    
    return data;
  }

  // ========== SET OPERATIONS ==========

  async set(key, value, options = {}) {
    const {
      l1TTL = this.config.l1TTL,
      l2TTL = this.config.l2TTL,
      tags = []
    } = options;

    // Set in L1
    if (this.config.enableL1) {
      this.setInL1(key, value, l1TTL);
    }

    // Set in L2 (Redis)
    await this.redis.setex(key, l2TTL, JSON.stringify(value));

    // Associate tags
    if (tags.length > 0) {
      await this.associateTags(key, tags);
    }

    this.emit('set', { key, value });
    console.log(`Cached: ${key}`);
  }

  // ========== DELETE OPERATIONS ==========

  async delete(key) {
    // Delete from L1
    if (this.config.enableL1) {
      this.localCache.delete(key);
    }

    // Delete from L2
    await this.redis.del(key);

    this.emit('delete', { key });
    console.log(`Deleted: ${key}`);
  }

  async deleteByTag(tag) {
    const keys = await this.redis.smembers(`tag:${tag}`);
    
    if (keys.length > 0) {
      // Delete from L1
      if (this.config.enableL1) {
        keys.forEach(key => this.localCache.delete(key));
      }

      // Delete from L2
      await this.redis.del(...keys);
      await this.redis.del(`tag:${tag}`);

      this.emit('deleteByTag', { tag, count: keys.length });
      console.log(`Deleted ${keys.length} keys with tag: ${tag}`);
    }
  }

  async clear() {
    if (this.config.enableL1) {
      this.localCache.clear();
    }
    await this.redis.flushdb();
    console.log('Cache cleared');
  }

  // ========== L1 CACHE OPERATIONS ==========

  getFromL1(key) {
    const entry = this.localCache.get(key);
    if (!entry) return undefined;

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.localCache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  setInL1(key, value, ttl = this.config.l1TTL) {
    this.localCache.set(key, {
      value,
      expiry: Date.now() + (ttl * 1000)
    });
  }

  startL1Cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.localCache.entries()) {
        if (now > entry.expiry) {
          this.localCache.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  // ========== TAG OPERATIONS ==========

  async associateTags(key, tags) {
    for (const tag of tags) {
      await this.redis.sadd(`tag:${tag}`, key);
    }
  }

  // ========== BATCH OPERATIONS ==========

  async mget(keys) {
    const results = [];
    
    for (const key of keys) {
      const value = await this.get(key);
      results.push(value);
    }
    
    return results;
  }

  async mset(entries, options = {}) {
    for (const [key, value] of Object.entries(entries)) {
      await this.set(key, value, options);
    }
  }

  // ========== METRICS ==========

  recordMetric(type) {
    if (!this.config.enableMetrics) return;

    switch (type) {
      case 'l1Hit':
        this.metrics.l1Hits++;
        this.metrics.hits++;
        break;
      case 'l2Hit':
        this.metrics.l2Hits++;
        this.metrics.hits++;
        break;
      case 'miss':
        this.metrics.misses++;
        break;
    }
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? ((this.metrics.hits / total) * 100).toFixed(2) : 0;
    const l1HitRate = this.metrics.hits > 0 
      ? ((this.metrics.l1Hits / this.metrics.hits) * 100).toFixed(2) 
      : 0;

    return {
      total,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      l1Hits: this.metrics.l1Hits,
      l2Hits: this.metrics.l2Hits,
      hitRate: hitRate + '%',
      l1HitRate: l1HitRate + '%',
      l1Size: this.localCache.size
    };
  }

  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      l1Hits: 0,
      l2Hits: 0
    };
  }

  // ========== ADVANCED PATTERNS ==========

  // Cache with automatic refresh before expiry
  async getWithRefresh(key, loadFunction, options = {}) {
    const {
      l2TTL = this.config.l2TTL,
      refreshThreshold = 0.8 // Refresh at 80% of TTL
    } = options;

    const cached = await this.get(key);
    if (cached !== null) {
      // Check if we should refresh in background
      const ttl = await this.redis.ttl(key);
      const refreshTime = l2TTL * refreshThreshold;
      
      if (ttl < refreshTime) {
        // Refresh in background
        this.loadAndCache(key, loadFunction, options).catch(console.error);
      }
      
      return cached;
    }

    return await this.getOrLoad(key, loadFunction, options);
  }

  // Probabilistic early expiration (Thunder herd prevention)
  async getWithProbabilisticRefresh(key, loadFunction, options = {}) {
    const { l2TTL = this.config.l2TTL } = options;
    
    const cached = await this.get(key);
    if (cached !== null) {
      const ttl = await this.redis.ttl(key);
      const delta = Math.random() * l2TTL * 0.1; // 10% random factor
      
      if (ttl < delta) {
        return await this.getOrLoad(key, loadFunction, options);
      }
      
      return cached;
    }

    return await this.getOrLoad(key, loadFunction, options);
  }
}

// ========== USAGE EXAMPLES ==========

// Initialize cache service
const cache = new CacheService({
  redisConfig: { host: 'localhost', port: 6379 },
  enableL1: true,
  enableMetrics: true,
  stampedePrevention: true
});

// Example 1: Basic caching
async function getUser(userId) {
  return await cache.getOrLoad(
    `user:${userId}`,
    async () => {
      console.log('Loading user from DB...');
      await new Promise(resolve => setTimeout(resolve, 100));
      return { id: userId, name: 'John Doe', email: 'john@example.com' };
    },
    { l1TTL: 60, l2TTL: 3600, tags: ['user'] }
  );
}

// Example 2: Query caching with tags
async function getUserOrders(userId) {
  return await cache.getOrLoad(
    `user:${userId}:orders`,
    async () => {
      console.log('Loading orders from DB...');
      await new Promise(resolve => setTimeout(resolve, 200));
      return [
        { id: 1, total: 100 },
        { id: 2, total: 200 }
      ];
    },
    { l2TTL: 600, tags: ['orders', `user:${userId}`] }
  );
}

// Example 3: Invalidation
async function updateUser(userId, updates) {
  // Update database
  console.log('Updating user in DB...');
  
  // Invalidate specific user cache
  await cache.delete(`user:${userId}`);
  
  // Invalidate all user-related caches
  await cache.deleteByTag(`user:${userId}`);
}

// Example 4: Auto-refresh cache
async function getPopularProduct(productId) {
  return await cache.getWithRefresh(
    `product:${productId}`,
    async () => {
      console.log('Loading product from DB...');
      await new Promise(resolve => setTimeout(resolve, 100));
      return { id: productId, name: 'iPhone 15', price: 999 };
    },
    { l2TTL: 3600, refreshThreshold: 0.8 } // Refresh at 80% of TTL
  );
}

// Example 5: Batch operations
async function getUsersWithOrders(userIds) {
  // Load users
  const userPromises = userIds.map(id => getUser(id));
  const users = await Promise.all(userPromises);
  
  // Load orders for each user
  const orderPromises = userIds.map(id => getUserOrders(id));
  const orders = await Promise.all(orderPromises);
  
  return users.map((user, index) => ({
    ...user,
    orders: orders[index]
  }));
}

// ========== DEMO ==========

(async () => {
  console.log('=== Cache Service Demo ===\n');

  // Test 1: First load (cache miss)
  console.log('Test 1: First load');
  await getUser(123);
  
  // Test 2: Second load (L2 hit, then L1)
  console.log('\nTest 2: Second load');
  await getUser(123);
  
  // Test 3: Third load (L1 hit)
  console.log('\nTest 3: Third load');
  await getUser(123);
  
  // Test 4: Load orders
  console.log('\nTest 4: Load orders');
  await getUserOrders(123);
  
  // Test 5: Update user (invalidation)
  console.log('\nTest 5: Update user');
  await updateUser(123, { name: 'Jane Doe' });
  
  // Test 6: Load after invalidation
  console.log('\nTest 6: Load after invalidation');
  await getUser(123);
  
  // Test 7: Batch load
  console.log('\nTest 7: Batch load');
  await getUsersWithOrders([123, 456, 789]);
  
  // Print metrics
  console.log('\n=== Cache Metrics ===');
  console.log(cache.getMetrics());
  
  // Test 8: Concurrent requests (stampede prevention)
  console.log('\nTest 8: Concurrent requests');
  await cache.clear();
  
  const concurrentRequests = [];
  for (let i = 0; i < 10; i++) {
    concurrentRequests.push(getUser(999));
  }
  await Promise.all(concurrentRequests);
  console.log('Only 1 DB call made despite 10 concurrent requests!');
  
  // Final metrics
  console.log('\n=== Final Metrics ===');
  console.log(cache.getMetrics());
})();

// Expected Output:
// === Cache Service Demo ===
//
// Test 1: First load
// Loading: user:123
// Loading user from DB...
// Cached: user:123
//
// Test 2: Second load
// (L2 hit - no DB call)
//
// Test 3: Third load
// (L1 hit - no Redis call)
//
// Test 4: Load orders
// Loading: user:123:orders
// Loading orders from DB...
// Cached: user:123:orders
//
// Test 5: Update user
// Updating user in DB...
// Deleted: user:123
// Deleted 1 keys with tag: user:123
//
// Test 6: Load after invalidation
// Loading: user:123
// Loading user from DB...
// Cached: user:123
//
// === Cache Metrics ===
// {
//   total: 20,
//   hits: 15,
//   misses: 5,
//   l1Hits: 8,
//   l2Hits: 7,
//   hitRate: '75.00%',
//   l1HitRate: '53.33%',
//   l1Size: 5
// }
```

---

## **KEY TAKEAWAYS & BEST PRACTICES**

### **Concurrency:**
1. **Always use locks** for critical sections modifying shared resources
2. **Acquire locks in consistent order** to prevent deadlocks
3. **Use semaphores** to limit concurrent access
4. **Implement timeouts** to prevent indefinite waiting
5. **Keep critical sections small** for better throughput

### **Database:**
1. **Index foreign keys** and frequently queried columns
2. **Use transactions** for operations that must succeed/fail together
3. **Avoid N+1 queries** - use JOINs or batch loading
4. **Normalize** to reduce redundancy, **denormalize** for read performance
5. **Monitor slow queries** and optimize with EXPLAIN

### **Caching:**
1. **Cache-Aside** for read-heavy workloads
2. **Short TTL** for frequently changing data
3. **Cache warming** for predictable access patterns
4. **Tag-based invalidation** for related data
5. **Multi-level caching** for extreme performance
6. **Monitor hit rates** - aim for 80%+
7. **Implement stampede prevention** for hot keys

### **When NOT to Cache:**
- Real-time data (stock prices, live scores)
- User-specific sensitive data (unless encrypted)
- Data with high write-to-read ratio
- Very large objects (> 1MB)
- Rarely accessed data

---

## **INTERVIEW PREPARATION CHECKLIST**

✅ **Concurrency:**
- Explain race conditions with examples
- Implement mutex-protected critical section
- Explain deadlock and prevention strategies
- Differentiate mutex vs semaphore
- Describe reader-writer lock use cases

✅ **Database:**
- Design normalized schema (3NF)
- Explain ACID properties
- Optimize slow query with indexes
- Solve N+1 query problem
- Implement database transactions

✅ **Caching:**
- Implement LRU cache from scratch
- Explain cache-aside pattern
- Handle cache stampede
- Design multi-level cache
- Calculate and optimize hit rate
- Describe cache invalidation strategies

**Practice these scenarios until you can code them without reference!** 🚀