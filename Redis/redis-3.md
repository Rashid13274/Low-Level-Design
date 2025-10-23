# Redis Core Concepts - Detailed JavaScript Implementation

## 1. Key-Value Store Fundamentals

### What is Key-Value Store?
A key-value store is like a digital dictionary where each **key** maps to a **value**. Think of it as a real-world dictionary:
- **Key** = Word you're looking up
- **Value** = Definition of that word

### Basic Operations:
```javascript
// Real-world analogy: Dictionary
const dictionary = {
  "apple": "A sweet red fruit",
  "banana": "A long yellow fruit"
};
// In Redis: "apple" is the key, "A sweet red fruit" is the value
```

## 2. Basic Data Types - Detailed Implementation

### Strings Data Type

#### **SET Method**
```javascript
/**
 * SET - Stores a string value
 * 
 * What it does: Stores a string value associated with a key
 * When to use: For caching, storing simple data, counters, flags
 * 
 * @param {string} key - The unique identifier for the data
 * @param {string} value - The data to store
 * @param {Object} options - Additional options (EX, PX, NX, XX)
 * @returns {Promise<string>} - Returns "OK" if successful
 */
async function setStringExample() {
    try {
        // Basic SET
        const result1 = await redis.set('username', 'john_doe');
        console.log(result1); // "OK"
        
        // SET with expiration (EX seconds)
        const result2 = await redis.set('temporary_data', 'This will expire', 'EX', 60);
        console.log(result2); // "OK" - expires in 60 seconds
        
        // SET only if key does NOT exist (NX option)
        const result3 = await redis.set('unique_key', 'value', 'NX');
        console.log(result3); // "OK" if key didn't exist, null if it existed
        
        // SET only if key EXISTS (XX option)
        const result4 = await redis.set('existing_key', 'new_value', 'XX');
        console.log(result4); // "OK" if key existed, null if it didn't
        
    } catch (error) {
        console.error('SET operation failed:', error);
    }
}
```

#### **GET Method**
```javascript
/**
 * GET - Retrieves a string value
 * 
 * What it does: Fetches the value associated with a key
 * When to use: To retrieve cached data, configuration, simple values
 * 
 * @param {string} key - The key to retrieve
 * @returns {Promise<string|null>} - The value or null if key doesn't exist
 */
async function getStringExample() {
    try {
        // Store data first
        await redis.set('user:1001:name', 'Alice Johnson');
        await redis.set('user:1001:email', 'alice@example.com');
        
        // GET the values
        const userName = await redis.get('user:1001:name');
        const userEmail = await redis.get('user:1001:email');
        const nonExistent = await redis.get('user:9999:name');
        
        console.log('User Name:', userName); // "Alice Johnson"
        console.log('User Email:', userEmail); // "alice@example.com"
        console.log('Non-existent:', nonExistent); // null
        
    } catch (error) {
        console.error('GET operation failed:', error);
    }
}
```

#### **INCR, DECR Methods**
```javascript
/**
 * INCR/DECR - Atomic increment/decrement operations
 * 
 * What it does: Atomically increases/decreases a numeric value by 1
 * When to use: Counters, rate limiting, unique ID generation
 * 
 * @param {string} key - The key containing the numeric value
 * @returns {Promise<number>} - The new value after increment/decrement
 */
async function counterExamples() {
    try {
        // Set initial value
        await redis.set('page_views', 0);
        
        // INCR - increases by 1
        const views1 = await redis.incr('page_views');
        console.log('After first INCR:', views1); // 1
        
        const views2 = await redis.incr('page_views');
        console.log('After second INCR:', views2); // 2
        
        // INCRBY - increase by specific amount
        const views3 = await redis.incrby('page_views', 5);
        console.log('After INCRBY 5:', views3); // 7
        
        // DECR - decrease by 1
        const views4 = await redis.decr('page_views');
        console.log('After DECR:', views4); // 6
        
        // DECRBY - decrease by specific amount
        const views5 = await redis.decrby('page_views', 3);
        console.log('After DECRBY 3:', views5); // 3
        
    } catch (error) {
        console.error('Counter operations failed:', error);
    }
}
```

### Lists Data Type

#### **LPUSH, RPUSH, LPOP, RPOP Methods**
```javascript
/**
 * LISTS - Ordered collection of strings
 * 
 * What they are: Similar to arrays, maintain insertion order
 * When to use: Message queues, activity feeds, recent items lists
 */
async function listExamples() {
    try {
        // LPUSH - Add to beginning (left) of list
        await redis.lpush('recent_activities', 'User logged in');
        await redis.lpush('recent_activities', 'User viewed profile');
        
        // RPUSH - Add to end (right) of list
        await redis.rpush('recent_activities', 'User logged out');
        
        // LRANGE - Get range of elements
        const allActivities = await redis.lrange('recent_activities', 0, -1);
        console.log('All activities:', allActivities);
        // Output: ['User viewed profile', 'User logged in', 'User logged out']
        
        // LPOP - Remove and get first element (left)
        const firstActivity = await redis.lpop('recent_activities');
        console.log('First activity:', firstActivity); // 'User viewed profile'
        
        // RPOP - Remove and get last element (right)
        const lastActivity = await redis.rpop('recent_activities');
        console.log('Last activity:', lastActivity); // 'User logged out'
        
        // LLEN - Get list length
        const length = await redis.llen('recent_activities');
        console.log('Remaining activities:', length); // 1
        
    } catch (error) {
        console.error('List operations failed:', error);
    }
}
```

#### **Message Queue Implementation**
```javascript
/**
 * Message Queue using Redis Lists
 * 
 * What it does: Implements a simple producer-consumer pattern
 * When to use: Background job processing, task queues, email sending
 */
class MessageQueue {
    constructor(redisClient, queueName) {
        this.redis = redisClient;
        this.queueName = queueName;
    }
    
    /**
     * Add message to queue
     * @param {Object} message - The message object to queue
     * @returns {Promise<number>} - New length of the queue
     */
    async enqueue(message) {
        const messageString = JSON.stringify(message);
        return await this.redis.lpush(this.queueName, messageString);
    }
    
    /**
     * Remove and get message from queue
     * @returns {Promise<Object|null>} - The message object or null if empty
     */
    async dequeue() {
        const messageString = await this.redis.rpop(this.queueName);
        if (messageString) {
            return JSON.parse(messageString);
        }
        return null;
    }
    
    /**
     * Get queue length
     * @returns {Promise<number>} - Number of messages in queue
     */
    async getLength() {
        return await this.redis.llen(this.queueName);
    }
    
    /**
     * Peek at messages without removing them
     * @param {number} start - Start index
     * @param {number} end - End index
     * @returns {Promise<Array>} - Array of messages
     */
    async peek(start = 0, end = 10) {
        const messages = await this.redis.lrange(this.queueName, start, end);
        return messages.map(msg => JSON.parse(msg));
    }
}

// Usage Example
async function messageQueueDemo() {
    const emailQueue = new MessageQueue(redis, 'email_queue');
    
    // Producer: Add emails to queue
    await emailQueue.enqueue({
        to: 'user1@example.com',
        subject: 'Welcome Email',
        body: 'Welcome to our service!'
    });
    
    await emailQueue.enqueue({
        to: 'user2@example.com', 
        subject: 'Password Reset',
        body: 'Here is your reset link...'
    });
    
    console.log('Queue length:', await emailQueue.getLength()); // 2
    
    // Consumer: Process emails
    const email = await emailQueue.dequeue();
    if (email) {
        console.log('Processing email to:', email.to);
        // Simulate sending email
        // await sendEmail(email);
    }
}
```

### Sets Data Type

#### **SADD, SMEMBERS, SISMEMBER Methods**
```javascript
/**
 * SETS - Unordered collection of unique strings
 * 
 * What they are: Collections with no duplicates, fast membership checks
 * When to use: Tags, unique visitors, friends lists, categories
 */
async function setExamples() {
    try {
        // SADD - Add members to set (duplicates are ignored)
        await redis.sadd('article:1001:tags', 'technology');
        await redis.sadd('article:1001:tags', 'programming');
        await redis.sadd('article:1001:tags', 'javascript');
        await redis.sadd('article:1001:tags', 'technology'); // Duplicate - ignored
        
        // SMEMBERS - Get all members of set
        const allTags = await redis.smembers('article:1001:tags');
        console.log('All tags:', allTags);
        // Output: ['technology', 'programming', 'javascript'] (order may vary)
        
        // SISMEMBER - Check if member exists in set
        const hasTechnology = await redis.sismember('article:1001:tags', 'technology');
        const hasPython = await redis.sismember('article:1001:tags', 'python');
        
        console.log('Has technology tag:', hasTechnology); // 1 (true)
        console.log('Has python tag:', hasPython); // 0 (false)
        
        // SCARD - Get number of members in set
        const tagCount = await redis.scard('article:1001:tags');
        console.log('Number of tags:', tagCount); // 3
        
        // SREM - Remove members from set
        await redis.srem('article:1001:tags', 'javascript');
        const remainingTags = await redis.smembers('article:1001:tags');
        console.log('After removal:', remainingTags); // ['technology', 'programming']
        
    } catch (error) {
        console.error('Set operations failed:', error);
    }
}
```

#### **Set Operations - UNION, INTER, DIFF**
```javascript
/**
 * Set Operations - Mathematical operations on multiple sets
 * 
 * What they do: Perform union, intersection, difference operations
 * When to use: Recommendation systems, common interests, analytics
 */
async function setOperationsExample() {
    try {
        // Create sample sets
        await redis.sadd('users:alice:interests', 'music', 'movies', 'sports');
        await redis.sadd('users:bob:interests', 'music', 'books', 'travel');
        await redis.sadd('users:charlie:interests', 'movies', 'sports', 'food');
        
        // SINTER - Intersection (common interests between Alice and Bob)
        const commonAliceBob = await redis.sinter('users:alice:interests', 'users:bob:interests');
        console.log('Alice and Bob common interests:', commonAliceBob); // ['music']
        
        // SUNION - Union (all unique interests across all users)
        const allInterests = await redis.sunion(
            'users:alice:interests', 
            'users:bob:interests', 
            'users:charlie:interests'
        );
        console.log('All unique interests:', allInterests);
        // ['music', 'movies', 'sports', 'books', 'travel', 'food']
        
        // SDIFF - Difference (interests Alice has but Bob doesn't)
        const aliceNotBob = await redis.sdiff('users:alice:interests', 'users:bob:interests');
        console.log('Alice interests not shared with Bob:', aliceNotBob); // ['movies', 'sports']
        
    } catch (error) {
        console.error('Set operations failed:', error);
    }
}
```

## 3. CRUD Operations - Complete Implementation

### Comprehensive CRUD Manager
```javascript
/**
 * Comprehensive CRUD Operations Manager for Redis
 * 
 * Demonstrates Create, Read, Update, Delete operations
 * with proper error handling and best practices
 */
class RedisCRUDManager {
    constructor(redisClient) {
        this.redis = redisClient;
    }
    
    /**
     * CREATE - Store new data
     * @param {string} key - Unique identifier
     * @param {string|Object} value - Data to store
     * @param {number} ttlSeconds - Time to live in seconds (optional)
     * @returns {Promise<boolean>} - Success status
     */
    async create(key, value, ttlSeconds = null) {
        try {
            // Convert objects to JSON strings
            const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
            
            if (ttlSeconds) {
                await this.redis.setex(key, ttlSeconds, valueToStore);
            } else {
                await this.redis.set(key, valueToStore);
            }
            
            console.log(`CREATE: Successfully stored data for key "${key}"`);
            return true;
        } catch (error) {
            console.error(`CREATE: Failed to store data for key "${key}":`, error);
            return false;
        }
    }
    
    /**
     * READ - Retrieve data by key
     * @param {string} key - Key to retrieve
     * @param {boolean} parseJSON - Whether to parse JSON strings (default: true)
     * @returns {Promise<*|null>} - Retrieved data or null if not found
     */
    async read(key, parseJSON = true) {
        try {
            const data = await this.redis.get(key);
            
            if (data === null) {
                console.log(`READ: Key "${key}" not found`);
                return null;
            }
            
            // Attempt to parse JSON if requested and possible
            if (parseJSON) {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`READ: Successfully retrieved and parsed data for key "${key}"`);
                    return parsed;
                } catch {
                    // Not JSON, return as string
                    console.log(`READ: Successfully retrieved string data for key "${key}"`);
                    return data;
                }
            }
            
            console.log(`READ: Successfully retrieved data for key "${key}"`);
            return data;
        } catch (error) {
            console.error(`READ: Failed to retrieve data for key "${key}":`, error);
            return null;
        }
    }
    
    /**
     * UPDATE - Update existing data
     * @param {string} key - Key to update
     * @param {string|Object} newValue - New data value
     * @param {number} ttlSeconds - New TTL in seconds (optional, maintains existing if not provided)
     * @returns {Promise<boolean>} - Success status
     */
    async update(key, newValue, ttlSeconds = null) {
        try {
            // First check if key exists
            const exists = await this.redis.exists(key);
            if (!exists) {
                console.log(`UPDATE: Key "${key}" does not exist`);
                return false;
            }
            
            const valueToStore = typeof newValue === 'object' ? JSON.stringify(newValue) : newValue;
            
            if (ttlSeconds) {
                // Set with new TTL
                await this.redis.setex(key, ttlSeconds, valueToStore);
            } else {
                // Get current TTL to preserve it
                const currentTTL = await this.redis.ttl(key);
                await this.redis.set(key, valueToStore);
                
                // If key had a TTL, restore it
                if (currentTTL > 0) {
                    await this.redis.expire(key, currentTTL);
                }
            }
            
            console.log(`UPDATE: Successfully updated data for key "${key}"`);
            return true;
        } catch (error) {
            console.error(`UPDATE: Failed to update data for key "${key}":`, error);
            return false;
        }
    }
    
    /**
     * DELETE - Remove data by key
     * @param {string} key - Key to delete
     * @returns {Promise<boolean>} - Success status
     */
    async delete(key) {
        try {
            const result = await this.redis.del(key);
            const success = result > 0;
            
            if (success) {
                console.log(`DELETE: Successfully deleted key "${key}"`);
            } else {
                console.log(`DELETE: Key "${key}" did not exist`);
            }
            
            return success;
        } catch (error) {
            console.error(`DELETE: Failed to delete key "${key}":`, error);
            return false;
        }
    }
    
    /**
     * EXISTS - Check if key exists
     * @param {string} key - Key to check
     * @returns {Promise<boolean>} - Existence status
     */
    async exists(key) {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`EXISTS: Failed to check existence for key "${key}":`, error);
            return false;
        }
    }
    
    /**
     * BULK OPERATIONS - Multiple CRUD operations
     * @param {Array} operations - Array of operation objects
     */
    async bulkOperations(operations) {
        const results = [];
        
        for (const operation of operations) {
            try {
                let result;
                
                switch (operation.type) {
                    case 'CREATE':
                        result = await this.create(operation.key, operation.value, operation.ttl);
                        break;
                    case 'READ':
                        result = await this.read(operation.key, operation.parseJSON);
                        break;
                    case 'UPDATE':
                        result = await this.update(operation.key, operation.value, operation.ttl);
                        break;
                    case 'DELETE':
                        result = await this.delete(operation.key);
                        break;
                    default:
                        result = { error: `Unknown operation type: ${operation.type}` };
                }
                
                results.push({
                    operation: operation.type,
                    key: operation.key,
                    success: true,
                    result: result
                });
            } catch (error) {
                results.push({
                    operation: operation.type,
                    key: operation.key,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }
}

// Comprehensive CRUD Demo
async function comprehensiveCRUDDemo() {
    const crudManager = new RedisCRUDManager(redis);
    
    console.log('=== COMPREHENSIVE CRUD DEMONSTRATION ===\n');
    
    // CREATE examples
    console.log('1. CREATE Operations:');
    await crudManager.create('user:1001', {
        id: 1001,
        name: 'John Doe',
        email: 'john@example.com',
        preferences: { theme: 'dark', notifications: true }
    }, 3600); // Expire in 1 hour
    
    await crudManager.create('app:settings', {
        version: '1.0.0',
        features: { chat: true, video: false },
        maxUsers: 1000
    });
    
    await crudManager.create('simple:string', 'Hello Redis World!');
    
    // READ examples  
    console.log('\n2. READ Operations:');
    const userData = await crudManager.read('user:1001');
    console.log('User data:', userData);
    
    const settings = await crudManager.read('app:settings');
    console.log('App settings:', settings);
    
    const simpleString = await crudManager.read('simple:string', false);
    console.log('Simple string:', simpleString);
    
    const nonExistent = await crudManager.read('non:existent:key');
    console.log('Non-existent key:', nonExistent);
    
    // UPDATE examples
    console.log('\n3. UPDATE Operations:');
    await crudManager.update('user:1001', {
        id: 1001,
        name: 'John Doe Updated',
        email: 'john.updated@example.com',
        preferences: { theme: 'light', notifications: false }
    });
    
    const updatedUser = await crudManager.read('user:1001');
    console.log('Updated user:', updatedUser);
    
    // EXISTS check
    console.log('\n4. EXISTS Check:');
    const userExists = await crudManager.exists('user:1001');
    const missingExists = await crudManager.exists('missing:key');
    console.log('User exists:', userExists); // true
    console.log('Missing key exists:', missingExists); // false
    
    // DELETE examples
    console.log('\n5. DELETE Operations:');
    await crudManager.delete('simple:string');
    const afterDelete = await crudManager.exists('simple:string');
    console.log('Key exists after delete:', afterDelete); // false
    
    // BULK Operations
    console.log('\n6. BULK Operations:');
    const bulkResults = await crudManager.bulkOperations([
        { type: 'CREATE', key: 'bulk:1', value: 'Bulk value 1' },
        { type: 'CREATE', key: 'bulk:2', value: { data: 'Bulk object' } },
        { type: 'READ', key: 'bulk:1' },
        { type: 'UPDATE', key: 'bulk:2', value: { data: 'Updated bulk object' } },
        { type: 'DELETE', key: 'bulk:1' }
    ]);
    
    console.log('Bulk operations results:');
    bulkResults.forEach(result => {
        console.log(`  ${result.operation} ${result.key}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    });
}
```

## 4. TTL (Time To Live) - Complete Implementation

### TTL Management System
```javascript
/**
 * TTL (Time To Live) Management System
 * 
 * What it is: Automatic expiration of keys after specified time
 * When to use: Session management, temporary data, cache invalidation
 */
class TTLManager {
    constructor(redisClient) {
        this.redis = redisClient;
    }
    
    /**
     * SETEX - Set key with expiration in seconds
     * @param {string} key - Key to set
     * @param {number} seconds - Time to live in seconds
     * @param {string} value - Value to store
     * @returns {Promise<string>} - "OK" if successful
     */
    async setWithExpiration(key, seconds, value) {
        try {
            const result = await this.redis.setex(key, seconds, value);
            console.log(`SETEX: Key "${key}" set to expire in ${seconds} seconds`);
            return result;
        } catch (error) {
            console.error(`SETEX: Failed to set key "${key}":`, error);
            throw error;
        }
    }
    
    /**
     * EXPIRE - Set expiration on existing key
     * @param {string} key - Key to set expiration for
     * @param {number} seconds - Time to live in seconds
     * @returns {Promise<boolean>} - true if timeout was set, false if key doesn't exist
     */
    async setExpiration(key, seconds) {
        try {
            const result = await this.redis.expire(key, seconds);
            console.log(`EXPIRE: Key "${key}" expiration set to ${seconds} seconds: ${result ? 'SUCCESS' : 'KEY NOT FOUND'}`);
            return result === 1;
        } catch (error) {
            console.error(`EXPIRE: Failed to set expiration for key "${key}":`, error);
            throw error;
        }
    }
    
    /**
     * TTL - Get remaining time to live for a key
     * @param {string} key - Key to check
     * @returns {Promise<number>} - TTL in seconds, -2 if key doesn't exist, -1 if no expiration
     */
    async getTimeToLive(key) {
        try {
            const ttl = await this.redis.ttl(key);
            
            switch (ttl) {
                case -2:
                    console.log(`TTL: Key "${key}" does not exist`);
                    break;
                case -1:
                    console.log(`TTL: Key "${key}" exists but has no expiration`);
                    break;
                default:
                    console.log(`TTL: Key "${key}" has ${ttl} seconds remaining`);
            }
            
            return ttl;
        } catch (error) {
            console.error(`TTL: Failed to get TTL for key "${key}":`, error);
            throw error;
        }
    }
    
    /**
     * PERSIST - Remove expiration from a key
     * @param {string} key - Key to make persistent
     * @returns {Promise<boolean>} - true if timeout was removed, false if key doesn't exist or has no timeout
     */
    async removeExpiration(key) {
        try {
            const result = await this.redis.persist(key);
            console.log(`PERSIST: Key "${key}" expiration removed: ${result ? 'SUCCESS' : 'NO EXPIRATION OR KEY NOT FOUND'}`);
            return result === 1;
        } catch (error) {
            console.error(`PERSIST: Failed to remove expiration for key "${key}":`, error);
            throw error;
        }
    }
    
    /**
     * EXPIREAT - Set expiration using UNIX timestamp
     * @param {string} key - Key to set expiration for
     * @param {number} unixTimestamp - UNIX timestamp in seconds
     * @returns {Promise<boolean>} - true if timeout was set, false if key doesn't exist
     */
    async setExpirationAt(key, unixTimestamp) {
        try {
            const result = await this.redis.expireat(key, unixTimestamp);
            console.log(`EXPIREAT: Key "${key}" set to expire at UNIX timestamp ${unixTimestamp}: ${result ? 'SUCCESS' : 'KEY NOT FOUND'}`);
            return result === 1;
        } catch (error) {
            console.error(`EXPIREAT: Failed to set expiration for key "${key}":`, error);
            throw error;
        }
    }
    
    /**
     * Session Management with TTL
     * Demonstrates practical use of TTL for user sessions
     */
    async sessionManagementDemo() {
        console.log('\n=== SESSION MANAGEMENT WITH TTL ===');
        
        const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        const sessionData = {
            userId: 1001,
            username: 'alice_wonderland',
            loggedInAt: new Date().toISOString(),
            permissions: ['read', 'write', 'delete']
        };
        
        // Create session with 30 minute expiration
        await this.setWithExpiration(
            `user:session:${sessionId}`,
            1800, // 30 minutes in seconds
            JSON.stringify(sessionData)
        );
        
        // Check initial TTL
        const initialTTL = await this.getTimeToLive(`user:session:${sessionId}`);
        console.log(`Session "${sessionId}" created with TTL: ${initialTTL} seconds`);
        
        // Simulate extending session (like "remember me" functionality)
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        await this.setExpiration(`user:session:${sessionId}`, 3600); // Extend to 1 hour
        const extendedTTL = await this.getTimeToLive(`user:session:${sessionId}`);
        console.log(`Session extended, new TTL: ${extendedTTL} seconds`);
        
        // Demonstrate manual expiration
        await this.setExpiration(`user:session:${sessionId}`, 5); // Set to expire in 5 seconds
        console.log('Session set to expire in 5 seconds...');
        
        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        const finalTTL = await this.getTimeToLive(`user:session:${sessionId}`);
        console.log(`After 6 seconds, TTL: ${finalTTL}`); // Should be -2 (key doesn't exist)
    }
    
    /**
     * Cache Management with TTL
     * Demonstrates TTL for cache invalidation
     */
    async cacheManagementDemo() {
        console.log('\n=== CACHE MANAGEMENT WITH TTL ===');
        
        // Simulate API response caching
        const apiEndpoints = [
            '/api/users',
            '/api/products', 
            '/api/orders'
        ];
        
        for (const endpoint of apiEndpoints) {
            const cacheKey = `cache:${endpoint.replace(/\//g, ':')}`;
            const cacheData = {
                data: `Mock response for ${endpoint}`,
                cachedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            // Different TTL for different endpoints
            let ttl;
            if (endpoint.includes('users')) ttl = 300; // 5 minutes
            else if (endpoint.includes('products')) ttl = 900; // 15 minutes
            else ttl = 60; // 1 minute
            
            await this.setWithExpiration(cacheKey, ttl, JSON.stringify(cacheData));
            console.log(`Cached ${endpoint} with TTL: ${ttl} seconds`);
        }
        
        // Monitor cache expiration
        console.log('\nMonitoring cache TTLs:');
        for (const endpoint of apiEndpoints) {
            const cacheKey = `cache:${endpoint.replace(/\//g, ':')}`;
            const ttl = await this.getTimeToLive(cacheKey);
            console.log(`  ${endpoint}: ${ttl} seconds remaining`);
        }
    }
}

// TTL Demo Execution
async function ttlDemo() {
    const ttlManager = new TTLManager(redis);
    
    try {
        await ttlManager.sessionManagementDemo();
        await ttlManager.cacheManagementDemo();
    } catch (error) {
        console.error('TTL Demo failed:', error);
    }
}
```

## 5. Basic Configuration - Complete Setup

### Redis Client Configuration Manager
```javascript
/**
 * Redis Client Configuration Manager
 * 
 * Handles connection setup, configuration, and best practices
 * for production-ready Redis client configuration
 */
class RedisConfigManager {
    constructor() {
        this.defaultConfig = {
            // Connection settings
            socket: {
                host: '127.0.0.1',
                port: 6379,
                connectTimeout: 5000,
                lazyConnect: false,
            },
            
            // Authentication
            password: null,
            username: null,
            
            // Connection behavior
            retryStrategy: (times) => {
                // Exponential backoff with max delay of 3 seconds
                const delay = Math.min(times * 50, 3000);
                console.log(`Redis connection attempt ${times}, retrying in ${delay}ms`);
                return delay;
            },
            
            // Maximum connection attempts
            maxRetriesPerRequest: 3,
            
            // Command timeout
            commandTimeout: 5000,
            
            // Keep alive
            keepAlive: 30000,
            
            // Connection pool
            poolSize: 10,
        };
    }
    
    /**
     * Create Redis client with development configuration
     * @returns {Redis} Configured Redis client
     */
    createDevelopmentClient() {
        const { createClient } = require('redis');
        
        const devConfig = {
            ...this.defaultConfig,
            socket: {
                ...this.defaultConfig.socket,
                host: process.env.REDIS_HOST || '127.0.0.1',
                port: process.env.REDIS_PORT || 6379,
            },
            password: process.env.REDIS_PASSWORD || null,
        };
        
        const client = createClient(devConfig);
        this.setupEventHandlers(client, 'Development');
        
        return client;
    }
    
    /**
     * Create Redis client with production configuration
     * @returns {Redis} Configured Redis client
     */
    createProductionClient() {
        const { createClient } = require('redis');
        
        const prodConfig = {
            ...this.defaultConfig,
            socket: {
                ...this.defaultConfig.socket,
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT) || 6379,
                tls: process.env.REDIS_TLS === 'true',
                connectTimeout: 10000,
            },
            password: process.env.REDIS_PASSWORD,
            username: process.env.REDIS_USERNAME,
            retryStrategy: (times) => {
                const delay = Math.min(times * 100, 5000);
                console.log(`Production Redis connection attempt ${times}, retrying in ${delay}ms`);
                return delay;
            },
            maxRetriesPerRequest: 5,
            commandTimeout: 10000,
        };
        
        const client = createClient(prodConfig);
        this.setupEventHandlers(client, 'Production');
        
        return client;
    }
    
    /**
     * Setup event handlers for Redis client
     * @param {Redis} client - Redis client instance
     * @param {string} environment - Environment name for logging
     */
    setupEventHandlers(client, environment) {
        // Connection events
        client.on('connect', () => {
            console.log(`[${environment}] Redis: Connecting to server...`);
        });
        
        client.on('ready', () => {
            console.log(`[${environment}] Redis: Client connected and ready`);
        });
        
        client.on('end', () => {
            console.log(`[${environment}] Redis: Connection closed`);
        });
        
        client.on('error', (err) => {
            console.error(`[${environment}] Redis Error:`, err);
        });
        
        client.on('reconnecting', () => {
            console.log(`[${environment}] Redis: Attempting to reconnect...`);
        });
        
        // Command monitoring (development only)
        if (environment === 'Development') {
            client.monitor((err, monitor) => {
                if (!err) {
                    monitor.on('monitor', (time, args, source, database) => {
                        console.log(`[${environment}] Redis Command:`, args);
                    });
                }
            });
        }
    }
    
    /**
     * Test Redis connection and basic functionality
     * @param {Redis} client - Redis client to test
     * @returns {Promise<Object>} Test results
     */
    async testConnection(client) {
        const results = {
            connected: false,
            ping: false,
            readWrite: false,
            memory: null,
            info: null
        };
        
        try {
            // Test basic connection
            await client.connect();
            results.connected = true;
            
            // Test PING
            const pingResult = await client.ping();
            results.ping = pingResult === 'PONG';
            
            // Test read/write operations
            const testKey = 'connection_test_' + Date.now();
            await client.set(testKey, 'test_value');
            const readValue = await client.get(testKey);
            await client.del(testKey);
            results.readWrite = readValue === 'test_value';
            
            // Get memory info
            results.memory = await client.info('memory');
            
            // Get server info
            results.info = await client.info('server');
            
            console.log('Redis Connection Test Results:');
            console.log('- Connected:', results.connected);
            console.log('- Ping:', results.ping);
            console.log('- Read/Write:', results.readWrite);
            
        } catch (error) {
            console.error('Redis Connection Test Failed:', error);
        } finally {
            await client.disconnect();
        }
        
        return results;
    }
    
    /**
     * Health check for Redis connection
     * @param {Redis} client - Redis client to check
     * @returns {Promise<Object>} Health status
     */
    async healthCheck(client) {
        const health = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            responseTime: null,
            memoryUsage: null,
            connectedClients: null,
            operationsPerSecond: null
        };
        
        try {
            const startTime = Date.now();
            
            // Test basic operation
            await client.ping();
            
            health.responseTime = Date.now() - startTime;
            health.status = 'healthy';
            
            // Get detailed info if healthy
            if (health.status === 'healthy') {
                const info = await client.info();
                const lines = info.split('\r\n');
                
                for (const line of lines) {
                    if (line.startsWith('used_memory_human:')) {
                        health.memoryUsage = line.split(':')[1];
                    } else if (line.startsWith('connected_clients:')) {
                        health.connectedClients = parseInt(line.split(':')[1]);
                    } else if (line.startsWith('instantaneous_ops_per_sec:')) {
                        health.operationsPerSecond = parseInt(line.split(':')[1]);
                    }
                }
            }
            
        } catch (error) {
            health.status = 'unhealthy';
            health.error = error.message;
        }
        
        return health;
    }
}

// Complete Setup and Demo
async function redisCompleteSetupDemo() {
    console.log('=== REDIS COMPLETE SETUP AND CONFIGURATION DEMO ===\n');
    
    const configManager = new RedisConfigManager();
    
    // 1. Create development client
    console.log('1. Creating Development Redis Client...');
    const devClient = configManager.createDevelopmentClient();
    
    // 2. Test connection
    console.log('\n2. Testing Development Connection...');
    const testResults = await configManager.testConnection(devClient);
    
    // 3. Create production client (configuration only)
    console.log('\n3. Creating Production Configuration...');
    const prodClient = configManager.createProductionClient();
    
    // 4. Demonstrate configuration differences
    console.log('\n4. Configuration Comparison:');
    console.log('Development:');
    console.log('- Host: 127.0.0.1:6379');
    console.log('- Timeout: 5 seconds');
    console.log('- Command Monitoring: Enabled');
    
    console.log('\nProduction:');
    console.log('- Host: Environment variables');
    console.log('- Timeout: 10 seconds'); 
    console.log('- TLS: Configurable');
    console.log('- Retry Strategy: More aggressive');
    
    // 5. Health check demonstration
    console.log('\n5. Health Check Demonstration...');
    await devClient.connect();
    const health = await configManager.healthCheck(devClient);
    console.log('Health Status:', health);
    
    await devClient.disconnect();
    
    console.log('\n=== SETUP COMPLETE ===');
}

// Export all classes and functions for use in other modules
module.exports = {
    RedisCRUDManager,
    TTLManager,
    RedisConfigManager,
    MessageQueue,
    comprehensiveCRUDDemo,
    ttlDemo,
    redisCompleteSetupDemo
};
```

This comprehensive implementation provides:

1. **Detailed explanations** of each method, function, and property
2. **Complete parameter descriptions** with types and purposes
3. **Return value explanations** with examples
4. **Practical use cases** for when to use each feature
5. **Error handling** and best practices
6. **Real-world examples** like session management, caching, and message queues
7. **Configuration management** for different environments

Each section builds upon the previous one, creating a solid foundation for understanding and using Redis effectively in JavaScript applications.