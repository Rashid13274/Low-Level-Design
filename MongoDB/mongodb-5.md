Based on your covered topics, I'll create questions for the remaining concepts: **Replication, Sharding, Transactions, Security, and additional Performance Tuning**. Here are the remaining questions:

***

### Q17: Write Concern and Durability

```javascript
const OrderSchema = new mongoose.Schema({
  orderId: String,
  customerId: String,
  amount: Number,
  status: String
});

// Replica set: 1 Primary + 2 Secondaries

// Option A
await Order.create(
  { orderId: '123', amount: 1000 },
  { writeConcern: { w: 1, j: false } }
);

// Option B
await Order.create(
  { orderId: '124', amount: 1000 },
  { writeConcern: { w: 'majority', j: true } }
);

// Option C
await Order.create(
  { orderId: '125', amount: 1000 },
  { writeConcern: { w: 3, j: true, wtimeout: 5000 } }
);
```

**Question:** Primary node crashes 1 second after each write. Which write(s) are guaranteed to be durable?

A) Only Option C  
B) Options B and C  
C) Only Option B  
D) None are guaranteed

**Answer: B) Options B and C**

**Explanation:**
**Write concern** controls acknowledgment and durability guarantees. Option A (`w: 1, j: false`) only waits for primary acknowledgment without journal flush, risking data loss on crash. Options B and C use `j: true` (journal) and replicate to multiple nodes (`majority` or explicit count), ensuring durability.[1][2][3][4][5]

**Write Concern Deep Dive:**

```javascript
// === WRITE CONCERN COMPONENTS ===
// w: write acknowledgment level
// j: journal (durability)
// wtimeout: time limit for write concern

const mongoose = require('mongoose');

// === UNDERSTANDING 'w' (Write Acknowledgment) ===
// w: 0 - No acknowledgment (fire and forget)
await Order.create(
  { orderId: '100', amount: 500 },
  { writeConcern: { w: 0 } }
);
// Behavior:
// - Returns immediately (< 1ms)
// - No confirmation write succeeded
// - Risk: Data might not be written if primary crashes
// Use case: Non-critical logs, metrics


// w: 1 - Primary acknowledgment (default)
await Order.create(
  { orderId: '101', amount: 500 },
  { writeConcern: { w: 1 } }
);
// Behavior:
// - Waits for primary to acknowledge (~2ms)
// - Data written to primary's memory
// - Risk: Data lost if primary crashes before replication
// Use case: General application writes


// w: 2 - Primary + 1 secondary
await Order.create(
  { orderId: '102', amount: 500 },
  { writeConcern: { w: 2 } }
);
// Behavior:
// - Waits for primary + 1 secondary (~10-50ms depending on network)
// - Data replicated to 2 nodes
// - Safer: Survives single node failure
// Use case: Important transactional data


// w: 'majority' - Majority of replica set
// Replica set: 3 nodes (1 primary + 2 secondaries)
await Order.create(
  { orderId: '103', amount: 500 },
  { writeConcern: { w: 'majority' } }
);
// Behavior:
// - Waits for majority (2 out of 3 nodes) (~20-100ms)
// - Ensures data survives replica set election
// - Recommended: Best balance of safety and performance
// Use case: Financial transactions, critical data


// w: 3 - All replica set members (3 nodes)
await Order.create(
  { orderId: '104', amount: 500 },
  { writeConcern: { w: 3 } }
);
// Behavior:
// - Waits for ALL nodes (~50-200ms)
// - Maximum safety: Data on all nodes
// - Risk: Single slow/down node blocks ALL writes
// Use case: Critical data where absolute certainty needed


// === UNDERSTANDING 'j' (Journal) ===
// j: false - In-memory only (default for w: 1)
await Order.create(
  { orderId: '105', amount: 500 },
  { writeConcern: { w: 1, j: false } }
);
// Behavior:
// - Data written to memory
// - Not yet on disk
// - Risk: Power failure = data loss (before sync to disk)
// MongoDB syncs to disk every 50-100ms by default


// j: true - Journaled (written to disk log)
await Order.create(
  { orderId: '106', amount: 500 },
  { writeConcern: { w: 1, j: true } }
);
// Behavior:
// - Data written to journal on disk (~5-10ms)
// - Survives crashes and power failures
// - Safer but slower
// Use case: Financial data, critical operations


// === UNDERSTANDING 'wtimeout' ===
// wtimeout: Maximum time to wait for write concern

try {
  await Order.create(
    { orderId: '107', amount: 500 },
    { writeConcern: { w: 'majority', j: true, wtimeout: 1000 } }
  );
} catch (error) {
  if (error.code === 50) {
    console.log('Write concern timeout! Write may still succeed.');
    // Write continues in background even after timeout
  }
}
// Without wtimeout: Waits indefinitely (blocks application)
// With wtimeout: Throws error after timeout, but write continues


// === WRITE CONCERN SCENARIOS ===
// Scenario 1: E-commerce checkout (critical)
const OrderSchema = new mongoose.Schema({
  orderId: String,
  customerId: String,
  items: Array,
  totalAmount: Number,
  paymentStatus: String
});

async function createOrder(orderData) {
  try {
    const order = await Order.create(orderData, {
      writeConcern: { 
        w: 'majority',  // Replicate to majority
        j: true,        // Journal to disk
        wtimeout: 5000  // 5 second timeout
      }
    });
    return { success: true, order };
  } catch (error) {
    if (error.code === 50) {
      // Write concern timeout - write may still succeed
      // Log for manual verification
      console.error('Order write concern timeout:', orderData.orderId);
      return { success: false, error: 'timeout', orderId: orderData.orderId };
    }
    throw error;
  }
}


// Scenario 2: Analytics event logging (non-critical)
const EventSchema = new mongoose.Schema({
  eventType: String,
  userId: String,
  metadata: Object,
  timestamp: Date
});

async function logEvent(eventData) {
  // Fast writes, data loss acceptable
  await Event.create(eventData, {
    writeConcern: { w: 1, j: false }
  });
  // Could even use w: 0 for highest throughput
}


// Scenario 3: User profile update (important but not critical)
const UserSchema = new mongoose.Schema({
  email: String,
  profile: Object,
  preferences: Object
});

async function updateUserProfile(userId, profileData) {
  await User.updateOne(
    { _id: userId },
    { $set: { profile: profileData } },
    { writeConcern: { w: 1, j: true } }
    // Journal for durability, but w:1 for speed
  );
}


// === PERFORMANCE VS DURABILITY TRADE-OFFS ===
console.log('Write Concern Performance Comparison:');
console.log('w: 0, j: false          - ~0.5ms   (No guarantees)');
console.log('w: 1, j: false (default)- ~2ms     (Memory only)');
console.log('w: 1, j: true           - ~5ms     (Disk journal)');
console.log('w: majority, j: false   - ~20ms    (Replicated, memory)');
console.log('w: majority, j: true    - ~25ms    (Replicated, journaled) ✅ Recommended');
console.log('w: 3, j: true           - ~50ms    (All nodes, journaled)');


// === DEFAULT WRITE CONCERNS ===
// Set default write concern at connection level
mongoose.connect('mongodb://localhost:27017/mydb', {
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 5000
  }
});

// Set default at schema level
OrderSchema.set('writeConcern', {
  w: 'majority',
  j: true,
  wtimeout: 5000
});


// === WRITE CONCERN WITH TRANSACTIONS ===
const session = await mongoose.startSession();
session.startTransaction({
  readConcern: { level: 'snapshot' },
  writeConcern: { w: 'majority', j: true }
});

try {
  // All operations inherit transaction's write concern
  await Order.create([{ orderId: '200', amount: 1000 }], { session });
  await Inventory.updateOne(
    { productId: 'P1' },
    { $inc: { stock: -1 } },
    { session }
  );
  
  await session.commitTransaction();
  // Commit uses write concern: { w: 'majority', j: true }
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}


// === REPLICA SET CONFIGURATION IMPACT ===
// Replica Set: 5 nodes (1 Primary + 4 Secondaries)

// w: 'majority' = 3 nodes (ceil(5/2) = 3)
await Order.create(
  { orderId: '300' },
  { writeConcern: { w: 'majority' } }
);
// Must replicate to 3 nodes


// === CHECKING WRITE CONCERN ERRORS ===
async function safeWrite(data) {
  try {
    const result = await Order.create(data, {
      writeConcern: { w: 'majority', j: true, wtimeout: 5000 }
    });
    return result;
  } catch (error) {
    // Write concern timeout
    if (error.code === 50) {
      console.error('Write concern timeout');
      console.error('Write may still succeed in background');
      // Implement retry logic or manual verification
      return null;
    }
    
    // Write concern error
    if (error.name === 'WriteConcernError') {
      console.error('Write concern failed:', error.message);
      // e.g., Not enough data-bearing nodes
      return null;
    }
    
    // Other errors (duplicate key, validation, etc.)
    throw error;
  }
}


// === MONITORING WRITE CONCERNS ===
// Check replica set status
const status = await db.adminCommand({ replSetGetStatus: 1 });

console.log('Replica Set Members:');
status.members.forEach(member => {
  console.log(`${member.name}: ${member.stateStr}`);
  console.log(`  Replication lag: ${member.optime.ts.getTime() - status.optimes.lastCommittedOpTime.ts.getTime()}ms`);
});

// High replication lag = write concern may timeout


// === WRITE CONCERN BEST PRACTICES ===
/*
1. Use w: 'majority', j: true for critical data
   - Financial transactions
   - User authentication data
   - Order confirmations

2. Use w: 1, j: true for important data
   - User profile updates
   - Application settings
   - Content updates

3. Use w: 1, j: false for less critical data
   - View counts
   - Cache updates
   - Temporary data

4. Use w: 0 only for non-essential data
   - Debug logs
   - Analytics (with sampling)
   - Metrics

5. Always set wtimeout to prevent indefinite blocking
   - Recommended: 5000ms (5 seconds)
   - Adjust based on network latency

6. Match write concern to read concern for consistency
   - Write: { w: 'majority' } → Read: { level: 'majority' }
   - Ensures you read what you wrote

7. Monitor replication lag
   - High lag = write concern timeouts
   - Scale replica set or optimize network
*/


// === WRITE CONCERN IN SHARDED CLUSTERS ===
// In sharded cluster, write concern applies to each shard

// Sharded collection across 3 shards
await ShardedOrder.create(
  { orderId: '400', customerId: 'C1', amount: 1000 },
  { writeConcern: { w: 'majority' } }
);

// What happens:
// 1. mongos routes to appropriate shard based on shard key
// 2. Write applied to that shard's replica set
// 3. Write concern enforced on that replica set only
// 4. mongos returns when shard's write concern satisfied


// === WRITE CONCERN AND PERFORMANCE MONITORING ===
const perfStats = await db.serverStatus();

console.log('Write metrics:');
console.log('Write ops/sec:', perfStats.opcounters.insert + perfStats.opcounters.update);
console.log('Replication lag (max):', Math.max(...status.members.map(m => m.optimeDate)));
console.log('Write concerns timed out:', perfStats.metrics.repl.network.getmores.timeouts);
```

***

### Q18: MongoDB Transactions and Atomicity

```javascript
const session = await mongoose.startSession();

try {
  session.startTransaction();
  
  // Transfer $500 from Account A to Account B
  await Account.updateOne(
    { accountId: 'A', balance: { $gte: 500 } },
    { $inc: { balance: -500 } },
    { session }
  );
  
  await Account.updateOne(
    { accountId: 'B' },
    { $inc: { balance: 500 } },
    { session }
  );
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Question:** What happens if the first `updateOne` matches no documents (balance < 500)?

A) Transaction commits with only second update applied  
B) Transaction automatically rolls back both operations  
C) Transaction commits but first update is skipped  
D) First update succeeds with balance going negative

**Answer: C) Transaction commits but first update is skipped**

**Explanation:**
MongoDB transactions provide **all-or-nothing** execution, but an update matching zero documents is not considered an error. The operation succeeds (modifiedCount: 0), and the transaction continues. To prevent this, you must explicitly check `modifiedCount` and throw an error to trigger rollback.[6][7][8][9]

**MongoDB Transactions Deep Dive:**

```javascript
// === UNDERSTANDING MONGODB TRANSACTIONS ===
// Available since MongoDB 4.0 (replica sets)
// Distributed transactions since 4.2 (sharded clusters)

const mongoose = require('mongoose');

// === BASIC TRANSACTION PATTERN ===
async function transferMoney(fromAccount, toAccount, amount) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary'
    });
    
    // Deduct from source account
    const deductResult = await Account.updateOne(
      { accountId: fromAccount, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { session }
    );
    
    // ⚠️ CRITICAL: Check if update succeeded
    if (deductResult.modifiedCount === 0) {
      throw new Error('Insufficient balance or account not found');
    }
    
    // Add to destination account
    const addResult = await Account.updateOne(
      { accountId: toAccount },
      { $inc: { balance: amount } },
      { session }
    );
    
    if (addResult.modifiedCount === 0) {
      throw new Error('Destination account not found');
    }
    
    // Commit transaction
    await session.commitTransaction();
    return { success: true };
    
  } catch (error) {
    // Abort transaction on any error
    await session.abortTransaction();
    console.error('Transaction aborted:', error.message);
    return { success: false, error: error.message };
    
  } finally {
    // Always end session
    session.endSession();
  }
}


// === TRANSACTION GUARANTEES (ACID) ===
// A - Atomicity: All or nothing
// C - Consistency: Data remains valid
// I - Isolation: Concurrent transactions don't interfere
// D - Durability: Committed data persists

// Example: E-commerce order placement
async function placeOrder(customerId, items, totalAmount) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction({
      readConcern: { level: 'snapshot' },    // Consistent read view
      writeConcern: { w: 'majority', j: true } // Durable writes
    });
    
    // 1. Create order
    const [order] = await Order.create([{
      customerId,
      items,
      totalAmount,
      status: 'pending'
    }], { session });
    
    // 2. Decrement inventory for each item
    for (const item of items) {
      const result = await Inventory.updateOne(
        { productId: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session }
      );
      
      if (result.modifiedCount === 0) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }
    
    // 3. Charge customer (record payment)
    await Payment.create([{
      orderId: order._id,
      customerId,
      amount: totalAmount,
      status: 'completed'
    }], { session });
    
    // 4. Update order status
    await Order.updateOne(
      { _id: order._id },
      { $set: { status: 'confirmed' } },
      { session }
    );
    
    // All operations succeed together
    await session.commitTransaction();
    return { success: true, orderId: order._id };
    
  } catch (error) {
    // Any failure rolls back everything
    await session.abortTransaction();
    return { success: false, error: error.message };
    
  } finally {
    session.endSession();
  }
}


// === TRANSACTION ISOLATION LEVELS ===
// MongoDB supports snapshot isolation

// Scenario: Two concurrent transactions
// Transaction 1: Update Account A balance
const session1 = await mongoose.startSession();
session1.startTransaction({ readConcern: { level: 'snapshot' } });

await Account.updateOne(
  { accountId: 'A' },
  { $inc: { balance: 100 } },
  { session: session1 }
);

// Transaction 2: Read Account A balance (concurrent)
const session2 = await mongoose.startSession();
session2.startTransaction({ readConcern: { level: 'snapshot' } });

const account = await Account.findOne(
  { accountId: 'A' },
  { session: session2 }
);
// Reads the balance BEFORE Transaction 1's changes
// Snapshot isolation ensures consistent read view

await session1.commitTransaction();
await session2.commitTransaction();

session1.endSession();
session2.endSession();


// === TRANSACTION LIMITATIONS ===
// 1. Transaction size limit: 16MB
// Problematic:
const session = await mongoose.startSession();
session.startTransaction();

for (let i = 0; i < 100000; i++) {
  await Log.create([{ message: `Log ${i}` }], { session });
}
// Error: Transaction too large!

// Solution: Batch outside transaction or use bulk operations
await Log.insertMany(
  Array.from({ length: 100000 }, (_, i) => ({ message: `Log ${i}` })),
  { ordered: false }
);


// 2. Transaction time limit: 60 seconds (default)
session.startTransaction({ maxTimeMS: 60000 });

// Long-running operations timeout
// Error: Transaction exceeded time limit


// 3. Cannot create collections/indexes in transactions
session.startTransaction();
await mongoose.model('NewCollection', new Schema({...})); // Error!


// 4. Cannot use certain operations
session.startTransaction();
await User.createIndexes({ email: 1 }); // Error!
await db.adminCommand({ listDatabases: 1 }); // Error!


// === RETRYABLE WRITES AND TRANSACTIONS ===
// MongoDB automatically retries certain transient errors

mongoose.connect('mongodb://localhost:27017/mydb', {
  retryWrites: true,  // Enable retryable writes (default: true)
  retryReads: true    // Enable retryable reads
});

// Automatically retries on:
// - Network errors
// - Primary step-down (replica set election)
// - Not enough majority (write concern timeout)

// With transactions, use callback API for automatic retry
async function runTransactionWithRetry(txnFunc, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await txnFunc();
    } catch (error) {
      attempt++;
      
      // Check if error is retryable
      if (error.hasErrorLabel('TransientTransactionError') && attempt < maxRetries) {
        console.log(`Retrying transaction (attempt ${attempt})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
}

// Usage
await runTransactionWithRetry(async () => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    
    await Account.updateOne({ accountId: 'A' }, { $inc: { balance: -100 } }, { session });
    await Account.updateOne({ accountId: 'B' }, { $inc: { balance: 100 } }, { session });
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});


// === TRANSACTION COMMIT RETRY ===
// Commit operations can also be retried

async function commitWithRetry(session) {
  try {
    await session.commitTransaction();
    console.log('Transaction committed');
  } catch (error) {
    if (error.hasErrorLabel('UnknownTransactionCommitResult')) {
      console.log('Retrying commit...');
      await commitWithRetry(session);
    } else {
      throw error;
    }
  }
}


// === TRANSACTIONS VS SINGLE-DOCUMENT ATOMICITY ===
// MongoDB provides atomicity at document level WITHOUT transactions

// Single document update (atomic, no transaction needed)
await Order.updateOne(
  { _id: orderId },
  { 
    $set: { status: 'shipped' },
    $inc: { itemsShipped: 1 },
    $push: { history: { event: 'shipped', date: new Date() } }
  }
);
// All fields updated atomically


// Multiple documents (need transaction)
const session = await mongoose.startSession();
session.startTransaction();

await Order.updateOne({ _id: orderId }, { $set: { status: 'shipped' } }, { session });
await Inventory.updateOne({ productId }, { $inc: { shipped: 1 } }, { session });

await session.commitTransaction();
session.endSession();


// === PERFORMANCE CONSIDERATIONS ===
// Transactions have overhead

// Benchmark: 10,000 updates
console.time('Without transaction');
for (let i = 0; i < 10000; i++) {
  await Account.updateOne({ accountId: 'A' }, { $inc: { balance: 1 } });
}
console.timeEnd('Without transaction');
// Time: ~5 seconds

console.time('With transaction');
const session = await mongoose.startSession();
session.startTransaction();
for (let i = 0; i < 10000; i++) {
  await Account.updateOne({ accountId: 'A' }, { $inc: { balance: 1 } }, { session });
}
await session.commitTransaction();
session.endSession();
console.timeEnd('With transaction');
// Time: ~8 seconds (60% slower)


// === WHEN TO USE TRANSACTIONS ===
/*
✅ USE TRANSACTIONS:
- Multi-document updates that must be atomic
- Financial operations (transfers, payments)
- Order placement with inventory updates
- Complex workflows requiring rollback

❌ AVOID TRANSACTIONS:
- Single document updates (already atomic)
- Read-only operations
- Bulk operations on single collection
- High-throughput writes (use bulk operations)

💡 ALTERNATIVES:
- Embed related data in single document (atomic updates)
- Use $inc, $push, $pull operators (atomic)
- Design schema to minimize multi-document operations
- Use change streams for eventual consistency
*/


// === REAL-WORLD EXAMPLE: RESERVATION SYSTEM ===
const SeatSchema = new mongoose.Schema({
  seatId: String,
  status: String, // 'available', 'reserved', 'booked'
  reservedBy: String,
  reservedAt: Date
});

const ReservationSchema = new mongoose.Schema({
  userId: String,
  seatIds: [String],
  status: String,
  createdAt: Date
});

async function reserveSeats(userId, seatIds) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' }
    });
    
    // 1. Check all seats are available
    const seats = await Seat.find(
      { seatId: { $in: seatIds }, status: 'available' },
      { session }
    );
    
    if (seats.length !== seatIds.length) {
      throw new Error('Some seats are not available');
    }
    
    // 2. Reserve all seats
    const reserveResult = await Seat.updateMany(
      { seatId: { $in: seatIds }, status: 'available' },
      { 
        $set: { 
          status: 'reserved',
          reservedBy: userId,
          reservedAt: new Date()
        }
      },
      { session }
    );
    
    if (reserveResult.modifiedCount !== seatIds.length) {
      throw new Error('Failed to reserve all seats');
    }
    
    // 3. Create reservation record
    await Reservation.create([{
      userId,
      seatIds,
      status: 'pending',
      createdAt: new Date()
    }], { session });
    
    await session.commitTransaction();
    return { success: true };
    
  } catch (error) {
    await session.abortTransaction();
    return { success: false, error: error.message };
    
  } finally {
    session.endSession();
  }
}
```

***

## Section 3: Replication, Sharding, and Advanced Topics

### Q19: Replica Set Elections and Failover

```javascript
// Replica Set Configuration
// Node 1 (Primary): priority: 2
// Node 2 (Secondary): priority: 1
// Node 3 (Secondary): priority: 1
// Node 4 (Arbiter): priority: 0

// Current state: Node 1 is Primary

// Scenario: Node 1 becomes unreachable
```

**Question:** What happens during the election process?

A) Node 2 or 3 becomes primary immediately (< 1 second)  
B) Election takes 10-12 seconds; Node 2 has higher chance of winning  
C) Arbiter becomes temporary primary until Node 1 returns  
D) Cluster becomes read-only until Node 1 returns

**Answer: B) Election takes 10-12 seconds; Node 2 has higher chance of winning**

**Explanation:**
Replica set elections occur when the primary becomes unavailable. The election process takes approximately 10-12 seconds (heartbeat detection + voting). **Priority** determines likelihood of election (Node 2's priority: 1 means equal chance with Node 3). **Arbiters** never become primary, only participate in voting.[10][11][12][13][14]

**Replica Set Deep Dive:**

```javascript
// === REPLICA SET ARCHITECTURE ===
/*
Replica Set Components:
1. Primary: Receives all write operations
2. Secondaries: Replicate primary's oplog
3. Arbiter: Votes in elections, no data
4. Hidden members: Can't become primary
5. Delayed members: Historical data backup
*/

// === REPLICA SET CONFIGURATION ===
// Connect to MongoDB
const { MongoClient } = require('mongodb');

// Initialize replica set (run once)
rs.initiate({
  _id: 'myReplicaSet',
  members: [
    { _id: 0, host: 'mongo1:27017', priority: 2 },  // Preferred primary
    { _id: 1, host: 'mongo2:27017', priority: 1 },  // Secondary
    { _id: 2, host: 'mongo3:27017', priority: 1 },  // Secondary
    { _id: 3, host: 'mongo4:27017', arbiterOnly: true }  // Arbiter
  ]
});

// Check replica set status
rs.status();
/*
{
  members: [
    { name: 'mongo1:27017', stateStr: 'PRIMARY', health: 1 },
    { name: 'mongo2:27017', stateStr: 'SECONDARY', health: 1 },
    { name: 'mongo3:27017', stateStr: 'SECONDARY', health: 1 },
    { name: 'mongo4:27017', stateStr: 'ARBITER', health: 1 }
  ]
}
*/


// === ELECTION PROCESS ===
// Step 1: Heartbeat Detection (10 seconds default)
// - Secondaries send heartbeats to primary every 2 seconds
// - If primary doesn't respond for 10 seconds → election triggered

// Step 2: Election Initiation
// - Eligible secondaries call for election
// - Send vote requests to all members

// Step 3: Voting
// - Each member votes for ONE candidate
// - Priority influences vote (higher priority = more likely)
// - Requires majority vote (> 50%)

// Step 4: New Primary
// - Winner becomes primary
// - Starts accepting writes
// - Other secondaries replicate from new primary


// === PRIORITY AND ELECTIONS ===
// Priority: 0 to 1000 (default: 1)
// Higher priority = more likely to be elected

// Example: Data center preference
rs.reconfig({
  _id: 'myReplicaSet',
  members: [
    { _id: 0, host: 'dc1-mongo1:27017', priority: 10 }, // Preferred (DC1)
    { _id: 1, host: 'dc1-mongo2:27017', priority: 5 },  // Backup (DC1)
    { _id: 2, host: 'dc2-mongo1:27017', priority: 1 },  // DR site (DC2)
    { _id: 3, host: 'dc2-mongo2:27017', priority: 0 }   // Never primary (DR)
  ]
});

// priority: 0 → Never becomes primary (passive member)
// Use case: Analytics node, backup node


// === ELECTION SCENARIOS ===
// Scenario 1: Primary failure
// Before: [Primary], Secondary, Secondary
// Primary crashes
// After 10-12 seconds: Secondary, [New Primary], Secondary

// Scenario 2: Network partition (split brain prevention)
// 5-node replica set: Primary + 2 Secondaries | 2 Secondaries
// Partition splits: [Primary + 2 Sec] vs [2 Sec]
// Result:
// - Group 1 (3 nodes = majority): Primary continues
// - Group 2 (2 nodes = no majority): Both become secondary


// Scenario 3: Insufficient majority
// 3-node replica set: Primary, Secondary, Secondary
// If 2 nodes go down → Only 1 node left (no majority)
// Result: Remaining node becomes secondary (read-only)


// === WRITE OPERATIONS DURING ELECTION ===
const mongoose = require('mongoose');

mongoose.connect('mongodb://mongo1:27017,mongo2:27017,mongo3:27017/mydb?replicaSet=myReplicaSet');

// During election (~10-12 seconds):
try {
  await User.create({ name: 'John' });
} catch (error) {
  console.error(error.message);
  // Error: "not master" or "no primary available"
}

// Application should implement retry logic
async function writeWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await User.create(data);
    } catch (error) {
      if (error.message.includes('not master')) {
        console.log(`Retry ${i + 1}: Waiting for new primary...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed after retries');
}


// === READ OPERATIONS DURING ELECTION ===
// Read preference determines where reads go

// 1. Read from primary only (default)
await User.find({}).read('primary');
// During election: Fails (no primary)

// 2. Read from primary preferred
await User.find({}).read('primaryPreferred');
// During election: Reads from secondary

// 3. Read from secondary
await User.find({}).read('secondary');
// During election: Continues normally

// 4. Read from secondary preferred
await User.find({}).read('secondaryPreferred');
// Normal: Reads from secondary
// If no secondary: Reads from primary

// 5. Read from nearest (lowest latency)
await User.find({}).read('nearest');
// Reads from any member with lowest network latency


// === OPLOG (OPERATIONS LOG) ===
// Primary logs all writes to oplog
// Secondaries replicate by reading primary's oplog

// Check oplog size
db.getReplicationInfo();
/*
{
  logSizeMB: 1024,  // 1GB
  usedMB: 512,
  timeDiff: 3600,   // 1 hour of operations
  tFirst: ISODate("2025-10-23T10:00:00Z"),
  tLast: ISODate("2025-10-23T11:00:00Z")
}
*/

// Oplog window: How far behind a secondary can fall
// If secondary falls behind oplog window → Manual resync needed


// === REPLICATION LAG ===
// Time difference between primary and secondary

rs.status().members.forEach(member => {
  if (member.stateStr === 'SECONDARY') {
    const lag = (member.optimeDate.getTime() - rs.status().optimeDate.getTime()) / 1000;
    console.log(`${member.name} lag: ${lag} seconds`);
  }
});

// Causes of replication lag:
// - Network latency
// - Secondary hardware slower than primary
// - Heavy read load on secondary
// - Large oplog entries (bulk operations)

// Impact:
// - Stale reads from secondaries
// - Longer election time (secondary must catch up)


// === ARBITER NODES ===
// Lightweight voting member, no data

// Add arbiter
rs.addArb('mongo-arbiter:27017');

// Use cases:
// - Odd number of voting members (prevent ties)
// - Cost savings (no data storage)
// - Small deployments (2 data nodes + 1 arbiter)

// Limitations:
// - Doesn't hold data (no failover benefit)
// - Doesn't help with read scaling

// Best practice: Only use if necessary (prefer data-bearing nodes)


// === HIDDEN MEMBERS ===
// Replica set member that:
// - Replicates data
// - Cannot become primary
// - Not visible to application

rs.reconfig({
  _id: 'myReplicaSet',
  members: [
    { _id: 0, host: 'mongo1:27017', priority: 1 },
    { _id: 1, host: 'mongo2:27017', priority: 1 },
    { _id: 2, host: 'mongo-hidden:27017', priority: 0, hidden: true }
  ]
});

// Use cases:
// - Analytics workloads (doesn't affect production)
// - Backup node
// - Reporting queries


// === DELAYED MEMBERS ===
// Secondary that lags behind primary by fixed time

rs.reconfig({
  _id: 'myReplicaSet',
  members: [
    { _id: 0, host: 'mongo1:27017', priority: 1 },
    { _id: 1, host: 'mongo2:27017', priority: 1 },
    { 
      _id: 2, 
      host: 'mongo-delayed:27017', 
      priority: 0,
      hidden: true,
      secondaryDelaySecs: 3600  // 1 hour delay
    }
  ]
});

// Use case: Protection against accidental data deletion
// If someone drops collection at 2 PM:
// - Delayed member still has data from 1 PM
// - Recover from delayed member


// === MONITORING REPLICA SETS ===
// Check replica set health
const status = rs.status();

status.members.forEach(member => {
  console.log(`${member.name}:`);
  console.log(`  State: ${member.stateStr}`);
  console.log(`  Health: ${member.health === 1 ? 'OK' : 'DOWN'}`);
  console.log(`  Uptime: ${member.uptime} seconds`);
  console.log(`  Last heartbeat: ${member.lastHeartbeat}`);
  
  if (member.stateStr === 'SECONDARY') {
    const lag = (Date.now() - member.optimeDate.getTime()) / 1000;
    console.log(`  Replication lag: ${lag.toFixed(2)} seconds`);
  }
});


// === REPLICA SET BEST PRACTICES ===
/*
1. Use odd number of voting members (3, 5, 7)
   - Prevents election ties
   - Ensures clear majority

2. Set appropriate priorities
   - Higher priority for preferred primary
   - Priority: 0 for nodes that shouldn't be primary

3. Monitor replication lag
   - Alert if lag > 10 seconds
   - Investigate causes (network, hardware, load)

4. Size oplog appropriately
   - Should cover expected downtime window
   - Default: 5% of disk (min 990MB, max 50GB)
   - Increase for write-heavy workloads

5. Use write concern: 'majority'
   - Ensures data survives elections
   - Prevents data loss on rollback

6. Configure proper read preferences
   - primary: Strong consistency
   - secondaryPreferred: Better availability
   - nearest: Lowest latency

7. Test failover scenarios
   - Simulate primary failure
   - Measure election time
   - Verify application reconnection

8. Deploy across availability zones
   - Protects against data center failures
   - Configure priorities for preferred zone
*/
```

***

### Q20: Sharding and Shard Key Selection

```javascript
// Collection: 10 million user documents
const UserSchema = new mongoose.Schema({
  userId: String,        // Sequential: user1, user2, user3...
  email: String,
  country: String,       // 5 values: US, UK, CA, AU, IN
  registeredAt: Date,    // Monotonically increasing
  lastLoginAt: Date
});

// Shard Key Option A
sh.shardCollection('mydb.users', { userId: 1 });

// Shard Key Option B
sh.shardCollection('mydb.users', { country: 1 });

// Shard Key Option C
sh.shardCollection('mydb.users', { registeredAt: 1 });

// Shard Key Option D
sh.shardCollection('mydb.users', { userId: 'hashed' });

// Query pattern: find({ userId: 'user12345' })
```

**Question:** Which shard key will cause the MOST problems with hotspots and uneven distribution?

A) Option A (userId)  
B) Option B (country)  
C) Option C (registeredAt)  
D) Option D (hashed userId)

**Answer: C) Option C (registeredAt)**

**Explanation:**
**Monotonically increasing** shard keys (timestamps, auto-increment IDs) create **hotspots**. All new writes go to the shard containing the highest range, while other shards remain idle. Option B (country) has low cardinality (5 values), limiting to max 5 chunks. Option A (sequential userId) is also monotonic. Option D (hashed) provides even distribution.[15][16][17][18]

**Sharding Deep Dive:**

```javascript
// === MONGODB SHARDING ARCHITECTURE ===
/*
Components:
1. Shards: Store subset of data (replica sets)
2. Config servers: Store metadata (3-node replica set)
3. Mongos: Query routers (stateless, multiple instances)

Client → mongos → appropriate shard(s) → return results
*/

// === ENABLE SHARDING ===
// 1. Enable sharding on database
sh.enableSharding('mydb');

// 2. Shard collection with shard key
sh.shardCollection('mydb.users', { userId: 'hashed' });


// === UNDERSTANDING CHUNKS ===
// MongoDB partitions sharded data into chunks
// Default chunk size: 64MB
// Each chunk: range of shard key values

// Example with range-based sharding on userId:
// Shard A: { userId: { $minKey } } → { userId: 'm' }
// Shard B: { userId: 'm' } → { userId: 'z' }
// Shard C: { userId: 'z' } → { userId: { $maxKey } }


// === SHARD KEY SELECTION CRITERIA ===
// Good shard key has:
// 1. High cardinality (many unique values)
// 2. High frequency (evenly distributed queries)
// 3. Non-monotonic (not always increasing)


// === BAD SHARD KEY EXAMPLES ===
// ❌ Example 1: Monotonically increasing timestamp
sh.shardCollection('mydb.events', { createdAt: 1 });

// Problem: All writes go to one shard
// Time: 10:00 AM → Shard 3 (range: 9 AM - 11 AM)
// Time: 10:01 AM → Shard 3 (same range)
// Time: 10:02 AM → Shard 3 (same range)
// Result: Shard 3 overloaded, Shards 1 & 2 idle

await Event.create({ type: 'click', createdAt: new Date() });
// Always goes to last shard (hotspot!)


// ❌ Example 2: Low cardinality field
sh.shardCollection('mydb.users', { country: 1 });

// Problem: Only 5 unique values → max 5 chunks
// 4 shards, 5 chunks → uneven distribution
// US users (60%) → 1 chunk → 1 shard (overloaded)
// Other countries (40%) → 4 chunks → 3 shards (underutilized)

await User.find({ country: 'US' });
// Always queries 1 shard (no parallelization)


// ❌ Example 3: Sequential ID
sh.shardCollection('mydb.orders', { orderId: 1 });

// If orderId: 1, 2, 3, 4, 5...
// Problem: Same as monotonic timestamp
// All new orders go to last shard


// === GOOD SHARD KEY EXAMPLES ===
// ✅ Example 1: Hashed shard key
sh.shardCollection('mydb.users', { userId: 'hashed' });

// Benefits:
// - Even distribution (hash function randomizes)
// - No hotspots (writes distributed across shards)
// - High cardinality (each userId unique)

await User.create({ userId: 'user12345', email: 'john@example.com' });
// Hash(user12345) = 0x7A3F... → routes to appropriate shard

// Limitation: Can't do range queries efficiently
await User.find({ userId: { $gte: 'user1000', $lte: 'user2000' } });
// Must query ALL shards (hash destroys range)


// ✅ Example 2: Compound shard key (high cardinality + query pattern)
const OrderSchema = new mongoose.Schema({
  customerId: String,    // High cardinality
  orderDate: Date,       // Monotonic
  orderId: String
});

sh.shardCollection('mydb.orders', { customerId: 1, orderDate: 1 });

// Benefits:
// - customerId provides distribution (many customers)
// - orderDate allows time-range queries per customer
// - Prevents hotspots (spread across customers)

// Query: Get customer's recent orders
await Order.find({ 
  customerId: 'C12345',
  orderDate: { $gte: lastWeek }
});
// Routes to single shard (customerId in shard key)
// Uses index efficiently (compound key)


// ✅ Example 3: Location-based shard key
const StoreSchema = new mongoose.Schema({
  storeId: String,
  region: String,        // US-East, US-West, EU, Asia
  city: String,
  data: Object
});

sh.shardCollection('mydb.stores', { region: 1, storeId: 1 });

// Benefits:
// - region provides geographic distribution
// - storeId adds cardinality
// - Queries typically filter by region (targeted routing)

await Store.find({ region: 'US-East', city: 'NYC' });
// Routes to shards containing US-East data


// === ZONE SHARDING (TAG-BASED) ===
// Assign chunks to specific shards based on shard key ranges

// Example: GDPR compliance (EU data must stay in EU)
sh.addShardTag('shard-eu', 'EU');
sh.addShardTag('shard-us', 'US');

sh.addTagRange(
  'mydb.users',
  { country: 'UK' },
  { country: 'UK\xff' },
  'EU'
);

sh.addTagRange(
  'mydb.users',
  { country: 'USA' },
  { country: 'USA\xff' },
  'US'
);

// Result: UK users stored on shard-eu, US users on shard-us


// === JUMBO CHUNKS ===
// Chunk > 64MB that can't be split

// Cause: Too many documents with same shard key value
sh.shardCollection('mydb.orders', { sellerId: 1 });

// If one seller has 10 million orders:
// - All orders → 1 chunk
// - Chunk size: 500MB (> 64MB)
// - Can't split (all have same sellerId)
// - Chunk stuck on 1 shard (imbalance)

// Solution 1: Better shard key
sh.shardCollection('mydb.orders', { sellerId: 1, orderId: 1 });
// Now splits by orderId within seller

// Solution 2: Refine shard key (MongoDB 4.4+)
db.adminCommand({
  refineCollectionShardKey: 'mydb.orders',
  key: { sellerId: 1, orderDate: 1 }
});


// === CHUNK MIGRATION (BALANCER) ===
// MongoDB automatically balances chunks across shards

// Check balancer status
sh.isBalancerRunning();

// Get balancer state
sh.getBalancerState();

// Balancer runs when:
// - Shard has 8+ more chunks than another shard
// - New shard added
// - Manual balancing triggered

// During migration:
// - Chunk copied to destination shard
// - Source shard continues serving requests
// - After copy complete, brief lock, switch over
// - Source shard deletes chunk

// Impact: Minimal (background operation)


// === QUERY ROUTING ===
// Mongos determines which shard(s) to query

// Scenario 1: Query includes shard key (targeted)
sh.shardCollection('mydb.users', { userId: 'hashed' });

await User.findOne({ userId: 'user12345' });
// Mongos:
// 1. Hashes userId → 0x7A3F...
// 2. Looks up which shard owns that range
// 3. Queries only that shard
// Result: Single shard query (fast!)


// Scenario 2: Query doesn't include shard key (broadcast)
await User.find({ email: 'john@example.com' });
// Mongos:
// 1. Doesn't know which shard has this email
// 2. Queries ALL shards
// 3. Merges results
// Result: Scatter-gather (slower)


// Scenario 3: Range query on shard key
sh.shardCollection('mydb.orders', { customerId: 1, orderDate: 1 });

await Order.find({
  customerId: 'C12345',
  orderDate: { $gte: lastWeek }
});
// Mongos:
// 1. customerId in shard key → targeted routing
// 2. Queries shards with C12345 data
// Result: Targeted query (efficient)


// === MONITORING SHARDING ===
// Check shard distribution
sh.status();
/*
{
  shards: {
    shard0000: { host: 'rs0/mongo1:27017,mongo2:27017' },
    shard0001: { host: 'rs1/mongo3:27017,mongo4:27017' },
    shard0002: { host: 'rs2/mongo5:27017,mongo6:27017' }
  },
  databases: {
    mydb: {
      sharded: true,
      collections: {
        'mydb.users': {
          shardKey: { userId: 'hashed' },
          chunks: {
            shard0000: 100,
            shard0001: 98,
            shard0002: 102
          }
        }
      }
    }
  }
}
*/

// Check collection distribution
db.users.getShardDistribution();
/*
Shard shard0000 at rs0/mongo1:27017,mongo2:27017
  data: 33.45GB docs: 3333333 chunks: 100
  estimated data per chunk: 334.5MB
  estimated docs per chunk: 33333

Shard shard0001 at rs1/mongo3:27017,mongo4:27017  
  data: 32.67GB docs: 3266667 chunks: 98
  estimated data per chunk: 333.4MB
  estimated docs per chunk: 33333

Shard shard0002 at rs2/mongo5:27017,mongo6:27017
  data: 33.88GB docs: 3400000 chunks: 102
  estimated data per chunk: 332.2MB
  estimated docs per chunk: 33333

Totals
  data: 100GB docs: 10000000 chunks: 300
  Shard shard0000 contains 33.45% data, 33.33% docs
  Shard shard0001 contains 32.67% data, 32.67% docs
  Shard shard0002 contains 33.88% data, 34% docs
*/


// === RESHARDING (Changing shard key) ===
// MongoDB 5.0+ allows changing shard key

// Original shard key
sh.shardCollection('mydb.users', { userId: 1 });

// Later realize monotonic pattern is bad
// Reshard with hashed key
db.adminCommand({
  reshardCollection: 'mydb.users',
  key: { userId: 'hashed' }
});

// Warning: Expensive operation (rewrites all data)


// === SHARDING BEST PRACTICES ===
/*
1. Choose shard key carefully (hard to change)
   - Analyze query patterns
   - Consider write distribution
   - Test with realistic data

2. Avoid monotonic shard keys
   - Timestamps
   - Auto-increment IDs
   - Sequential values
   Use hashed or compound keys instead

3. Ensure high cardinality
   - Many unique values
   - Low cardinality → limited chunks → imbalance

4. Match shard key to query patterns
   - Include in most queries (targeted routing)
   - Avoid scatter-gather queries

5. Use compound shard keys
   - Balance distribution + query targeting
   - Example: { customerId: 1, timestamp: 1 }

6. Monitor chunk distribution
   - Check for imbalances
   - Identify jumbo chunks
   - Verify balancer running

7. Pre-split chunks for bulk loads
   - Avoid initial imbalance
   - Distribute writes from start

8. Use zone sharding for compliance
   - Keep data in specific regions
   - GDPR, data residency requirements
*/
```

***

### Q21: MongoDB Security - Authentication and Authorization

```javascript
// MongoDB instance with auth enabled

// User 1
db.createUser({
  user: 'appUser',
  pwd: 'password123',
  roles: [{ role: 'readWrite', db: 'myapp' }]
});

// User 2
db.createUser({
  user: 'analyst',
  pwd: 'password456',
  roles: [{ role: 'read', db: 'myapp' }]
});

// User 3
db.createUser({
  user: 'admin',
  pwd: 'admin123',
  roles: [{ role: 'dbOwner', db: 'myapp' }]
});

// User 'analyst' attempts:
db.users.find({ email: 'john@example.com' });        // Query 1
db.users.updateOne({ _id: 1 }, { $set: { age: 30 } }); // Query 2
db.users.createIndex({ email: 1 });                  // Query 3
```

**Question:** Which operations will 'analyst' be able to perform?

A) Only Query 1  
B) Queries 1 and 2  
C) Queries 1 and 3  
D) All queries

**Answer: A) Only Query 1**

**Explanation:**
MongoDB uses **Role-Based Access Control (RBAC)** to manage permissions. The `read` role grants only read operations (`find`, `count`, `aggregate`). Write operations (`updateOne`, `insertOne`) require `readWrite` role. Index management (`createIndex`) requires `dbAdmin` or `dbOwner` roles.[19][20][21][22]

**MongoDB Security Deep Dive:**

```javascript
// === ENABLING AUTHENTICATION ===
// Start MongoDB with auth enabled
// mongod --auth --port 27017 --dbpath /data/db

// Or in mongod.conf:
/*
security:
  authorization: enabled
*/


// === CREATING FIRST ADMIN USER ===
// Connect to MongoDB WITHOUT auth (only works if no users exist)
// mongo

// Switch to admin database
use admin

// Create root user
db.createUser({
  user: 'root',
  pwd: 'superSecretPassword',
  roles: [{ role: 'root', db: 'admin' }]
});

// Now authentication is enforced!


// === AUTHENTICATION ===
// Method 1: Connect with credentials
mongoose.connect('mongodb://appUser:password123@localhost:27017/myapp');

// Method 2: Authenticate after connecting
const db = mongoose.connection;
await db.authenticate('appUser', 'password123');

// Method 3: Command line
// mongo -u appUser -p password123 --authenticationDatabase myapp


// === BUILT-IN ROLES ===
/*
DATABASE ROLES:
- read: Read data from all non-system collections
- readWrite: read + insert, update, delete

DATABASE ADMIN ROLES:
- dbAdmin: Index management, schema validation, stats
- dbOwner: Full control over database (readWrite + dbAdmin + userAdmin)
- userAdmin: Create/modify users and roles

CLUSTER ADMIN ROLES:
- clusterAdmin: Full cluster management
- clusterManager: Manage replica sets, sharding
- clusterMonitor: Read-only cluster monitoring
- hostManager: Monitor and manage servers

BACKUP ROLES:
- backup: Backup database
- restore: Restore database

ALL-DATABASE ROLES:
- readAnyDatabase: read on all databases
- readWriteAnyDatabase: readWrite on all databases
- userAdminAnyDatabase: userAdmin on all databases
- dbAdminAnyDatabase: dbAdmin on all databases

[1](https://www.mongodb.com/resources/products/capabilities/performance-best-practices-transactions-and-read-write-concerns)
[2](https://www.mongodb.com/docs/manual/core/replica-set-write-concern/)
[3](https://www.mongodb.com/docs/manual/reference/write-concern/)
[4](https://www.dragonflydb.io/faq/mongodb-writeconcern-performance)
[5](https://www.goavega.com/data-analytics/mongodb-write-concern-balancing-consistency-and-performance/)
[6](https://www.geeksforgeeks.org/mongodb/acid-transactions-in-mongodb/)
[7](https://www.mongodb.com/resources/products/capabilities/mongodb-multi-document-acid-transactions)
[8](https://www.mongodb.com/company/blog/product-release-announcements/mongodb-multi-document-acid-transactions-general-availability)
[9](https://www.geeksforgeeks.org/mongodb/multi-document-transaction-in-mongodb/)
[10](https://www.interviewbit.com/mongodb-interview-questions/)
[11](https://www.sanfoundry.com/mongodb-questions-answers-replication/)
[12](https://www.simplilearn.com/mongodb-interview-questions-and-answers-article)
[13](https://arc.dev/talent-blog/mongodb-interview-questions/)
[14](https://www.geeksforgeeks.org/mongodb/mongodb-replication-and-sharding/)
[15](https://www.mongodb.com/docs/manual/core/sharding-data-partitioning/)
[16](https://www.percona.com/blog/mongodb-sharding-are-chunks-balanced-part-1/)
[17](http://www.alibabacloud.com/blog/an-insight-into-mongodb-sharding-chunk-splitting-and-migration_339556)
[18](https://learn.mongodb.com/learn/course/sharding-strategies/)
[19](https://www.mongodb.com/resources/basics/role-based-access-control)
[20](https://www.mongodb.com/docs/manual/core/authorization/)
[21](https://www.geeksforgeeks.org/mongodb/configure-role-based-access-control-in-mongodb/)
[22](https://satoricyber.com/mongodb-security/mongodb-authorization-a-practical-guide/)
[23](https://www.interviewgrid.com/interview_questions/mongodb/mongodb_replication)
[24](https://www.mongodb.com/docs/manual/faq/replica-sets/)
[25](https://www.knowledgehut.com/interview-questions/mongodb)
[26](https://www.mongodb.com/docs/manual/sharding/)
[27](https://www.mongodb.com/products/capabilities/transactions)
[28](https://www.datacamp.com/blog/mongodb-interview-questions)
[29](https://www.mongodb.com/resources/products/capabilities/sharding)
[30](https://learn.mongodb.com/courses/secure-mongodb-atlas-authn-and-authz)
[31](https://www.geeksforgeeks.org/mongodb/encrypt-and-protect-data-in-mongodb/)
[32](https://satoricyber.com/mongodb-security/11-mongodb-security-features-and-best-practices/)
[33](https://www.permit.io/blog/implement-multi-tenancy-rbac-in-mongodb)
[34](https://www.geeksforgeeks.org/mongodb/encrypt-communication-tls-ssl-in-mongodb/)
[35](https://www.percona.com/blog/mongodb-best-practices/)
[36](https://www.datasunrise.com/knowledge-center/rbac-in-mongodb/)
[37](https://www.mongodb.com/docs/manual/core/security-transport-encryption/)
[38](https://genexdbs.com/mongodb-security-how-to-set-up-role-based-access-control/)
[39](https://www.mongodb.com/docs/manual/core/security-encryption-at-rest/)
[40](https://github.com/Devinterview-io/mongodb-interview-questions)
[41](https://www.prisma.io/dataguide/mongodb/authorization-and-privileges)
[42](https://www.mongodb.com/products/capabilities/security/encryption)
[43](https://www.mongodb.com/docs/manual/core/security-data-encryption/)