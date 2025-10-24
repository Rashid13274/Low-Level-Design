// Query: { inStock: true, category: 'electronics' }
// Step 1: inStock: true filters to 600,000 products (60% of data!)
// Step 2: category: 'electronics' filters to 100,000
// Poor selectivity early

// === GOOD INDEX (High cardinality first) ===
ProductSchema.index({ category: 1, inStock: 1 });

// Query: { inStock: true, category: 'electronics' }
// Step 1: category: 'electronics' filters to 100,000 (10% of data)
// Step 2: inStock: true filters to ~60,000
// Better selectivity early

// === OPTIMAL ORDERING RULES ===
// 1. Equality filters (most selective first)
// 2. Sort fields
// 3. Range filters

// Example: E-commerce query
// Query: find({ status: 'active', category: 'electronics', price: { $gte: 100 } })
//        .sort({ createdAt: -1 })

// Cardinality:
// - status: 3 values (active, inactive, deleted)
// - category: 20 values
// - price: continuous (high cardinality)
// - createdAt: very high cardinality

// Optimal index: { category: 1, status: 1, createdAt: -1, price: 1 }
// Reasoning:
// 1. category (equality, higher cardinality than status)
// 2. status (equality, lower cardinality)
// 3. createdAt (sort field)
// 4. price (range filter last)

ProductSchema.index({ category: 1, status: 1, createdAt: -1, price: 1 });

// === MEASURING CARDINALITY ===
// Get distinct count for fields
const categoryCount = await Product.distinct('category').length;
const stockCount = await Product.distinct('inStock').length;

console.log('category cardinality:', categoryCount); // 10
console.log('inStock cardinality:', stockCount);     // 2

// Aggregation to check distribution
const distribution = await Product.aggregate([
  { $group: { _id: '$category', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);

console.log(distribution);
// [
//   { _id: 'electronics', count: 100000 },
//   { _id: 'books', count: 100000 },
//   ...
// ]

// === REAL-WORLD EXAMPLES ===
// Example 1: User queries
const UserSchema = new mongoose.Schema({
  email: String,        // Unique (1M values)
  status: String,       // 3 values (active, inactive, suspended)
  role: String,         // 5 values (user, admin, moderator, etc.)
  country: String,      // 195 values
  createdAt: Date       // High cardinality
});

// Common query: Active users in a country, sorted by join date
// find({ status: 'active', country: 'US' }).sort({ createdAt: -1 })

// Cardinality analysis:
// - country: 195 values → filters to ~5,000 users (0.5%)
// - status: 3 values → filters to ~333,000 users (33%)
// - createdAt: sort field

// Optimal index:
UserSchema.index({ country: 1, status: 1, createdAt: -1 });
// country first (more selective), then status, then sort field

// Example 2: Blog posts
const PostSchema = new mongoose.Schema({
  published: Boolean,    // 2 values
  category: String,      // 15 values
  author: ObjectId,      // 10,000 values (many authors)
  views: Number,         // High cardinality
  createdAt: Date        // Very high cardinality
});

// Query: Published posts by author, sorted by views
// find({ published: true, author: authorId }).sort({ views: -1 })

// Optimal index: { author: 1, published: 1, views: -1 }
// - author: very selective (10k authors → ~100 posts per author)
// - published: less selective but needed
// - views: sort field

PostSchema.index({ author: 1, published: 1, views# MongoDB Interview MCQs - Comprehensive Guide

## Section 1: MongoDB Basics & CRUD Operations (10 Questions)

### Q1: Document Structure and _id Field

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String
});

const User = mongoose.model('User', userSchema);

// Creating users
await User.create({ name: 'Alice', email: 'alice@example.com' });
await User.create({ _id: '507f1f77bcf86cd799439011', name: 'Bob', email: 'bob@example.com' });
```

**Question:** What happens if you try to insert another document with `_id: '507f1f77bcf86cd799439011'`?

A) The new document overwrites the existing one  
B) A duplicate key error is thrown  
C) MongoDB auto-generates a new _id  
D) The document is silently rejected

**Answer: B) A duplicate key error is thrown**

**Explanation:**
The `_id` field is the primary key in MongoDB and must be unique within a collection. Attempting to insert a duplicate `_id` throws a `E11000 duplicate key error`.

**Key Concepts:**
```javascript
// MongoDB automatically generates ObjectId if _id not provided
const user1 = await User.create({ name: 'Alice' });
console.log(user1._id); // ObjectId("507f1f77bcf86cd799439011")

// You can provide custom _id (any type: string, number, ObjectId)
const user2 = await User.create({ _id: 1, name: 'Bob' });
const user3 = await User.create({ _id: 'custom-id', name: 'Charlie' });

// Attempting duplicate _id throws error
try {
  await User.create({ _id: 1, name: 'Dave' });
} catch (err) {
  console.error('E11000 duplicate key error');
}

// ObjectId structure (12 bytes):
// - 4 bytes: Unix timestamp
// - 5 bytes: Random value
// - 3 bytes: Incrementing counter
const objectId = new mongoose.Types.ObjectId();
console.log(objectId.getTimestamp()); // Returns creation time
```

---

### Q2: findOne vs find Behavior

```javascript
const Product = mongoose.model('Product', new mongoose.Schema({
  name: String,
  price: Number,
  inStock: Boolean
}));

// Query execution
const result1 = await Product.findOne({ inStock: true });
const result2 = await Product.find({ inStock: true });
const result3 = await Product.findOne({ inStock: false });
```

**Question:** If no documents match the query, what does each method return?

A) findOne: null, find: [], findOne (no match): null  
B) findOne: undefined, find: null, findOne (no match): undefined  
C) All return empty array []  
D) All throw "Document not found" error

**Answer: A) findOne: null, find: [], findOne (no match): null**

**Explanation:**
- `findOne()` returns a **single document** or **null** if nothing found
- `find()` returns an **array** (empty array if nothing found)
- This is a common source of bugs when developers expect an array from `findOne()`

**Common Pitfalls:**
```javascript
// WRONG - findOne returns object, not array
const user = await User.findOne({ email: 'test@example.com' });
if (user.length > 0) { // TypeError: Cannot read property 'length' of null
  console.log('Found');
}

// CORRECT
const user = await User.findOne({ email: 'test@example.com' });
if (user) { // Check if object exists
  console.log('Found:', user.name);
}

// find() always returns array
const users = await User.find({ role: 'admin' });
console.log(users.length); // 0 if no matches, safe to use

// Handling both cases
const result = await User.findOne({ email });
if (!result) {
  return res.status(404).json({ error: 'User not found' });
}

// findById also returns null if not found
const user = await User.findById('invalid-id');
console.log(user); // null

// Using orFail() to throw error instead of returning null
try {
  const user = await User.findOne({ email }).orFail();
  // user is guaranteed to exist here
} catch (err) {
  console.log('Document not found');
}
```

---

### Q3: Update Operations - updateOne vs findOneAndUpdate

```javascript
const Order = mongoose.model('Order', new mongoose.Schema({
  orderId: String,
  status: String,
  total: Number
}));

// Scenario: Update order status
const result1 = await Order.updateOne(
  { orderId: 'ORD123' },
  { $set: { status: 'shipped' } }
);

const result2 = await Order.findOneAndUpdate(
  { orderId: 'ORD123' },
  { $set: { status: 'delivered' } }
);
```

**Question:** What does each operation return?

A) Both return the updated document  
B) updateOne: { acknowledged: true, matchedCount: 1, modifiedCount: 1 }, findOneAndUpdate: original document  
C) updateOne: null, findOneAndUpdate: updated document  
D) Both return { success: true }

**Answer: B) updateOne returns write result, findOneAndUpdate returns original document by default**

**Explanation:**
- `updateOne()` returns operation metadata (matched, modified count)
- `findOneAndUpdate()` returns the **document** (original by default)
- Use `{ new: true }` option to return updated document

**Detailed Comparison:**
```javascript
// updateOne - returns metadata, not document
const result = await Order.updateOne(
  { orderId: 'ORD123' },
  { $set: { status: 'shipped' } }
);
console.log(result);
// {
//   acknowledged: true,
//   matchedCount: 1,    // How many documents matched
//   modifiedCount: 1,   // How many were actually modified
//   upsertedCount: 0,
//   upsertedId: null
// }

// You DON'T get the document back
console.log(result.status); // undefined

// findOneAndUpdate - returns document (old version by default)
const order = await Order.findOneAndUpdate(
  { orderId: 'ORD123' },
  { $set: { status: 'delivered' } }
);
console.log(order.status); // 'shipped' (old value!)

// Get NEW document with { new: true }
const updatedOrder = await Order.findOneAndUpdate(
  { orderId: 'ORD123' },
  { $set: { status: 'completed' } },
  { new: true } // Return updated document
);
console.log(updatedOrder.status); // 'completed' (new value)

// updateMany - updates multiple documents
const result = await Order.updateMany(
  { status: 'pending' },
  { $set: { status: 'processing' } }
);
console.log(result.modifiedCount); // Number of updated documents

// When to use which:
// 1. Use updateOne/updateMany when you don't need the document back (better performance)
// 2. Use findOneAndUpdate when you need the document for response/logging
// 3. Use findOneAndUpdate with { new: true } for typical REST API updates

// Real-world example - increment view count
const result = await Article.updateOne(
  { slug: 'mongodb-guide' },
  { $inc: { views: 1 } }
);
// Don't need document, just update - use updateOne

// Real-world example - user profile update
const updatedUser = await User.findOneAndUpdate(
  { _id: userId },
  { $set: { name, email } },
  { new: true, runValidators: true }
);
res.json(updatedUser); // Send back to client - use findOneAndUpdate
```

---

### Q4: Delete Operations and Return Values

```javascript
const Comment = mongoose.model('Comment', new mongoose.Schema({
  postId: String,
  text: String,
  userId: String
}));

// Delete operations
const result1 = await Comment.deleteOne({ _id: commentId });
const result2 = await Comment.findByIdAndDelete(commentId);
const result3 = await Comment.deleteMany({ postId: 'POST123' });
```

**Question:** What happens if the document doesn't exist?

A) All throw "Document not found" error  
B) deleteOne returns { deletedCount: 0 }, findByIdAndDelete returns null, deleteMany returns { deletedCount: 0 }  
C) All return null  
D) All return { success: false }

**Answer: B) Returns metadata with 0 count or null, no error thrown**

**Explanation:**
MongoDB delete operations don't throw errors when documents don't exist. They return metadata or null to indicate nothing was deleted.

**Delete Operations in Detail:**
```javascript
// deleteOne - returns metadata
const result = await Comment.deleteOne({ _id: 'non-existent-id' });
console.log(result);
// {
//   acknowledged: true,
//   deletedCount: 0  // Document didn't exist
// }

// Check if deletion was successful
if (result.deletedCount === 0) {
  return res.status(404).json({ error: 'Comment not found' });
}

// findByIdAndDelete - returns the deleted document or null
const deletedComment = await Comment.findByIdAndDelete('non-existent-id');
console.log(deletedComment); // null

if (!deletedComment) {
  return res.status(404).json({ error: 'Comment not found' });
}

// Return deleted document to client
res.json({ message: 'Deleted', comment: deletedComment });

// deleteMany - deletes multiple documents
const result = await Comment.deleteMany({ postId: 'POST123' });
console.log(result.deletedCount); // Number of deleted documents (could be 0)

// findOneAndDelete - similar to findByIdAndDelete
const deleted = await Comment.findOneAndDelete({ text: 'spam' });
console.log(deleted); // Document or null

// Real-world patterns
// Pattern 1: Delete with existence check
async function deleteComment(commentId, userId) {
  const comment = await Comment.findById(commentId);
  
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  if (comment.userId !== userId) {
    throw new Error('Unauthorized');
  }
  
  await comment.deleteOne();
  return comment;
}

// Pattern 2: Soft delete (preferred in production)
const CommentSchema = new mongoose.Schema({
  text: String,
  userId: String,
  deletedAt: { type: Date, default: null }
});

CommentSchema.methods.softDelete = async function() {
  this.deletedAt = new Date();
  await this.save();
};

// Query helper to exclude deleted
CommentSchema.query.notDeleted = function() {
  return this.where({ deletedAt: null });
};

// Usage
await comment.softDelete();
const activeComments = await Comment.find().notDeleted();

// Pattern 3: Cascade delete
const PostSchema = new mongoose.Schema({
  title: String,
  content: String
});

PostSchema.pre('deleteOne', { document: true, query: false }, async function() {
  // Delete all comments when post is deleted
  await Comment.deleteMany({ postId: this._id });
});
```

---

### Q5: Query Operators and Data Types

```javascript
const Product = mongoose.model('Product', new mongoose.Schema({
  name: String,
  price: Number,
  tags: [String],
  createdAt: Date
}));

// Query with different operators
const result1 = await Product.find({ price: { $gt: 100 } });
const result2 = await Product.find({ price: { $gt: '100' } });
const result3 = await Product.find({ tags: 'electronics' });
const result4 = await Product.find({ tags: ['electronics'] });
```

**Question:** Which queries will work as expected?

A) All queries work the same  
B) result1 and result3 work correctly  
C) Only result1 works correctly  
D) result2 and result4 fail with errors

**Answer: B) result1 and result3 work correctly**

**Explanation:**
- MongoDB does **type-sensitive comparisons**: `100` ≠ `'100'`
- For arrays, use single element to check if array contains it
- Matching exact array requires exact order

**Query Operators Deep Dive:**
```javascript
// Comparison Operators
// $gt, $gte, $lt, $lte - MUST match data type
await Product.find({ price: { $gt: 100 } }); // Correct
await Product.find({ price: { $gt: '100' } }); // Won't match numeric prices!

// $eq and $ne
await Product.find({ price: { $eq: 100 } }); // Same as { price: 100 }
await Product.find({ price: { $ne: 100 } }); // Not equal to 100

// $in and $nin - check if value in array
await Product.find({ 
  category: { $in: ['electronics', 'computers'] } 
});

await Product.find({ 
  status: { $nin: ['deleted', 'banned'] } 
});

// Array Query Operators
// Single element - checks if array CONTAINS this element
await Product.find({ tags: 'electronics' }); 
// Matches: { tags: ['electronics', 'gadgets'] }

// Exact array - must match exactly (order matters!)
await Product.find({ tags: ['electronics'] });
// Only matches: { tags: ['electronics'] }
// Does NOT match: { tags: ['electronics', 'gadgets'] }

// $all - array must contain ALL specified elements (order doesn't matter)
await Product.find({ 
  tags: { $all: ['electronics', 'sale'] } 
});
// Matches: { tags: ['electronics', 'sale', 'new'] }
// Matches: { tags: ['sale', 'electronics'] }

// $elemMatch - complex array queries
await Order.find({
  items: {
    $elemMatch: { 
      product: 'laptop',
      quantity: { $gte: 2 }
    }
  }
});

// $size - array length
await Product.find({ tags: { $size: 3 } }); // Exactly 3 tags

// Logical Operators
// $and - all conditions must match
await Product.find({
  $and: [
    { price: { $gt: 100 } },
    { price: { $lt: 1000 } }
  ]
});
// Simpler: await Product.find({ price: { $gt: 100, $lt: 1000 } });

// $or - any condition matches
await Product.find({
  $or: [
    { category: 'electronics' },
    { tags: 'featured' }
  ]
});

// $nor - none of the conditions match
await Product.find({
  $nor: [
    { status: 'deleted' },
    { status: 'banned' }
  ]
});

// $not - inverts the condition
await Product.find({ 
  price: { $not: { $gt: 100 } } 
}); // price <= 100 or doesn't exist

// Existence and Type
// $exists - check if field exists
await Product.find({ discount: { $exists: true } });
await Product.find({ discount: { $exists: false } }); // No discount field

// $type - check field type
await Product.find({ price: { $type: 'number' } });
await Product.find({ price: { $type: 'string' } });

// Common Pitfall: String vs Number comparison
const Product = mongoose.model('Product', {
  price: Number // Defined as Number
});

await Product.create({ price: 100 });
await Product.create({ price: '200' }); // Mongoose converts to 200

// This finds both because Mongoose ensures type
await Product.find({ price: { $gt: 50 } }); // Returns both

// BUT in raw MongoDB (if types are mixed):
db.products.find({ price: { $gt: 50 } }); // Only finds numeric prices
db.products.find({ price: { $gt: '50' } }); // Only finds string prices

// Best Practice: Always ensure consistent types
const productSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true,
    min: 0
  }
});
```

---

### Q6: Projection and Field Selection

```javascript
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date
}));

// Different projection methods
const user1 = await User.findOne({ email: 'test@example.com' })
  .select('name email');

const user2 = await User.findOne({ email: 'test@example.com' })
  .select('-password');

const user3 = await User.findOne({ email: 'test@example.com' })
  .select('name -_id');
```

**Question:** What fields does each query return?

A) user1: name & email only, user2: all except password, user3: only name  
B) user1: name, email & _id, user2: all except password, user3: name & _id  
C) user1: name, email & _id, user2: all except password & _id, user3: only name  
D) All return all fields

**Answer: C) _id is always included unless explicitly excluded**

**Explanation:**
- Positive projection (`'name email'`): Only specified fields + **_id**
- Negative projection (`'-password'`): All fields except specified
- `_id` is special: always included unless you use `-_id`

**Projection Patterns:**
```javascript
// 1. Inclusive projection (whitelist)
const user = await User.findOne({ email })
  .select('name email role');
console.log(user);
// { _id: '...', name: 'Alice', email: 'alice@example.com', role: 'user' }
// Note: _id is ALWAYS included

// 2. Exclude _id explicitly
const user = await User.findOne({ email })
  .select('name email -_id');
console.log(user);
// { name: 'Alice', email: 'alice@example.com' }

// 3. Exclusive projection (blacklist)
const user = await User.findOne({ email })
  .select('-password -__v');
console.log(user);
// { _id: '...', name: 'Alice', email: '...', role: '...', createdAt: '...' }
// Everything except password and __v

// 4. Cannot mix inclusive and exclusive (except for -_id)
// WRONG
await User.find().select('name -password'); // Error!

// CORRECT
await User.find().select('name email -_id'); // OK, -_id is exception

// Schema-level projection
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { 
    type: String,
    select: false // Never returned by default
  },
  resetToken: {
    type: String,
    select: false
  }
});

// password not returned
const user = await User.findOne({ email });
console.log(user.password); // undefined

// Explicitly include it when needed
const userWithPassword = await User.findOne({ email })
  .select('+password');
console.log(userWithPassword.password); // 'hashed_password'

// Real-world API pattern
// Public user profile (minimal fields)
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name email avatar createdAt');
  res.json(user);
});

// Current user (more fields, but not sensitive ones)
app.get('/me', async (req, res) => {
  const user = await User.findById(req.userId)
    .select('-password -resetToken');
  res.json(user);
});

// Authentication (need password)
app.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
    .select('+password');
  
  if (!user || !await bcrypt.compare(req.body.password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Remove password before sending response
  user.password = undefined;
  res.json({ user, token: generateToken(user._id) });
});

// Lean queries (return plain JS objects, not Mongoose documents)
const users = await User.find()
  .select('name email')
  .lean(); // Faster, but no Mongoose methods

console.log(users[0].save); // undefined (no Mongoose methods)
```

---

### Q7: Sort and Limit Operations

```javascript
const Post = mongoose.model('Post', new mongoose.Schema({
  title: String,
  views: Number,
  createdAt: Date
}));

// Query execution order
const posts = await Post.find({ status: 'published' })
  .limit(10)
  .sort({ createdAt: -1 })
  .skip(20);
```

**Question:** In what order does MongoDB execute these operations?

A) find → limit → sort → skip  
B) find → sort → skip → limit  
C) Order doesn't matter in MongoDB  
D) find → skip → limit → sort

**Answer: B) find → sort → skip → limit**

**Explanation:**
MongoDB **always** executes in this order regardless of how you chain the methods:
1. Query filter (find)
2. Sort
3. Skip
4. Limit

This is crucial for pagination performance.

**Sorting and Pagination Deep Dive:**
```javascript
// Sorting
// 1 = ascending, -1 = descending
await Post.find().sort({ createdAt: -1 }); // Newest first
await Post.find().sort({ createdAt: 1 });  // Oldest first

// Multiple sort fields
await Post.find().sort({ views: -1, createdAt: -1 });
// Sort by views (high to low), then by date for ties

// String syntax
await Post.find().sort('-createdAt'); // Descending
await Post.find().sort('title');      // Ascending
await Post.find().sort('-views createdAt'); // Multiple

// Pagination Pattern 1: Offset-based (skip/limit)
async function getPostsPage(page = 1, pageSize = 10) {
  const skip = (page - 1) * pageSize;
  
  const posts = await Post.find({ status: 'published' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
  
  const total = await Post.countDocuments({ status: 'published' });
  
  return {
    posts,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    total
  };
}

// Problem with skip(): Gets SLOW with large offsets
await Post.find().skip(10000).limit(10); // Very slow!
// MongoDB still has to scan 10,000 documents

// Pagination Pattern 2: Cursor-based (RECOMMENDED for large datasets)
async function getPostsCursor(lastPostId = null, limit = 10) {
  const query = { status: 'published' };
  
  if (lastPostId) {
    query._id = { $lt: lastPostId }; // Get posts before this ID
  }
  
  const posts = await Post.find(query)
    .sort({ _id: -1 }) // Sort by _id for consistency
    .limit(limit);
  
  return {
    posts,
    nextCursor: posts.length > 0 ? posts[posts.length - 1]._id : null,
    hasMore: posts.length === limit
  };
}

// Client usage:
// Page 1: GET /posts?limit=10
// Page 2: GET /posts?cursor=507f1f77bcf86cd799439011&limit=10

// Pagination Pattern 3: Timestamp-based (for time-ordered data)
async function getRecentPosts(before = null, limit = 10) {
  const query = { status: 'published' };
  
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  
  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
  
  return {
    posts,
    nextBefore: posts.length > 0 ? posts[posts.length - 1].createdAt : null
  };
}

// Execution order demonstration
const query = Post.find({ status: 'published' })
  .limit(5)        // Written first
  .sort({ views: -1 })   // Written second
  .skip(10);      // Written third

// But executes as:
// 1. Find all published posts
// 2. Sort by views (descending)
// 3. Skip first 10
// 4. Take next 5

// Performance tip: Use indexes for sorted fields
PostSchema.index({ createdAt: -1 });
PostSchema.index({ status: 1, createdAt: -1 }); // Compound index

// Count total (for pagination metadata)
const total = await Post.countDocuments({ status: 'published' });

// Faster estimate for large collections (less accurate)
const estimate = await Post.estimatedDocumentCount();

// Real-world pagination endpoint
app.get('/posts', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100
  const skip = (page - 1) * limit;
  
  const [posts, total] = await Promise.all([
    Post.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content') // Don't send full content in list
      .lean(),
    Post.countDocuments({ status: 'published' })
  ]);
  
  res.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
});
```

---

### Q8: Embedded Documents vs References

```javascript
// Pattern 1: Embedded documents
const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  items: [{
    productName: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number
});

// Pattern 2: Referenced documents
const OrderSchema2 = new mongoose.Schema({
  orderNumber: String,
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  totalAmount: Number
});
```

**Question:** Which approach is better for an e-commerce order system?

A) Always use embedded documents  
B) Always use references  
C) Embedded for order items (snapshot), references for user data  
D) It doesn't matter, both are the same

**Answer: C) Embedded for order items (snapshot), references for user data**

**Explanation:**
- **Embed** when: Data doesn't change, 1-to-few relationship, data accessed together
- **Reference** when: Data changes frequently, 1-to-many or many-to-many, data shared across documents

**Embedded vs Referenced - Complete Guide:**
```javascript
// ===  EMBEDDED DOCUMENTS (Denormalized) ===
const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  customer: {
    name: String,
    email: String,
    address: String
  },
  items: [{
    productName: String,
    productId: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  createdAt: Date
});

// Pros:
// 1. Single query to get everything
// 2. Atomic updates (all or nothing)
// 3. Better read performance

// Cons:
// 1. Data duplication
// 2. If product price changes, old orders show old price (usually desired!)
// 3. Document size limit (16MB)

// Use when:
// - Data doesn't change (order snapshot)
// - 1-to-few relationship (not 1-to-millions)
// - Data always accessed together

const order = await Order.findById(orderId);
console.log(order.items); // All items immediately available

// === REFERENCED DOCUMENTS (Normalized) ===
const UserSchema = new mongoose.Schema({
  name: String,
  email: String
});

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
});

// Pros:
// 1. No data duplication
// 2. Always current data
// 3. Smaller documents

// Cons:
// 1. Requires populate (additional query)
// 2. Slower reads
// 3. No atomic updates across documents

// Use when:
// - Data changes frequently
// - Many-to-many relationships
// - Data reused across many documents

// Query with populate
const post = await Post.findById(postId)
  .populate('author') // Single reference
  .populate('comments'); // Array of references

console.log(post.author.name); // Populated user data

// Selective population
await Post.findById(postId)
  .populate('author', 'name email') // Only these fields
  .populate({
    path: 'comments',
    select: 'text createdAt',
    options: { sort: { createdAt: -1 }, limit: 10 }
  });

// === HYBRID APPROACH (Best Practice) ===
const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  // Embed frequently accessed, non-changing data
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    avatar: String
  },
  // Reference for full user data
  authorRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
});

// Quick queries don't need populate
const posts = await Post.find().select('title author.name');
// Has author name immediately

// Full details when needed
const post = await Post.findById(postId)
  .populate('authorRef'); // Get full user profile

// Real-world example: E-commerce order
const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  
  // EMBEDDED: Snapshot of customer at time of order
  customer: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    shippingAddress: {
      street: String,
      city: String,
      zipCode: String
    }
  },
  
  // EMBEDDED: Snapshot of products at time of purchase
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    sku: String,
    price: Number,      // Price at time of purchase
    quantity: Number,
    subtotal: Number
  }],
  
  // Calculated fields
  subtotal: Number,
  tax: Number,
  shipping: Number,
  totalAmount: Number,
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  },
  
  createdAt: { type: Date, default: Date.now }
});

// When creating order, snapshot current data
async function createOrder(userId, cartItems) {
  const user = await User.findById(userId);
  const productIds = cartItems.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  
  const order = new Order({
    orderNumber: generateOrderNumber(),
    customer: {
      userId: user._id,
      name: user.name,
      email: user.email,
      shippingAddress: user.defaultAddress
    },
    items: cartItems.map(item => {
      const product = products.find(p => p._id.equals(item.productId));
      return {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price, // Current price
        quantity: item.quantity,
        subtotal: product.price * item.quantity
      };
    }),
    // ... calculate totals
  });
  
  await order.save();
  return order;
}
```

---

### Q9: Null, Undefined, and Field Existence

```javascript
const Product = mongoose.model('Product', new mongoose.Schema({
  name: String,
  description: String,
  discount: Number
}));

await Product.create({ name: 'Product A', description: 'Desc', discount: null });
await Product.create({ name: 'Product B', description: 'Desc' });
await Product.create({ name: 'Product C', description: 'Desc', discount: 0 });

const result1 = await Product.find({ discount: null });
const result2 = await Product.find({ discount: { $exists: false } });
const result3 = await Product.find({ discount: { $ne: null } });
```

**Question:** Which products does each query return?

A) result1: A & B, result2: B, result3: C  
B) result1: A only, result2: B only, result3: B & C  
C) result1: B only, result2: A & B, result3: C only  
D) All return the same results

**Answer: A) result1: A & B, result2: B, result3: C**

**Explanation:**
- `{ field: null }` matches both `null` values AND missing fields
- `{ field: { $exists: false } }` matches only missing fields
- `{ field: { $ne: null } }` matches fields that exist and are not null

**Null vs Undefined vs Missing Fields:**
```javascript
// Three different states
await Product.create({ name: 'A', discount: null });     // null
await Product.create({ name: 'B' });                     // missing field
await Product.create({ name: 'C', discount: undefined }); // Mongoose converts to missing

// Query: { discount: null }
// Matches: Product A (null) AND Product B (missing)
const products = await Product.find({ discount: null });
console.log(products.length); // 2

// Query: { discount: { $exists: false } }
// Matches ONLY: Product B (missing field)
const products = await Product.find({ discount: { $exists: false } });
console.log(products.length); // 1

// Query: { discount: { $exists: true } }
// Matches: Product A (has field, even though null)
const products = await Product.find({ discount: { $exists: true } });
console.log(products.length); // 1

// Query: { discount: { $ne: null } }
// Matches: Fields that exist AND are not null
// Product C (discount: 0) matches
const products = await Product.find({ discount: { $ne: null } });

// Real-world patterns
// Find products WITH discount (not null, not missing)
await Product.find({
  discount: { $ne: null, $exists: true, $gt: 0 }
});

// Find products WITHOUT discount
await Product.find({
  $or: [
    { discount: null },
    { discount: { $exists: false } },
    { discount: 0 }
  ]
});

// Better schema design with defaults
const ProductSchema = new mongoose.Schema({
  name: String,
  discount: {
    type: Number,
    default: 0 // Always have a value
  }
});

// Now simple queries work
await Product.find({ discount: 0 }); // Products without discount
await Product.find({ discount: { $gt: 0 } }); // Products with discount

// Optional fields pattern
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: { type: String, default: null }, // Explicit null instead of missing
  avatar: { type: String, default: null }
});

// Consistent behavior
const user = await User.findById(userId);
console.log(user.bio); // null (not undefined)

// Check if field has value
if (user.bio) {
  // Has bio
}

// Mongoose schema with required fields
const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  // Optional field - can be null or missing
  trackingNumber: String,
  // Optional with default
  status: { type: String, default: 'pending' }
});

// Validation
const order = new Order({ orderNumber: 'ORD123' });
await order.save(); // OK

const order2 = new Order({});
await order2.save(); // Error: orderNumber is required
```

---

### Q10: Upsert Operations

```javascript
const Counter = mongoose.model('Counter', new mongoose.Schema({
  name: String,
  count: { type: Number, default: 0 }
}));

// Increment counter, create if doesn't exist
const result = await Counter.findOneAndUpdate(
  { name: 'pageViews' },
  { $inc: { count: 1 } },
  { upsert: true, new: true }
);
```

**Question:** What happens on the first call when the document doesn't exist?

A) Error: document not found  
B) Creates document with count: 1  
C) Creates document with count: 0, then increments to 1  
D) Returns null

**Answer: B) Creates document with count: 1**

**Explanation:**
With `upsert: true`, if document doesn't exist:
1. Creates new document with query filter fields
2. Applies the update operations
3. Returns the new document (if `new: true`)

**Upsert Patterns and Gotchas:**
```javascript
// Basic upsert
const result = await Counter.findOneAndUpdate(
  { name: 'pageViews' },      // Query
  { $inc: { count: 1 } },     // Update
  { 
    upsert: true,   // Create if doesn't exist
    new: true       // Return updated document
  }
);

// First call (doesn't exist):
// Creates: { name: 'pageViews', count: 1 }
// Returns: { _id: '...', name: 'pageViews', count: 1 }

// Second call (exists):
// Updates: count from 1 to 2
// Returns: { _id: '...', name: 'pageViews', count: 2 }

// GOTCHA 1: $setOnInsert - only sets on insert
const result = await User.findOneAndUpdate(
  { email: 'user@example.com' },
  {
    $set: { lastLogin: new Date() },        // Always update
    $setOnInsert: { createdAt: new Date() } // Only on insert
  },
  { upsert: true, new: true }
);

// First call: Sets both lastLogin and createdAt
// Subsequent calls: Only updates lastLogin

// GOTCHA 2: Query conditions are included in new document
const result = await Product.findOneAndUpdate(
  { sku: 'LAPTOP-001', category: 'electronics' },
  { $set: { price: 999 } },
  { upsert: true, new: true }
);
// Creates: { sku: 'LAPTOP-001', category: 'electronics', price: 999 }

// GOTCHA 3: $inc with default values
const schema = new mongoose.Schema({
  name: String,
  count: { type: Number, default: 0 }
});

// Upsert with $inc
await Counter.findOneAndUpdate(
  { name: 'test' },
  { $inc: { count: 5 } },
  { upsert: true }
);
// Creates: { name: 'test', count: 5 } (not 0 + 5)
// $inc starts from 0 if field missing

// Real-world pattern: User activity tracking
async function trackUserActivity(userId, activity) {
  await UserStats.findOneAndUpdate(
    { userId },
    {
      $inc: { [`activities.${activity}`]: 1 },
      $set: { lastActive: new Date() },
      $setOnInsert: { 
        userId,
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
}

// First call creates:
// {
//   userId: '123',
//   activities: { login: 1 },
//   lastActive: ISODate(...),
//   createdAt: ISODate(...)
// }

// Subsequent calls update:
// activities.login: 2, 3, 4...
// lastActive: updated each time
// createdAt: unchanged

// Pattern: Prevent duplicate submissions
async function submitVote(userId, pollId, choice) {
  const result = await Vote.findOneAndUpdate(
    { userId, pollId },
    {
      $set: { choice },
      $setOnInsert: { 
        userId,
        pollId,
        votedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );
  
  // Check if this was a new vote or update
  const isNewVote = result.votedAt.getTime() === new Date().getTime();
  
  return { vote: result, isNewVote };
}

// Pattern: Idempotent operations
async function recordPayment(orderId, paymentData) {
  const payment = await Payment.findOneAndUpdate(
    { 
      orderId,
      transactionId: paymentData.transactionId 
    },
    {
      $set: {
        amount: paymentData.amount,
        status: 'completed',
        processedAt: new Date()
      },
      $setOnInsert: {
        orderId,
        transactionId: paymentData.transactionId,
        createdAt: new Date()
      }
    },
    { upsert: true, new: true }
  );
  
  return payment;
}
// Safe to call multiple times - won't create duplicates

// updateOne with upsert (doesn't return document)
const result = await Counter.updateOne(
  { name: 'visits' },
  { $inc: { count: 1 } },
  { upsert: true }
);

console.log(result);
// {
//   acknowledged: true,
//   matchedCount: 0,      // Didn't exist
//   modifiedCount: 0,     // New doc, not modified
//   upsertedCount: 1,     // Created
//   upsertedId: ObjectId('...')
// }
```

---


