## 1. What is Redis? 🎯

**Redis (Remote Dictionary Server)** is an open-source, in-memory data structure store used as:

* Database
* Cache
* Message broker
* Streaming engine

### Key Characteristics:

* **In-Memory:** Primary data storage in RAM
* **Data Structures:** Rich set of data types
* **Persistence:** Optional disk persistence
* **Atomic Operations:** Single-threaded, atomic commands
* **High Performance:** Sub-millisecond response times

---

## 2. Why Use Redis? 💡

### Primary Reasons:

* **Performance:** 100x faster than disk-based databases
* **Low Latency:** Sub-millisecond response times
* **High Throughput:** Can handle millions of operations/sec
* **Flexibility:** Multiple data structures for different use cases
* **Simplicity:** Simple API and easy to deploy

---

## 📘 Beginner Level (Weeks 1–2)

### Core Concepts:

* Key-Value Store Fundamentals
* Basic Data Types: Strings, Lists, Sets
* CRUD Operations
* TTL (Time To Live)
* Basic Configuration

### Commands:-
#### 🧩 Strings
```
SET, GET, DEL, EXISTS, EXPIRE, TTL
```
#### 🧱 Lists
```
LPUSH, RPUSH, LPOP, RPOP, LRANGE
```
#### 🔹 Sets
```
SADD, SMEMBERS, SISMEMBER, SREM
```
#### ⚙️ General
```
KEYS, FLUSHDB, PING, INFO
```

### Practice Projects:

* Simple caching system
* Session storage
* Basic leaderboard

---

## ⚙️ Intermediate Level (Weeks 3–6)

### Advanced Data Structures:

* **Hashes:** For object storage
* **Sorted Sets:** For rankings and leaderboards
* **Bitmaps:** For analytics
* **HyperLogLog:** For cardinality estimation

### Key Features:

* **Persistence:** RDB vs AOF
* **Pub/Sub Messaging**
* **Transactions:** MULTI/EXEC
* **Lua Scripting**
* **Connection Pooling**

### Commands

#### 🧾 Hashes

```
HSET, HGET, HGETALL, HINCRBY
```

#### 🧮 Sorted Sets

```
ZADD, ZRANGE, ZREVRANGE, ZSCORE
```

#### 📢 Pub/Sub

```
PUBLISH, SUBSCRIBE, UNSUBSCRIBE
```

#### 🔒 Transactions

```
MULTI, EXEC, DISCARD, WATCH
```

### Practice Projects:

* Real-time analytics dashboard
* Message queue system
* Advanced caching with invalidation strategies
* Rate limiting system

---

## 📊 Redis Data Structures Cheat Sheet

| Data Type       | Use Case               | Key Commands                   | Complexity         |
| --------------- | ---------------------- | ------------------------------ | ------------------ |
| **String**      | Caching, counters      | `SET`, `GET`, `INCR`           | O(1)               |
| **List**        | Queues, timelines      | `LPUSH`, `RPOP`, `LRANGE`      | O(1) for head/tail |
| **Hash**        | Objects, properties    | `HSET`, `HGET`, `HGETALL`      | O(1)               |
| **Set**         | Unique items, tags     | `SADD`, `SINTER`, `SMEMBERS`   | O(1) add/remove    |
| **Sorted Set**  | Rankings, leaderboards | `ZADD`, `ZRANGE`, `ZRANK`      | O(log N)           |
| **Bitmaps**     | Analytics, flags       | `SETBIT`, `GETBIT`, `BITCOUNT` | O(1)               |
| **HyperLogLog** | Cardinality estimation | `PFADD`, `PFCOUNT`             | O(1)               |

---

## ⏳ What is TTL and How Do You Implement It?

```bash
SET key value EX 3600  # Expire in 1 hour
EXPIRE key 3600        # Set expiration
TTL key                # Check remaining time
```

---

## 💾 Persistence Options

**Problem:**
If Redis only uses RAM, what happens when the server restarts?
👉 Data would disappear!

**Solution:**
Redis offers two ways to save data to disk:

### 1. RDB (Redis Database Backup)

* Takes a snapshot of your data at specific intervals
* Like taking a photo of your sticky notes every hour
* Fast recovery, but you might lose recent changes

### 2. AOF (Append Only File)

* Records every write operation in a log file
* Like writing down every change you make to your notes
* More durable, but larger file size

---

## ⚛️ Atomic Operations

**Definition:**
Operations that either complete fully or don’t happen at all — no partial updates that could corrupt data.

### Example Without Atomicity:

```python
# Problem: Two users might read and update at the same time
balance = redis.get('user_balance')  # Reads 100
balance = balance + 50               # Two users do this simultaneously
redis.set('user_balance', balance)   # Might set 150 instead of 200
```

### Example With Redis Atomic Operation:

```python
# Solution: Redis handles this atomically
redis.incrby('user_balance', 50)  # Always correct, no race conditions
```

---

## 🧠 Single-Threaded Architecture

### How It Works:

* Redis processes one command at a time
* No complex locking mechanisms needed
* Simple and predictable performance

### Advantages:

* No CPU bottlenecks
* Consistent performance
* Simplified code

---

## ⚡ Low Latency — Sub-Millisecond Response Times

**What is latency?**
Time between sending a request and receiving a response.
Critical for **real-time applications**.

### Examples Where Low Latency Matters:

* 🎮 Gaming: Instant leaderboard updates
* 💹 Trading: Real-time stock price updates
* 🛒 E-commerce: Instant shopping cart updates

### Throughput vs Latency:

* **Latency:** How fast one operation completes
* **Throughput:** How many operations can be handled simultaneously

Redis can handle **1,000,000+ operations per second** on a single server —
perfect for **high-traffic websites and applications**.
