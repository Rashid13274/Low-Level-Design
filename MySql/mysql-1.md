## Redis Cache Manager with Express.js

Redis cache manager is an in-memory data store that significantly improves application performance by storing frequently accessed data in a temporary location, reducing database queries and API calls. When integrated with Express.js, Redis acts as a high-performance caching layer that reduces response latency and optimizes resource usage.[1][2]

### Core Implementation in TypeScript

Here's a practical Redis caching setup with Express.js using TypeScript:[1]

```typescript
import express from 'express';
import Redis from 'ioredis';

const app = express();
const redis = new Redis();

// Cache-aside pattern implementation
app.get('/api/data/:id', async (req, res) => {
  const cacheKey = `data:${req.params.id}`;
  
  try {
    // Check cache first
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      console.log('Cache hit');
      return res.json({ source: 'cache', data: JSON.parse(cachedData) });
    }
    
    // Cache miss - fetch from database
    console.log('Cache miss');
    const data = await fetchFromDatabase(req.params.id);
    
    // Store in cache with expiration (3600 seconds)
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
    
    res.json({ source: 'database', data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Reusable Caching Middleware

A more elegant approach uses middleware to handle caching automatically:[2]

```typescript
function redisCachingMiddleware(options = { EX: 300 }) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const cacheKey = `cache:${req.originalUrl}`;
    
    try {
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        console.log(`Cache hit for ${req.originalUrl}`);
        return res.json(JSON.parse(cachedData));
      }
      
      console.log(`Cache miss for ${req.originalUrl}`);
      
      // Override res.send to cache response
      const originalSend = res.send;
      res.send = function(body: any) {
        if (res.statusCode.toString().startsWith('2')) {
          redis.set(cacheKey, body, 'EX', options.EX);
        }
        return originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Usage
app.get('/btc-rate', redisCachingMiddleware({ EX: 300 }), async (req, res) => {
  const data = await fetchExchangeRate();
  res.json(data);
});
```

### Use Cases with Express.js

**API Response Caching**: When fetching exchange rates from external APIs that update every 5 minutes, cache the response to avoid redundant API calls and potential rate-limiting. This pattern reduced response times by **175x** in testing scenarios.[2]

**Database Query Caching**: Store results of expensive database queries in Redis to serve subsequent identical requests from cache, minimizing database load.[3][2]

**Session Management**: Use Redis to store user session data across multiple server instances, enabling horizontal scaling while maintaining consistent authentication states.[1]

**Write-Through Caching**: Combine cache-aside with write-through patterns to keep cache synchronized with database updates. When updating user profiles, write to both database and cache simultaneously to prevent serving stale data.[2]

**Rate Limiting**: Implement request throttling by tracking request counts and timestamps in Redis, preventing API abuse.[1]

**Real-time Features**: Leverage Redis pub/sub capabilities for live chat, notifications, and real-time updates in Express applications.[1]

---

## MySQL Interview Questions: Scenario-Based MCQs with Explanations

### Indexing & Performance

**Question 1**: You have a table `orders` with 10 million rows. Users frequently search by `customer_id` and `order_date` together. Which index strategy provides optimal performance?

A) Single index on `customer_id`  
B) Separate indexes on `customer_id` and `order_date`  
C) Composite index on `(customer_id, order_date)`  
D) Full-text index on both columns

**Answer: C**[4][5]

**Explanation**: A composite index on `(customer_id, order_date)` is optimal because MySQL can use both columns efficiently in a single index lookup. With separate indexes, MySQL would use only one index (usually the more selective one) or perform an index merge, which is slower. The order matters: placing `customer_id` first allows range queries on `order_date` within each customer.[4]

***

**Question 2**: Your query `SELECT * FROM products WHERE price > 100` is running slowly despite having an index on `price`. What's the most likely issue?

A) The index is corrupted  
B) MySQL optimizer chose a full table scan due to low selectivity  
C) The table needs partitioning  
D) The index type is incorrect

**Answer: B**[5][4]

**Explanation**: If the majority of rows have `price > 100`, the query has **low selectivity**. MySQL's optimizer may decide a full table scan is more efficient than using the index because it would need to perform random I/O for most rows anyway. This is a classic case where an index exists but isn't used due to poor cardinality.[5][4]

***

### Query Optimization

**Question 3**: Examine this query:
```sql
SELECT p.product_name, s.sales_amount 
FROM products p 
JOIN sales s ON p.product_id = s.product_id 
WHERE s.sales_amount > (SELECT AVG(sales_amount) FROM sales)
ORDER BY s.sales_amount DESC;
```

What optimization technique would improve performance?

A) Replace subquery with a JOIN  
B) Cache the subquery result in a variable  
C) Add LIMIT clause  
D) Use UNION instead of JOIN

**Answer: B**[6]

**Explanation**: The subquery `(SELECT AVG(sales_amount) FROM sales)` is **correlated** and executes for every row in the outer query. Calculating it once and storing in a variable prevents redundant calculations. In MySQL 8.0+, you can use WITH (CTE) or user-defined variables to compute the average once.[7][6]

***

**Question 4**: Your application executes `SELECT COUNT(*) FROM large_table` frequently. The table has 50 million rows and the query takes 15 seconds. What's the best solution?

A) Add an index on the primary key  
B) Use `SELECT COUNT(id)` instead  
C) Implement application-level caching or use approximate counts  
D) Switch to MyISAM engine

**Answer: C**[4][5]

**Explanation**: In InnoDB, `COUNT(*)` requires a full table scan because MVCC means the row count varies per transaction. The best approach is **caching the count** at the application level (like Redis) or using approximate values from `INFORMATION_SCHEMA.TABLES`. Adding indexes won't help as COUNT(*) must scan all rows. MyISAM stores exact counts but lacks transaction support.[5][4]

***

### Transaction & Locking

**Question 5**: Two transactions are running concurrently:

**Transaction A**:
```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- (waiting for user confirmation)
```

**Transaction B**:
```sql
BEGIN;
UPDATE accounts SET balance = balance + 50 WHERE id = 1;
-- (hangs indefinitely)
```

What's happening?

A) Deadlock detected  
B) Transaction B is waiting for Transaction A's lock  
C) Both transactions are blocked  
D) Race condition occurred

**Answer: B**[4]

**Explanation**: Transaction A holds a **row-level lock** on `id = 1` after the UPDATE. Transaction B tries to acquire the same lock but must wait until A commits or rolls back. This is **lock contention**, not a deadlock (which requires circular waiting). The issue is that Transaction A is holding the lock too long due to waiting for user input.[4]

---

**Question 6**: You're experiencing frequent deadlocks. Which strategy is LEAST effective?

A) Keep transactions short  
B) Access tables in consistent order  
C) Increase `innodb_lock_wait_timeout`  
D) Use lower isolation levels when appropriate

**Answer: C**[5][4]

**Explanation**: Increasing `innodb_lock_wait_timeout` only makes transactions wait **longer** before timing out; it doesn't prevent deadlocks. Effective strategies include: keeping transactions short (reducing lock hold time), accessing tables in the same order across transactions (preventing circular waits), and using READ COMMITTED instead of REPEATABLE READ when appropriate.[4]

***

### Schema Design

**Question 7**: You need to store user preferences as key-value pairs. Each user has 5-50 preferences. What's the most normalized approach?

A) Store as JSON in a TEXT column in the `users` table  
B) Create a `user_preferences` table with `(user_id, preference_key, preference_value)`  
C) Add 50 columns to the `users` table  
D) Use a VARCHAR column with serialized data

**Answer: B**[6][4]

**Explanation**: Option B follows **normalization principles** by separating repeating data into a separate table. This provides flexibility (variable number of preferences), efficient querying of specific preferences, and avoids sparse tables. JSON (Option A) is acceptable in MySQL 8.0+ for flexible schemas but makes querying specific keys harder. Option C violates normalization and creates a sparse table.[6]

***

**Question 8**: You have a `logs` table growing by 1 million rows daily. Queries always filter by `created_date`. The table is becoming too large. What partitioning strategy is best?

A) HASH partitioning on `log_id`  
B) RANGE partitioning on `created_date`  
C) LIST partitioning on `log_level`  
D) No partitioning, just add indexes

**Answer: B**[5][4]

**Explanation**: **RANGE partitioning by date** is ideal for time-series data because queries filtering by date can **prune partitions**, scanning only relevant partitions. This dramatically improves query performance and makes data archiving easier (drop old partitions instead of DELETE operations). HASH partitioning distributes data evenly but doesn't provide partition pruning benefits for date-based queries.[5][4]

***

### Advanced Performance

**Question 9**: You notice this query is slow:
```sql
SELECT * FROM orders WHERE YEAR(order_date) = 2024;
```
Despite having an index on `order_date`. Why?

A) Index needs rebuilding  
B) Function on indexed column prevents index usage  
C) Wrong index type  
D) Too many rows returned

**Answer: B**[4][5]

**Explanation**: Using `YEAR(order_date)` applies a **function to the indexed column**, preventing MySQL from using the index. The solution is to rewrite as: `WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01'`. This allows MySQL to use the index for range scans. This is a classic performance anti-pattern.[5][4]

***

**Question 10**: Your `SELECT` queries are fast, but `UPDATE` statements on a heavily indexed table are very slow. What's the most likely cause?

A) Indexes are missing  
B) Too many indexes increase write overhead  
C) Table needs vacuuming  
D) Query cache is disabled

**Answer: B**[4][5]

**Explanation**: Every index must be **updated during write operations** (INSERT, UPDATE, DELETE). Having too many indexes, especially on frequently updated columns, creates significant overhead. Each UPDATE requires modifying all affected indexes, not just the table data. The solution is to audit indexes and remove unused ones using queries on `INFORMATION_SCHEMA.STATISTICS` and the Performance Schema.[5][4]

***

### Subqueries & Joins

**Question 11**: Which query performs better for finding customers who made purchases in 2024?

**Query A**:
```sql
SELECT * FROM customers WHERE customer_id IN 
(SELECT customer_id FROM orders WHERE YEAR(order_date) = 2024);
```

**Query B**:
```sql
SELECT DISTINCT c.* FROM customers c 
JOIN orders o ON c.customer_id = o.customer_id 
WHERE o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01';
```

A) Query A is always faster  
B) Query B is faster  
C) Performance is identical  
D) Depends on dataset size

**Answer: B**[6][4]

**Explanation**: Query B is faster for multiple reasons: (1) It avoids the `YEAR()` function allowing index usage, (2) Modern MySQL optimizes JOINs better than subqueries, (3) The `IN` subquery may not be optimized as efficiently as a JOIN. Query A's function usage prevents index scanning on `order_date`. In MySQL 8.0+, subqueries are better optimized but Query B's approach is still superior.[6][4]

***

### Tricky Performance MCQs

**Question 12**: What's the impact of `SELECT *` on query performance in a table with 50 columns when you only need 3?

A) No impact if indexes exist  
B) Increases I/O, memory usage, and network transfer  
C) Only affects network transfer  
D) MySQL optimizer automatically fetches only needed columns

**Answer: B**[4][5]

**Explanation**: `SELECT *` fetches **all columns**, increasing: (1) **Disk I/O** - reading unnecessary data from storage, (2) **Memory usage** - larger result sets in buffer pool, (3) **Network transfer** - sending unused data to the application, (4) **Query cache efficiency** - larger cache entries. Even with covering indexes, selecting all columns prevents index-only scans. Always select only required columns in production queries.[4]

***

**Question 13**: You have a query joining 5 tables with WHERE conditions on each. MySQL chooses a suboptimal join order. What can force a specific order?

A) Add hints like `STRAIGHT_JOIN`  
B) Rewrite with subqueries  
C) Add more indexes  
D) Cannot be controlled

**Answer: A**[5][4]

**Explanation**: `STRAIGHT_JOIN` forces MySQL to join tables in the **exact order specified** in the query, bypassing the optimizer's join order selection. While MySQL's optimizer is usually correct, complex multi-table joins may benefit from manual ordering. Alternative: Use `EXPLAIN` to understand the execution plan and restructure the query. However, forcing join order should be a last resort after proper indexing.[5][4]

***

**Question 14**: In a heavily write-intensive application with concurrent updates, which isolation level provides best performance while preventing dirty reads?

A) SERIALIZABLE  
B) REPEATABLE READ  
C) READ COMMITTED  
D) READ UNCOMMITTED

**Answer: C**[4][5]

**Explanation**: **READ COMMITTED** prevents dirty reads while minimizing lock contention and reducing gap locks compared to REPEATABLE READ (MySQL's default). It's optimal for write-heavy workloads because: (1) Shorter lock durations, (2) Fewer gap locks reducing deadlock probability, (3) Better concurrency. SERIALIZABLE has the worst performance due to extensive locking. READ UNCOMMITTED allows dirty reads (unacceptable for most applications).[5][4]

***

**Question 15**: Your `innodb_buffer_pool_size` is set to 8GB on a server with 16GB RAM. The application uses 4GB. What's the optimal configuration?

A) Keep at 8GB  
B) Increase to 12GB  
C) Increase to 10-11GB  
D) Decrease to 6GB

**Answer: C**[5]

**Explanation**: The buffer pool should be **70-80% of total RAM** on a dedicated database server. With 16GB total and 4GB for applications/OS, you have ~12GB available. Setting it to 10-11GB (instead of 12GB) leaves headroom for: (1) OS operations, (2) MySQL's per-connection buffers, (3) Temporary tables, (4) Other MySQL structures. Setting it too high risks OOM kills. This is the most important performance parameter in InnoDB.[5]

