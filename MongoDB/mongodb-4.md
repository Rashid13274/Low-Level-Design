Here are the remaining 8 questions for **Section 2: Indexes & Performance** to complete your MongoDB interview preparation:

## Section 2: Indexes & Performance (10 Questions):-


### Q11: Index Types and Performance

```javascript
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  username: String,
  age: Number,
  createdAt: Date
});

// Different index types
UserSchema.index({ email: 1 });           // Single field
UserSchema.index({ username: 1, age: 1 }); // Compound
UserSchema.index({ createdAt: -1 });      // Descending
```

**Question:** Which query will NOT benefit from the compound index on { username: 1, age: 1 }?

A) `find({ username: 'john' })`  
B) `find({ username: 'john', age: 25 })`  
C) `find({ age: 25 })`  
D) `find({ username: 'john' }).sort({ age: 1 })`

**Answer: C) `find({ age: 25 })`**

**Explanation:**
Compound indexes follow the **ESR rule** (Equality, Sort, Range):
- Can use leftmost prefix: `{ username: 1 }` uses the index
- Cannot skip to middle: `{ age: 1 }` does NOT use the index
- Full compound: `{ username: 1, age: 1 }` uses the index fully

**Index Deep Dive:**
```javascript
// === SINGLE FIELD INDEX ===
UserSchema.index({ email: 1 }); // 1 = ascending, -1 = descending

// Benefits:
// - Faster lookups: O(log n) instead of O(n)
// - Enforces uniqueness (if unique: true)
// - Used for sorting

await User.find({ email: 'test@example.com' }); // Uses index
await User.find().sort({ email: 1 }); // Uses index for sorting

// === COMPOUND INDEX (Multiple fields) ===
UserSchema.index({ lastName: 1, firstName: 1 });

// ESR Rule: Equality, Sort, Range
// Good queries (use index):
await User.find({ lastName: 'Smith' }); // Leftmost prefix
await User.find({ lastName: 'Smith', firstName: 'John' }); // Full index
await User.find({ lastName: 'Smith' }).sort({ firstName: 1 }); // Prefix + sort

// Bad queries (DON'T use index):
await User.find({ firstName: 'John' }); // Skips leftmost
await User.find().sort({ firstName: 1 }); // Missing lastName

// Index prefix rule
UserSchema.index({ a: 1, b: 1, c: 1 });
// Supports queries on:
// - { a: 1 }
// - { a: 1, b: 1 }
// - { a: 1, b: 1, c: 1 }
// Does NOT support:
// - { b: 1 }
// - { c: 1 }
// - { b: 1, c: 1 }

// === TEXT INDEX (Full-text search) ===
const ArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  tags: [String]
});

ArticleSchema.index({ title: 'text', content: 'text' });

// Search
await Article.find({ $text: { $search: 'mongodb tutorial' } });

// With score
await Article.find(
  { $text: { $search: 'mongodb' } },
  { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } });

// Only ONE text index per collection

// === UNIQUE INDEX ===
UserSchema.index({ email: 1 }, { unique: true });

// Prevents duplicates
await User.create({ email: 'test@example.com' }); // OK
await User.create({ email: 'test@example.com' }); // Error: E11000

// Sparse unique index (null allowed multiple times)
UserSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });

await User.create({ name: 'User1' }); // OK (no phone)
await User.create({ name: 'User2' }); // OK (no phone)
await User.create({ name: 'User3', phoneNumber: '123' }); // OK
await User.create({ name: 'User4', phoneNumber: '123' }); // Error: duplicate

// === PARTIAL INDEX (Conditional) ===
UserSchema.index(
  { email: 1 },
  { 
    partialFilterExpression: { 
      status: 'active' 
    }
  }
);

// Index only includes active users (smaller, faster)
await User.find({ email: 'test@example.com', status: 'active' }); // Uses index
await User.find({ email: 'test@example.com', status: 'inactive' }); // Doesn't use index

// === TTL INDEX (Auto-delete) ===
const SessionSchema = new mongoose.Schema({
  userId: String,
  token: String,
  createdAt: { type: Date, default: Date.now }
});

SessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // 1 hour

// Documents automatically deleted after 1 hour

// === GEOSPATIAL INDEX ===
const StoreSchema = new mongoose.Schema({
  name: String,
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  }
});

StoreSchema.index({ location: '2dsphere' });

// Find stores near user
await Store.find({
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [-73.97, 40.77] // NYC
      },
      $maxDistance: 5000 // 5km
    }
  }
});

// === CHECKING INDEX USAGE ===
// Explain query execution
const explain = await User.find({ email: 'test@example.com' }).explain();

console.log(explain.executionStats);
// {
//   executionSuccess: true,
//   nReturned: 1,
//   executionTimeMillis: 0,
//   totalKeysExamined: 1,      // Used index
//   totalDocsExamined: 1,
//   executionStages: {
//     stage: 'FETCH',
//     inputStage: {
//       stage: 'IXSCAN',         // Index scan (good!)
//       indexName: 'email_1'
//     }
//   }
// }

// Bad query (no index)
const explain = await User.find({ age: 25 }).explain();
// executionStages.stage: 'COLLSCAN' (bad! scans entire collection)

// === INDEX STRATEGIES ===
// 1. Index for frequent queries
UserSchema.index({ status: 1, createdAt: -1 }); // Common filter + sort

// 2. Compound index order matters
// Query: find({ country: 'US', city: 'NYC' }).sort({ createdAt: -1 })
// Good: { country: 1, city: 1, createdAt: -1 }
// Bad: { createdAt: -1, country: 1, city: 1 }

// 3. Don't over-index
// Each index:
// - Takes storage space
// - Slows down writes (must update index)
// - Maximum 64 indexes per collection

// 4. Monitor index usage
// MongoDB tracks unused indexes
db.collection.aggregate([{ $indexStats: {} }]);

// 5. Index intersection (MongoDB can use multiple indexes)
UserSchema.index({ email: 1 });
UserSchema.index({ status: 1 });

// This query can use both indexes
await User.find({ email: 'test@example.com', status: 'active' });
```

---

### Q12: Query Performance - Covered Queries

```javascript
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  age: Number,
  status: String
});

UserSchema.index({ email: 1, status: 1 });

// Query 1
const user1 = await User.findOne({ email: 'test@example.com' })
  .select('email status');

// Query 2
const user2 = await User.findOne({ email: 'test@example.com' })
  .select('email status name');
```

**Question:** Which query is a "covered query" (fastest possible)?

A) Both are covered queries  
B) Query 1 is covered, Query 2 is not  
C) Query 2 is covered, Query 1 is not  
D) Neither is covered

**Answer: B) Query 1 is covered, Query 2 is not**

**Explanation:**
A **covered query** can be answered entirely from the index without looking at documents. Requirements:
- All queried fields are in the index
- All returned fields are in the index
- Query doesn't return `_id` (unless `_id` is in index)

**Covered Queries Explained:**
```javascript
// Setup
const UserSchema = new mongoose.Schema({
  email: String,
  status: String,
  name: String,
  age: Number
});

UserSchema.index({ email: 1, status: 1 });

// === COVERED QUERY (Super fast!) ===
const user = await User.findOne({ email: 'test@example.com' })
  .select('email status -_id') // Exclude _id!
  .lean();

// Execution:
// 1. MongoDB finds email in index
// 2. Reads status from same index entry
// 3. Returns data (never touches actual document!)
// Result: < 1ms even with millions of documents

// Check if covered:
const explain = await User.findOne({ email: 'test@example.com' })
  .select('email status -_id')
  .explain();

console.log(explain.executionStats.totalDocsExamined); // 0 (covered!)

// === NOT COVERED (Slower) ===
// Problem 1: Includes _id (not in index)
const user = await User.findOne({ email: 'test@example.com' })
  .select('email status'); // _id included by default

// totalDocsExamined: 1 (must fetch document for _id)

// Problem 2: Includes field not in index
const user = await User.findOne({ email: 'test@example.com' })
  .select('email status name -_id'); // name not in index

// totalDocsExamined: 1 (must fetch document for name)

// === MAKING QUERIES COVERED ===
// Strategy 1: Add fields to index
UserSchema.index({ email: 1, status: 1, name: 1 });

const user = await User.findOne({ email: 'test@example.com' })
  .select('email status name -_id')
  .lean();
// Now covered!

// Strategy 2: Create specific index for common query
// Common query: Get user status by email
UserSchema.index({ email: 1, status: 1 }); // Lightweight index

app.get('/user/status', async (req, res) => {
  const user = await User.findOne({ email: req.query.email })
    .select('status -_id')
    .lean();
  
  res.json({ status: user?.status });
});
// Super fast covered query

// === REAL-WORLD PATTERNS ===
// Pattern 1: Pagination metadata
UserSchema.index({ status: 1, createdAt: -1, _id: 1 });

// Count active users (covered!)
const count = await User.countDocuments({ status: 'active' });

// Get user IDs only (covered!)
const userIds = await User.find({ status: 'active' })
  .select('_id')
  .lean();

// Pattern 2: Existence checks
UserSchema.index({ email: 1 });

async function emailExists(email) {
  const exists = await User.exists({ email });
  return !!exists;
}
// Covered! exists() only returns _id

// Pattern 3: Aggregation with covered queries
UserSchema.index({ category: 1, price: 1 });

const stats = await Product.aggregate([
  { $match: { category: 'electronics' } },
  { $group: {
    _id: null,
    avgPrice: { $avg: '$price' },
    count: { $sum: 1 }
  }},
  { $project: { _id: 0 } }
]);
// Can be covered if only using indexed fields

// === LIMITATIONS ===
// 1. Cannot cover queries with:
// - Array fields
// - Subdocument fields (unless indexed specifically)
// - $text searches
// - Geospatial queries

// 2. Index size matters
// Larger indexes = slower covered queries
// Balance between coverage and index size

// === MONITORING ===
// Check covered queries in production
const slowQueries = db.system.profile.find({
  'execStats.totalDocsExamined': { $gt: 0 },
  'execStats.totalKeysExamined': { $gt: 0 }
});
// If totalDocsExamined > 0, not covered
```

---

### Q13: Index Cardinality and Selectivity

```javascript
const ProductSchema = new mongoose.Schema({
  category: String,     // 10 unique values
  inStock: Boolean,     // 2 unique values (true/false)
  sku: String,          // 1,000,000 unique values
  price: Number         // 5,000 unique values
});

// Which field should be indexed first in a compound index for:
// Query: find({ inStock: true, category: 'electronics' })
```

**Question:** What's the optimal compound index?

A) `{ inStock: 1, category: 1 }`  
B) `{ category: 1, inStock: 1 }`  
C) Both are equally good  
D) Single indexes on each field

**Answer: B) `{ category: 1, inStock: 1 }`**

**Explanation:**
**Index selectivity** = how much an index reduces the result set.
- High cardinality first (category: 10 values) - filters more
- Low cardinality last (inStock: 2 values) - filters less
- Rule: Most selective fields first


**Index Cardinality Guide:**
```javascript
// === CARDINALITY CONCEPTS ===
// Low cardinality: Few unique values (boolean, status)
// High cardinality: Many unique values (email, SKU, _id)

// Example data:
// - 1,000,000 products
// - inStock: true (600k), false (400k)
// - category: 'electronics' (100k), 'books' (100k), ... 10 categories

// === BAD INDEX (Low cardinality first) ===
ProductSchema.index({ inStock: 1, category: 1 });

// Query: { inStock: true, category: 'electronics' }
// Step 1: inStock: true filters to 600,000 products (60% of data!)
// Step 2: category: 'electronics' filters to 100,000
// Poor selectivity early

```

### Q13: ESR Rule and Compound Index Optimization

``` javascript
const OrderSchema = new mongoose.Schema({
  userId: String,
  status: String,
  totalAmount: Number,
  createdAt: Date
});

// Common query pattern
// Find orders for a specific user with 'completed' status, 
// sorted by creation date, with amount > 100

// Option A
OrderSchema.index({ userId: 1, status: 1, createdAt: -1, totalAmount: 1 });

// Option B  
OrderSchema.index({ userId: 1, createdAt: -1, status: 1, totalAmount: 1 });

// Option C
OrderSchema.index({ totalAmount: 1, userId: 1, status: 1, createdAt: -1 });

// Query
await Order.find({ 
  userId: '123', 
  status: 'completed',
  totalAmount: { $gt: 100 }
}).sort({ createdAt: -1 });
```

**Question:** Which index follows the ESR (Equality, Sort, Range) rule correctly for optimal performance?

A) Option A  
B) Option B  
C) Option C  
D) None of the above

**Answer: A) Option A**

**Explanation:**
The **ESR Rule** (Equality, Sort, Range) is MongoDB's guideline for ordering compound index fields:[1][2][3]
- **Equality (E):** Fields with exact matches come first (`userId: '123'`, `status: 'completed'`)
- **Sort (S):** Fields used for sorting come next (`createdAt: -1`)
- **Range (R):** Fields with range queries come last (`totalAmount: { $gt: 100 }`)

**Deep Dive:**

```javascript
// === WHY ESR RULE MATTERS ===
// Option A: { userId: 1, status: 1, createdAt: -1, totalAmount: 1 } ✅
// Execution:
// 1. Uses index to find userId='123' (narrows to ~1000 docs)
// 2. Within those, finds status='completed' (narrows to ~200 docs)
// 3. Sorts 200 docs by createdAt using index (in-memory sort avoided!)
// 4. Scans sorted results for totalAmount > 100

// Option B: { userId: 1, createdAt: -1, status: 1, totalAmount: 1 } ❌
// Problem: Sort before equality filter
// Execution:
// 1. Uses index to find userId='123' (narrows to ~1000 docs)
// 2. Tries to sort by createdAt (all 1000 docs!)
// 3. Then filters status (inefficient)
// Result: SORT stage in memory (blocking sort)

// Option C: { totalAmount: 1, userId: 1, status: 1, createdAt: -1 } ❌
// Problem: Range field first
// Execution:
// 1. Index scan for totalAmount > 100 (scans large range)
// 2. Then filters userId and status
// Result: Examines many more documents


// === ESR RULE DETAILED EXAMPLES ===
const ProductSchema = new mongoose.Schema({
  category: String,
  brand: String,
  price: Number,
  rating: Number,
  stock: Number,
  createdAt: Date
});

// Query Pattern 1: E + S
// find({ category: 'electronics' }).sort({ createdAt: -1 })
ProductSchema.index({ category: 1, createdAt: -1 }); // ✅ Correct


// Query Pattern 2: E + E + S
// find({ category: 'electronics', brand: 'Apple' }).sort({ price: 1 })
ProductSchema.index({ category: 1, brand: 1, price: 1 }); // ✅ Correct


// Query Pattern 3: E + S + R
// find({ category: 'electronics', price: { $gte: 100, $lte: 500 } })
//   .sort({ rating: -1 })
ProductSchema.index({ category: 1, rating: -1, price: 1 }); // ✅ Correct


// Query Pattern 4: E + E + R + R
// find({ 
//   category: 'electronics', 
//   price: { $gte: 100 },
//   stock: { $gt: 0 }
// })
ProductSchema.index({ category: 1, price: 1, stock: 1 }); // ✅ Correct


// === COMMON MISTAKES ===
// ❌ Mistake 1: Sort field in the middle
ProductSchema.index({ category: 1, createdAt: -1, brand: 1 });
// Problem: brand equality filter after sort
// Query: find({ category: 'electronics', brand: 'Apple' }).sort({ createdAt: -1 })
// Result: Can't use brand part of index efficiently


// ❌ Mistake 2: Range before equality
ProductSchema.index({ price: 1, category: 1 });
// Problem: Range field first
// Query: find({ category: 'electronics', price: { $gt: 100 } })
// Result: Scans all prices > 100, then filters category


// ❌ Mistake 3: Multiple range fields
ProductSchema.index({ category: 1, price: 1, stock: 1, rating: 1 });
// Query: find({ 
//   category: 'electronics', 
//   price: { $gt: 100 }, 
//   stock: { $gt: 0 },
//   rating: { $gte: 4 }
// })
// Only price uses index for range, stock and rating don't benefit


// === ESR WITH CARDINALITY CONSIDERATIONS ===
// When multiple equality fields exist, order by cardinality (high to low)

// Example: User activity tracking
const ActivitySchema = new mongoose.Schema({
  userId: String,      // High cardinality (millions of users)
  eventType: String,   // Low cardinality (10 event types)
  region: String,      // Medium cardinality (50 regions)
  timestamp: Date
});

// Query: find({ userId: 'user123', eventType: 'login', region: 'US' })
//        .sort({ timestamp: -1 })

// ❌ Wrong: Low cardinality first
ActivitySchema.index({ eventType: 1, region: 1, userId: 1, timestamp: -1 });
// Scans 10% of all documents before narrowing to user

// ✅ Correct: High cardinality first (within ESR)
ActivitySchema.index({ userId: 1, region: 1, eventType: 1, timestamp: -1 });
// Narrows to user first (0.0001% of docs), then filters


// === ESR RULE VERIFICATION ===
// Use explain() to verify ESR optimization

const explain = await Order.find({ 
  userId: '123', 
  status: 'completed',
  totalAmount: { $gt: 100 }
}).sort({ createdAt: -1 }).explain('executionStats');

console.log(explain.executionStats);
// Good signs:
// - executionTimeMillis: < 10ms
// - totalKeysExamined: Low number
// - totalDocsExamined: Close to nReturned
// - executionStages.inputStage.stage: 'IXSCAN'
// - No SORT stage (means sort used index)

// Bad signs:
// - SORT stage present (in-memory sort = blocking)
// - totalDocsExamined >> nReturned (scanning too many docs)
// - executionTimeMillis: > 100ms


// === ADVANCED ESR PATTERNS ===
// Pattern 1: Multiple sorts (only first sort uses index)
await Order.find({ userId: '123' })
  .sort({ createdAt: -1, totalAmount: -1 });
// Index: { userId: 1, createdAt: -1 } ✅
// totalAmount sort happens in memory


// Pattern 2: Partial index with ESR
OrderSchema.index(
  { userId: 1, status: 1, createdAt: -1 },
  { partialFilterExpression: { status: { $in: ['pending', 'processing'] } } }
);
// Smaller index for common query pattern


// Pattern 3: ESR with $or queries (complex)
await Order.find({
  $or: [
    { userId: '123', status: 'completed' },
    { userId: '123', status: 'shipped' }
  ]
}).sort({ createdAt: -1 });

// Best index: { userId: 1, status: 1, createdAt: -1 }
// MongoDB can use index for both $or branches


// === REAL-WORLD SCENARIO ===
// E-commerce order listing
const OrderSchema = new mongoose.Schema({
  customerId: String,
  sellerId: String,
  status: String,
  paymentStatus: String,
  orderDate: Date,
  totalPrice: Number,
  itemCount: Number
});

// Dashboard query: Seller's pending orders sorted by date, high value only
// Query: find({ 
//   sellerId: 'seller123',
//   status: 'pending',
//   paymentStatus: 'paid',
//   totalPrice: { $gte: 1000 }
// }).sort({ orderDate: -1 })

// Optimal index (ESR + cardinality):
OrderSchema.index({ 
  sellerId: 1,           // E - High cardinality
  status: 1,             // E - Low cardinality
  paymentStatus: 1,      // E - Low cardinality
  orderDate: -1,         // S - Sort field
  totalPrice: 1          // R - Range field
});

// Performance comparison:
// Without proper ESR: ~500ms (COLLSCAN or inefficient index)
// With ESR index: ~5ms (optimal index scan)
```

***

### Q14: Aggregation Pipeline Performance Optimization

```javascript
const TransactionSchema = new mongoose.Schema({
  userId: String,
  category: String,
  amount: Number,
  status: String,
  createdAt: Date
});

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });

// Pipeline A
const resultsA = await Transaction.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$userId', total: { $sum: '$amount' } } },
  { $match: { total: { $gt: 1000 } } },
  { $sort: { total: -1 } },
  { $limit: 10 }
]);

// Pipeline B
const resultsB = await Transaction.aggregate([
  { $group: { _id: '$userId', total: { $sum: '$amount' } } },
  { $match: { total: { $gt: 1000 }, status: 'completed' } },
  { $sort: { total: -1 } },
  { $limit: 10 }
]);
```

**Question:** Which pipeline will perform better and why?

A) Pipeline A - filters early  
B) Pipeline B - groups first  
C) Both perform equally  
D) Depends on data distribution

**Answer: A) Pipeline A - filters early**

**Explanation:**
Pipeline optimization follows the principle: **Filter Early, Project Early, Limit Early**. Pipeline A filters with `$match` before `$group`, reducing documents processed. Pipeline B tries to filter `status` after grouping, which is impossible since `status` field is lost after `$group`.[4][5][6]

**Aggregation Pipeline Deep Dive:**

```javascript
// === PIPELINE OPTIMIZATION PRINCIPLES ===
// 1. Move $match as early as possible
// 2. Move $project as early as possible  
// 3. Move $limit immediately after $sort
// 4. Use indexes for early stages
// 5. Avoid unnecessary $unwind operations


// === PRINCIPLE 1: EARLY $MATCH ===
const TransactionSchema = new mongoose.Schema({
  userId: String,
  category: String,
  amount: Number,
  status: String,
  country: String,
  createdAt: Date
});

TransactionSchema.index({ status: 1, createdAt: -1 });

// ❌ Bad: Match after expensive operations
await Transaction.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $match: { status: 'completed', country: 'US' } }, // Too late!
  { $group: { _id: '$category', total: { $sum: '$amount' } } }
]);
// Problem: Processes ALL transactions before filtering

// ✅ Good: Match first
await Transaction.aggregate([
  { $match: { status: 'completed', country: 'US' } }, // Uses index!
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $group: { _id: '$category', total: { $sum: '$amount' } } }
]);
// Benefits: 
// - Uses status_1_createdAt_-1 index
// - Processes only completed US transactions
// - 10x-100x faster


// === PRINCIPLE 2: EARLY $PROJECT (Field Reduction) ===
// ❌ Bad: Carrying unnecessary fields
await Transaction.aggregate([
  { $match: { status: 'completed' } },
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' }, // Adds large user document
  { $group: { 
    _id: '$category', 
    total: { $sum: '$amount' }  // Only needs amount and category!
  }}
]);

// ✅ Good: Project early
await Transaction.aggregate([
  { $match: { status: 'completed' } },
  { $project: { category: 1, amount: 1, userId: 1, _id: 0 } }, // Drop unnecessary fields
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $group: { _id: '$category', total: { $sum: '$amount' } } }
]);
// Benefits:
// - Reduces memory usage
// - Faster stage transitions
// - Less data in $lookup


// === PRINCIPLE 3: $LIMIT AFTER $SORT ===
// ❌ Bad: Sort then limit far away
await Transaction.aggregate([
  { $match: { status: 'completed' } },
  { $sort: { amount: -1 } },
  { $group: { _id: '$userId', maxAmount: { $max: '$amount' } } },
  { $limit: 10 } // Limit here doesn't help $sort
]);

// ✅ Good: Limit immediately after sort
await Transaction.aggregate([
  { $match: { status: 'completed' } },
  { $sort: { amount: -1 } },
  { $limit: 100 }, // MongoDB can optimize (top-k sort)
  { $group: { _id: '$userId', maxAmount: { $max: '$amount' } } },
  { $limit: 10 }
]);
// Benefits: MongoDB uses optimized top-k algorithm


// === PRINCIPLE 4: INDEX USAGE IN AGGREGATION ===
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ category: 1, amount: 1 });

// ✅ Index-optimized pipeline
await Transaction.aggregate([
  { $match: { status: 'completed' } }, // Uses index
  { $sort: { createdAt: -1 } }, // Uses index (covered by compound)
  { $limit: 100 }, // Early limit
  { $group: { _id: '$category', total: { $sum: '$amount' } } }
]);

// Check index usage
const explain = await Transaction.aggregate([...]).explain();
console.log(explain.stages[0].$cursor.queryPlanner.winningPlan);
// Look for: inputStage.stage === 'IXSCAN'


// === PRINCIPLE 5: AVOID UNNECESSARY $UNWIND ===
const OrderSchema = new mongoose.Schema({
  orderId: String,
  items: [{
    productId: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number
});

// ❌ Bad: Unwind when not needed
await Order.aggregate([
  { $match: { totalAmount: { $gt: 100 } } },
  { $unwind: '$items' }, // Explodes documents!
  { $group: { 
    _id: '$orderId', 
    itemCount: { $sum: 1 } 
  }}
]);
// Problem: If order has 10 items, creates 10 documents

// ✅ Good: Use array operators
await Order.aggregate([
  { $match: { totalAmount: { $gt: 100 } } },
  { $project: { 
    orderId: 1, 
    itemCount: { $size: '$items' } // No unwind needed!
  }}
]);


// === REAL-WORLD OPTIMIZATION EXAMPLE ===
// Scenario: E-commerce sales report by category

// ❌ Unoptimized (takes ~5000ms on 1M documents)
await Order.aggregate([
  { $lookup: {
    from: 'products',
    localField: 'items.productId',
    foreignField: '_id',
    as: 'productDetails'
  }},
  { $unwind: '$items' },
  { $unwind: '$productDetails' },
  { $match: { 
    'productDetails.category': 'Electronics',
    status: 'completed',
    createdAt: { $gte: new Date('2025-01-01') }
  }},
  { $group: {
    _id: '$productDetails.category',
    revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
    orderCount: { $sum: 1 }
  }},
  { $sort: { revenue: -1 } }
]);

// ✅ Optimized (takes ~50ms on 1M documents)
await Order.aggregate([
  // 1. Filter first (uses index)
  { $match: { 
    status: 'completed',
    createdAt: { $gte: new Date('2025-01-01') }
  }},
  
  // 2. Unwind only items array
  { $unwind: '$items' },
  
  // 3. Lookup only after filtering
  { $lookup: {
    from: 'products',
    localField: 'items.productId',
    foreignField: '_id',
    as: 'product'
  }},
  
  // 4. Unwind product (should be single document)
  { $unwind: '$product' },
  
  // 5. Match category after lookup
  { $match: { 'product.category': 'Electronics' } },
  
  // 6. Project early (reduce fields)
  { $project: {
    category: '$product.category',
    revenue: { $multiply: ['$items.quantity', '$items.price'] }
  }},
  
  // 7. Group
  { $group: {
    _id: '$category',
    revenue: { $sum: '$revenue' },
    orderCount: { $sum: 1 }
  }},
  
  // 8. Sort and limit
  { $sort: { revenue: -1 } },
  { $limit: 10 }
]);


// === PIPELINE COALESCENCE ===
// MongoDB automatically combines certain stages for optimization

// Example: Multiple $match stages
await Transaction.aggregate([
  { $match: { status: 'completed' } },
  { $match: { amount: { $gt: 100 } } },
  { $match: { category: 'Electronics' } }
]);

// MongoDB optimizes to:
// { $match: { status: 'completed', amount: { $gt: 100 }, category: 'Electronics' } }


// Example: $project + $project
await Transaction.aggregate([
  { $project: { userId: 1, amount: 1, category: 1 } },
  { $project: { userId: 1, amount: 1 } }
]);

// MongoDB optimizes to:
// { $project: { userId: 1, amount: 1 } }


// === PIPELINE STAGE REORDERING ===
// MongoDB automatically reorders some stages

await Transaction.aggregate([
  { $sort: { amount: -1 } },
  { $match: { status: 'completed' } } // Will be moved before $sort!
]);

// MongoDB reorders to:
// 1. { $match: { status: 'completed' } }
// 2. { $sort: { amount: -1 } }


// === MONITORING PIPELINE PERFORMANCE ===
// Use explain() to analyze
const explain = await Transaction.aggregate([...]).explain('executionStats');

console.log({
  totalStages: explain.stages.length,
  executionTimeMillis: explain.executionStats.executionTimeMillis,
  nReturned: explain.executionStats.nReturned,
  totalKeysExamined: explain.executionStats.totalKeysExamined,
  totalDocsExamined: explain.executionStats.totalDocsExamined
});

// Check each stage
explain.stages.forEach((stage, index) => {
  console.log(`Stage ${index}:`, Object.keys(stage)[0]);
  if (stage.$cursor) {
    console.log('  Uses index:', stage.$cursor.queryPlanner.winningPlan);
  }
});


// === MEMORY CONSIDERATIONS ===
// Each aggregation stage limited to 100MB by default

// For large datasets, use allowDiskUse
await Transaction.aggregate([
  { $match: { status: 'completed' } },
  { $group: { 
    _id: '$userId', 
    transactions: { $push: '$$ROOT' } // Can be huge!
  }},
  { $sort: { '_id': 1 } }
], { 
  allowDiskUse: true // Allows spilling to disk
});

// Better: Avoid accumulating large arrays
await Transaction.aggregate([
  { $match: { status: 'completed' } },
  { $group: { 
    _id: '$userId', 
    count: { $sum: 1 },  // Just count
    total: { $sum: '$amount' } // Just sum
  }},
  { $sort: { 'total': -1 } }
]);
// No allowDiskUse needed!
```

***

### Q15: Index Cardinality and Selectivity

```javascript
const UserSchema = new mongoose.Schema({
  email: String,        // High cardinality: 1M unique values
  country: String,      // Low cardinality: 50 unique values
  isActive: Boolean,    // Very low cardinality: 2 values
  age: Number,          // Medium cardinality: ~80 unique values
  createdAt: Date
});

// Collection has 1,000,000 documents

// Index Option A
UserSchema.index({ isActive: 1 });

// Index Option B  
UserSchema.index({ country: 1 });

// Index Option C
UserSchema.index({ email: 1 });

// Query
await User.find({ isActive: true });
```

**Question:** Which index characteristic matters most for query performance?

A) Cardinality - higher is always better  
B) Selectivity - how much the query narrows results  
C) Index size - smaller is always better  
D) Field type - strings vs numbers

**Answer: B) Selectivity - how much the query narrows results**

**Explanation:**
**Index selectivity** is the ratio of unique values to total documents. For `isActive: true`, even with an index, MongoDB still scans ~500,000 documents (50% of collection). High cardinality helps, but **query selectivity** (how much the filter narrows results) determines actual performance.[7][3][1]

**Cardinality and Selectivity Deep Dive:**

```javascript
// === UNDERSTANDING CARDINALITY ===
// Cardinality = number of unique values in a field

const UserSchema = new mongoose.Schema({
  email: String,        // Cardinality: 1,000,000 (one per user)
  userId: String,       // Cardinality: 1,000,000 (unique ID)
  country: String,      // Cardinality: 50
  state: String,        // Cardinality: 500
  city: String,         // Cardinality: 5,000
  gender: String,       // Cardinality: 3 (male, female, other)
  isActive: Boolean,    // Cardinality: 2 (true, false)
  age: Number,          // Cardinality: 80 (18-98)
  plan: String,         // Cardinality: 4 (free, basic, pro, enterprise)
  createdAt: Date       // Cardinality: ~365,000 (daily signups)
});

// Collection size: 1,000,000 documents


// === CARDINALITY ANALYSIS ===
// Check cardinality in your collection
await User.distinct('country').then(countries => 
  console.log('Country cardinality:', countries.length)
);

await db.users.aggregate([
  { $group: { _id: '$plan', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
// Output: Shows distribution
// free: 700,000 (70%)
// basic: 200,000 (20%)
// pro: 90,000 (9%)
// enterprise: 10,000 (1%)


// === UNDERSTANDING SELECTIVITY ===
// Selectivity = how much a query narrows down results
// High selectivity = returns few documents (good for indexes)
// Low selectivity = returns many documents (index less helpful)

// High selectivity query (0.0001% of data)
await User.find({ email: 'john@example.com' });
// Returns: 1 document
// Selectivity: 1/1,000,000 = 0.0001%
// Index benefit: ✅ HUGE (0.5ms vs 5000ms)

// Low selectivity query (70% of data)
await User.find({ plan: 'free' });
// Returns: 700,000 documents  
// Selectivity: 700,000/1,000,000 = 70%
// Index benefit: ❌ MINIMAL (might even slow down!)


// === WHEN INDEXES HURT PERFORMANCE ===
// Low selectivity can make indexes SLOWER than table scans!

UserSchema.index({ isActive: 1 });

// Bad query (50% of data)
const activeUsers = await User.find({ isActive: true });

// What happens:
// With index:
// 1. Read index (500,000 entries)
// 2. Fetch documents (500,000 random disk seeks)
// Time: ~5000ms

// Without index (COLLSCAN):
// 1. Sequential scan (1,000,000 documents)
// Time: ~2000ms (sequential reads are faster!)

// MongoDB query planner may choose COLLSCAN over index for low selectivity!


// === COMPOUND INDEXES AND CARDINALITY ===
// Rule: Order compound indexes by cardinality (high to low) WITHIN ESR

const OrderSchema = new mongoose.Schema({
  customerId: String,   // Cardinality: 100,000 (10 orders per customer avg)
  status: String,       // Cardinality: 5 (pending, processing, shipped, delivered, cancelled)
  paymentMethod: String,// Cardinality: 4 (credit, debit, paypal, crypto)
  createdAt: Date
});

// Query: find({ customerId: '123', status: 'pending', paymentMethod: 'credit' })

// ❌ Wrong: Low cardinality first
OrderSchema.index({ status: 1, paymentMethod: 1, customerId: 1 });
// Scan: All pending orders (20% = 200,000), then filter by payment (50K), then customer (10)
// Keys examined: 200,000

// ✅ Correct: High cardinality first (within equality group)
OrderSchema.index({ customerId: 1, status: 1, paymentMethod: 1 });
// Scan: Customer's orders (10), filter by status (2), filter by payment (2)
// Keys examined: 10
// 20,000x more efficient!


// === REAL-WORLD SCENARIOS ===
// Scenario 1: User search
UserSchema.index({ country: 1, city: 1, email: 1 });

// Query 1: find({ country: 'US', city: 'NYC', email: 'john@example.com' })
// Selectivity: Very high (1 document)
// Index usage: Excellent ✅

// Query 2: find({ country: 'US' })
// Selectivity: Low (400,000 documents = 40%)
// Index usage: Poor ❌
// Better: COLLSCAN or different strategy


// Scenario 2: E-commerce products
const ProductSchema = new mongoose.Schema({
  category: String,     // Cardinality: 20
  brand: String,        // Cardinality: 500
  inStock: Boolean,     // Cardinality: 2
  price: Number,        // Cardinality: 50,000 (varied prices)
  rating: Number        // Cardinality: 50 (0.0 to 5.0)
});

// Common query: find({ category: 'Electronics', inStock: true, brand: 'Apple' })
//               .sort({ rating: -1 })

// ❌ Wrong: Very low cardinality first
ProductSchema.index({ inStock: 1, category: 1, brand: 1, rating: -1 });
// Scans 80% of products (in stock), then filters

// ✅ Better: Higher cardinality first, then ESR
ProductSchema.index({ category: 1, brand: 1, rating: -1, inStock: 1 });
// Narrows to Electronics -> Apple -> sorts -> filters in-stock
// Note: inStock at end because it's in equality but very low cardinality


// === SELECTIVITY CALCULATION ===
// Calculate selectivity for your queries

async function calculateSelectivity(collection, query) {
  const totalDocs = await collection.countDocuments();
  const matchingDocs = await collection.countDocuments(query);
  const selectivity = (matchingDocs / totalDocs) * 100;
  
  console.log(`Total documents: ${totalDocs}`);
  console.log(`Matching documents: ${matchingDocs}`);
  console.log(`Selectivity: ${selectivity.toFixed(2)}%`);
  
  if (selectivity > 20) {
    console.log('⚠️  Low selectivity - index may not help');
  } else if (selectivity < 1) {
    console.log('✅ High selectivity - index will help significantly');
  }
}

await calculateSelectivity(User, { isActive: true });
// Output:
// Total documents: 1000000
// Matching documents: 500000
// Selectivity: 50.00%
// ⚠️  Low selectivity - index may not help

await calculateSelectivity(User, { email: 'john@example.com' });
// Output:
// Total documents: 1000000
// Matching documents: 1
// Selectivity: 0.00%
// ✅ High selectivity - index will help significantly


// === STRATEGIES FOR LOW-CARDINALITY FIELDS ===
// Strategy 1: Compound index (combine low-cardinality fields)
UserSchema.index({ country: 1, state: 1, city: 1 });
// Individually low cardinality, together high selectivity

// Strategy 2: Partial index (only index subset)
UserSchema.index(
  { plan: 1 },
  { partialFilterExpression: { plan: { $in: ['pro', 'enterprise'] } } }
);
// Only indexes 10% of users (high-value customers)
// Smaller index, better performance for these queries

// Strategy 3: Filtered partial index
UserSchema.index(
  { isActive: 1, lastLoginAt: -1 },
  { partialFilterExpression: { isActive: true } }
);
// Only indexes active users, makes index more useful


// === CARDINALITY PITFALLS ===
// Pitfall 1: Assuming high cardinality = good index
const LogSchema = new mongoose.Schema({
  timestamp: Date,      // Cardinality: Very high (millions)
  level: String,        // Cardinality: 4 (debug, info, warn, error)
  message: String
});

LogSchema.index({ timestamp: 1 }); // High cardinality

// Query: find({ timestamp: { $gte: yesterday, $lte: today } })
// Problem: Returns millions of documents (low selectivity)
// Index helps with range, but still scans millions


// Pitfall 2: Ignoring data distribution
// Even with high cardinality, skewed data hurts

await User.aggregate([
  { $group: { _id: '$age', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 }
]);
// Output:
// age: 25, count: 200,000 (20%)  <- Skewed!
// age: 30, count: 150,000 (15%)
// age: 28, count: 120,000 (12%)
// ...

// Query: find({ age: 25 }) - Low selectivity despite medium cardinality!


// === MONITORING INDEX EFFECTIVENESS ===
// Check index usage and selectivity

const explain = await User.find({ isActive: true }).explain('executionStats');

const keysExamined = explain.executionStats.totalKeysExamined;
const docsExamined = explain.executionStats.totalDocsExamined;
const docsReturned = explain.executionStats.nReturned;

console.log('Index efficiency metrics:');
console.log(`Keys examined: ${keysExamined}`);
console.log(`Docs examined: ${docsExamined}`);
console.log(`Docs returned: ${docsReturned}`);
console.log(`Efficiency ratio: ${(docsReturned / keysExamined * 100).toFixed(2)}%`);

// Good index: Efficiency ratio > 80%
// Bad index: Efficiency ratio < 20%


// === CARDINALITY + SELECTIVITY DECISION MATRIX ===
/*
|  Cardinality  |  Selectivity  |  Index Strategy            |
|---------------|---------------|----------------------------|
|  High         |  High         |  ✅ Single field index     |
|  High         |  Low          |  ⚠️  Partial index         |
|  Low          |  High         |  ✅ Compound index         |
|  Low          |  Low          |  ❌ No index / COLLSCAN    |
*/
```

***

### Q16: Write Performance and Index Trade-offs

```javascript
const ArticleSchema = new mongoose.Schema({
  title: String,
  author: String,
  category: String,
  tags: [String],
  views: Number,
  likes: Number,
  createdAt: Date,
  updatedAt: Date
});

// Current indexes
ArticleSchema.index({ author: 1, createdAt: -1 });
ArticleSchema.index({ category: 1, views: -1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ likes: -1 });
ArticleSchema.index({ author: 1, category: 1 });

// Write operation
await Article.updateMany(
  { category: 'Technology' },
  { $inc: { views: 1 } }
);
```

**Question:** How do the 6 indexes impact this write operation?

A) Only indexes on 'category' and 'views' are updated  
B) All 6 indexes must be updated  
C) Only indexes on fields being modified ('views') are updated  
D) MongoDB automatically chooses the most efficient index to update

**Answer: A) Only indexes on 'category' and 'views' are updated**

**Explanation:**
When updating documents, MongoDB must update every index that includes fields in the query filter OR fields being modified. Here, `category` is in the filter and `views` is being updated, so indexes containing these fields (`{ category: 1, views: -1 }`) must be updated. Excessive indexes significantly slow write operations.[8][9]

**Write Performance and Indexes Deep Dive:**

```javascript
// === HOW WRITES UPDATE INDEXES ===
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  age: Number,
  status: String,
  lastLogin: Date
});

// 5 indexes
UserSchema.index({ email: 1 });
UserSchema.index({ name: 1 });
UserSchema.index({ age: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ lastLogin: -1 });


// === WRITE OPERATION ANALYSIS ===
// Operation 1: Insert
await User.create({
  email: 'john@example.com',
  name: 'John Doe',
  age: 30,
  status: 'active',
  lastLogin: new Date()
});

// What happens:
// 1. Write document to collection
// 2. Update ALL 5 indexes (must insert into each B-tree)
// Time: ~5ms (1ms for doc + 4x1ms for indexes)
// Without indexes: ~1ms


// Operation 2: Update single field
await User.updateOne(
  { email: 'john@example.com' },
  { $set: { lastLogin: new Date() } }
);

// What happens:
// 1. Find document using { email: 1 } index
// 2. Update document
// 3. Update indexes containing 'lastLogin': only { lastLogin: -1 }
// Time: ~2ms (1ms find + 1ms update index)


// Operation 3: Update multiple fields
await User.updateOne(
  { email: 'john@example.com' },
  { $set: { name: 'Jane Doe', age: 31, status: 'inactive' } }
);

// What happens:
// 1. Find using { email: 1 } index
// 2. Update document
// 3. Update indexes: { name: 1 }, { age: 1 }, { status: 1 }
// Time: ~4ms (1ms find + 3ms update 3 indexes)


// === INDEX OVERHEAD CALCULATION ===
// Benchmark: 10,000 inserts

// With 0 indexes (only _id default)
console.time('0-indexes');
for (let i = 0; i < 10000; i++) {
  await User.create({ email: `user${i}@example.com`, name: `User ${i}`, age: 25 });
}
console.timeEnd('0-indexes');
// Time: ~2000ms (0.2ms per insert)

// With 5 indexes
console.time('5-indexes');
for (let i = 0; i < 10000; i++) {
  await User.create({ email: `user${i}@example.com`, name: `User ${i}`, age: 25 });
}
console.timeEnd('5-indexes');
// Time: ~6000ms (0.6ms per insert)
// Overhead: 3x slower! Each index adds ~20% overhead


// With 15 indexes (over-indexed)
console.time('15-indexes');
for (let i = 0; i < 10000; i++) {
  await User.create({ email: `user${i}@example.com`, name: `User ${i}`, age: 25 });
}
console.timeEnd('15-indexes');
// Time: ~15000ms (1.5ms per insert)
// Overhead: 7.5x slower!


// === STRATEGIES TO REDUCE WRITE OVERHEAD ===
// Strategy 1: Remove redundant indexes

// ❌ Redundant indexes
UserSchema.index({ email: 1 });
UserSchema.index({ email: 1, name: 1 });
// Problem: First index is redundant (leftmost prefix rule)

// ✅ Remove redundant
UserSchema.index({ email: 1, name: 1 }); // Covers both queries


// Strategy 2: Consolidate similar indexes
// ❌ Multiple single-field indexes
ArticleSchema.index({ author: 1 });
ArticleSchema.index({ category: 1 });
ArticleSchema.index({ createdAt: -1 });

// ✅ Use compound index for common query pattern
ArticleSchema.index({ author: 1, category: 1, createdAt: -1 });
// Covers: { author }, { author, category }, { author, category, createdAt }


// Strategy 3: Partial indexes for write-heavy collections
const LogSchema = new mongoose.Schema({
  level: String,       // mostly 'info' (90%), some 'error' (10%)
  message: String,
  timestamp: Date
});

// ❌ Index everything
LogSchema.index({ level: 1, timestamp: -1 });
// 100% of writes update index

// ✅ Partial index (only errors)
LogSchema.index(
  { level: 1, timestamp: -1 },
  { partialFilterExpression: { level: 'error' } }
);
// Only 10% of writes update index
// 90% faster writes!
// Queries for 'info' logs use COLLSCAN (acceptable for rare queries)


// Strategy 4: Bulk writes with unordered inserts
// ❌ Individual inserts
for (const article of articles) {
  await Article.create(article); // Updates indexes on each insert
}
// Time: 10s for 10,000 docs

// ✅ Bulk insert
await Article.insertMany(articles, { ordered: false });
// Time: 2s for 10,000 docs
// MongoDB batches index updates


// Strategy 5: Disable indexes during bulk loads
// For very large imports
await db.articles.dropIndexes(); // Drop all except _id
await Article.insertMany(millionArticles);
await db.articles.createIndex({ author: 1, createdAt: -1 });
await db.articles.createIndex({ category: 1, views: -1 });
// Faster to rebuild indexes after bulk load


// === WRITE CONCERN IMPACT ===
const OrderSchema = new mongoose.Schema({
  orderId: String,
  customerId: String,
  amount: Number,
  status: String
});

OrderSchema.index({ customerId: 1, status: 1 });

// Write concern: { w: 1 } (default)
await Order.create(
  { orderId: '123', customerId: 'C1', amount: 100, status: 'pending' },
  { writeConcern: { w: 1 } }
);
// Waits for: Primary acknowledges write
// Time: ~2ms

// Write concern: { w: 'majority' }
await Order.create(
  { orderId: '124', customerId: 'C1', amount: 100, status: 'pending' },
  { writeConcern: { w: 'majority' } }
);
// Waits for: Majority of replica set acknowledges
// Time: ~20ms (network latency to secondaries)
// Slower but more durable


// Write concern: { w: 0 } (fire and forget)
await Order.create(
  { orderId: '125', customerId: 'C1', amount: 100, status: 'pending' },
  { writeConcern: { w: 0 } }
);
// Waits for: Nothing!
// Time: ~0.1ms
// Fastest but risky (potential data loss)


// === WRITE CONFLICTS ===
// High concurrent writes on same document cause conflicts

const ProductSchema = new mongoose.Schema({
  productId: String,
  stock: Number,
  soldCount: Number
});

ProductSchema.index({ productId: 1 });

// Multiple users buying at once
// User 1:
await Product.updateOne(
  { productId: 'P123' },
  { $inc: { stock: -1, soldCount: 1 } }
);

// User 2 (simultaneous):
await Product.updateOne(
  { productId: 'P123' },
  { $inc: { stock: -1, soldCount: 1 } }
);

// If conflict occurs, MongoDB retries automatically
// But too many conflicts hurt performance

// Solution 1: Sharding (distribute by productId)
// Solution 2: Batch updates (less frequent, larger increments)
// Solution 3: Optimistic locking with version field


// === MONITORING WRITE PERFORMANCE ===
// Check write performance metrics

const stats = await db.serverStatus();

console.log('Write metrics:');
console.log('Ops per second:', stats.opcounters.insert + stats.opcounters.update);
console.log('Write conflicts/sec:', stats.metrics.operation.writeConflicts);
console.log('Page faults/sec:', stats.extra_info.page_faults);

// High writeConflicts = too many concurrent updates on same docs
// High page_faults = working set doesn't fit in RAM


// === REAL-WORLD SCENARIO: SOCIAL MEDIA APP ===
const PostSchema = new mongoose.Schema({
  authorId: String,
  content: String,
  likes: Number,
  comments: Number,
  shares: Number,
  createdAt: Date,
  hashtags: [String]
});

// ❌ Over-indexed (slow writes)
PostSchema.index({ authorId: 1 });
PostSchema.index({ likes: -1 });
PostSchema.index({ comments: -1 });
PostSchema.index({ shares: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ authorId: 1, likes: -1 });
// 8 indexes! Every post update (like/comment) updates multiple indexes

// Write operation:
await Post.updateOne(
  { _id: postId },
  { $inc: { likes: 1 } }
);
// Updates: { likes: -1 }, { authorId: 1, likes: -1 } = 2 indexes
// Time: ~3ms per like


// ✅ Optimized (balanced for read/write)
PostSchema.index({ authorId: 1, createdAt: -1 }); // Author's timeline
PostSchema.index({ hashtags: 1, createdAt: -1 }); // Hashtag search
PostSchema.index({ likes: -1, createdAt: -1 });   // Trending posts
// 3 indexes only

// Same write operation:
await Post.updateOne

[1](https://www.reddit.com/r/mongodb/comments/14gh3tj/creating_efficient_compound_indexes_esr_rule_vs/)
[2](https://blog.jordanfokoua.dev/optimize-mongo-queries-with-esr/)
[3](https://www.mongodb.com/docs/manual/tutorial/equality-sort-range-guideline/)
[4](https://www.geeksforgeeks.org/mongodb/aggregation-pipeline-optimization/)
[5](https://www.singlestore.com/blog/the-complete-guide-to-the-mongodb-aggregate-count-stage/)
[6](https://www.mongodb.com/docs/manual/core/aggregation-pipeline-optimization/)
[7](https://www.interviewbit.com/mongodb-interview-questions/)
[8](https://www.datacamp.com/blog/mongodb-interview-questions)
[9](https://www.mydbops.com/blog/mongodb-write-conflicts)
[10](https://github.com/Devinterview-io/mongodb-interview-questions)
[11](https://www.index.dev/interview-questions/mongodb-coding-challenges)
[12](https://www.simplilearn.com/mongodb-interview-questions-and-answers-article)
[13](https://www.hirist.tech/blog/top-35-mongodb-interview-questions-and-answers/)
[14](https://www.geeksforgeeks.org/mongodb/mongodb-interview-questions/)
[15](https://www.knowledgehut.com/interview-questions/mongodb)
[16](https://www.mongodb.com/community/forums/t/aggregation-pipeline-optimization-for-complex-data-visualization/272346)
[17](https://www.mongodb.com/docs/manual/core/query-optimization/)
[18](https://www.turing.com/interview-questions/mongodb)
[19](https://www.practical-mongodb-aggregations.com/guides/performance.html)
[20](https://www.mydbops.com/blog/mongodb-rule-for-indexing-series-1)
[21](https://studio3t.com/blog/best-practices-for-optimizing-mongodb-performance/)
[22](https://www.mongodb.com/resources/products/capabilities/performance-best-practices-transactions-and-read-write-concerns)
[23](https://www.mongodb.com/docs/manual/core/replica-set-write-concern/)
[24](https://www.dragonflydb.io/faq/mongodb-writeconcern-performance)
[25](https://www.mongodb.com/docs/manual/reference/write-concern/)
[26](https://www.goavega.com/data-analytics/mongodb-write-concern-balancing-consistency-and-performance/)
[27](https://www.linkedin.com/pulse/performance-optimization-mongodb-ixscan-vs-collscan-dharmalingam-brane)
[28](https://www.solarwinds.com/blog/how-to-tell-if-your-mongodb-server-is-correctly-sized-for-your-working-set)
[29](https://www.mongodb.com/community/forums/t/why-collscan-and-ixscan-take-same-to-search-data/129804)
[30](https://www.mongodb.com/community/forums/t/how-to-analyze-mongodb-ram-usage/12108)
[31](https://www.mongodb.com/community/forums/t/majority-write-concern-with-respect-to-read-concern/208532)
[32](https://dev.to/playtomic/lets-talk-about-performance-and-mongodb-4048)
[33](https://www.mongodb.com/resources/products/capabilities/performance-best-practices-mongodb-data-modeling-and-memory-sizing)
[34](https://www.mongodb.com/community/forums/t/poor-write-perfomance-with-mongodb-5-0-8-in-a-psa-primary-secondary-arbiter-setup/163502)
[35](https://www.mongodb.com/docs/manual/reference/explain-results/)
[36](https://stackoverflow.com/questions/6453584/what-does-it-mean-to-fit-working-set-into-ram-for-mongodb)
[37](https://www.mongodb.com/docs/manual/tutorial/analyze-query-plan/)
[38](https://www.mongodb.com/community/forums/t/working-set-must-fit-in-memory/3287)
[39](https://delbridge.solutions/guide-mongodb-index-optimization/)
[40](https://www.mongodb.com/community/forums/t/mongodb-consuming-all-available-memory/216360)