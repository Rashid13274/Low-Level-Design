
# 🔹 MongoDB MCQs (Operators, Queries, Aggregation)

---

### **Basic Queries & Operators**

**Q1.** Which operator is used to match documents where a field equals a specified value?
a) `$eq`
b) `$match`
c) `$where`
d) `$in`

✅ **Answer: a – $eq**
📘 `$eq` matches documents where the field is equal to a given value.

---

**Q2.** Which operator is used to match values within an array of possible values?
a) `$all`
b) `$eq`
c) `$in`
d) `$exists`

✅ **Answer: c – $in**
📘 `$in: [val1, val2]` matches if the field matches **any** of the listed values.

---

**Q3.** Which operator is used to test if a field exists or not?
a) `$eq`
b) `$exists`
c) `$ne`
d) `$match`

✅ **Answer: b – $exists**
📘 Example: `{ field: { $exists: true } }`

---

**Q4.** Which operator is used to check if the field’s value is **not equal** to something?
a) `$eq`
b) `$gte`
c) `$ne`
d) `$not`

✅ **Answer: c – $ne**
📘 `$ne` means “not equal.”

---

**Q5.** Which operator checks for multiple conditions where all must be true?
a) `$or`
b) `$nor`
c) `$and`
d) `$all`

✅ **Answer: c – $and**
📘 `$and: [{condition1}, {condition2}]`.

---

### **Array Operators**

**Q6.** Which operator matches if an array contains **all specified elements**?
a) `$all`
b) `$in`
c) `$elemMatch`
d) `$nin`

✅ **Answer: a – $all**
📘 Example: `{ tags: { $all: ["red", "blue"] } }`.

---

**Q7.** Which operator allows matching documents with at least one element satisfying multiple conditions?
a) `$all`
b) `$in`
c) `$elemMatch`
d) `$size`

✅ **Answer: c – $elemMatch**
📘 Useful when array elements are objects.

---

**Q8.** Which operator matches documents where an array has a specific length?
a) `$len`
b) `$count`
c) `$size`
d) `$length`

✅ **Answer: c – $size**
📘 Example: `{ items: { $size: 3 } }`.

---

### **Comparison Operators**

**Q9.** Which operator matches values **greater than or equal to**?
a) `$gt`
b) `$gte`
c) `$lte`
d) `$eq`

✅ **Answer: b – $gte**

---

**Q10.** Which operator matches values **less than**?
a) `$lte`
b) `$gt`
c) `$lt`
d) `$gte`

✅ **Answer: c – $lt`**

---

### **Aggregation Framework**

**Q11.** Which stage is used to filter documents in an aggregation pipeline?
a) `$group`
b) `$project`
c) `$match`
d) `$lookup`

✅ **Answer: c – $match**
📘 `$match` works like `find()` inside aggregation.

---

**Q12.** Which stage is used to reshape documents (include/exclude fields, computed values)?
a) `$group`
b) `$project`
c) `$match`
d) `$sort`

✅ **Answer: b – $project**

---

**Q13.** Which stage is used to group documents by a key and calculate aggregates like `sum`, `avg`?
a) `$group`
b) `$project`
c) `$lookup`
d) `$match`

✅ **Answer: a – $group**
📘 Example: `{ $group: { _id: "$category", total: { $sum: 1 } } }`.

---

**Q14.** Which operator is used to join collections in aggregation?
a) `$group`
b) `$lookup`
c) `$unionWith`
d) `$match`

✅ **Answer: b – $lookup**
📘 `$lookup` performs a left outer join.

---

**Q15.** Which aggregation stage sorts documents?
a) `$project`
b) `$sort`
c) `$order`
d) `$limit`

✅ **Answer: b – $sort**

---

### **Indexing & Performance**

**Q16.** Which type of index ensures uniqueness of field values?
a) Sparse index
b) Unique index
c) Compound index
d) Multikey index

✅ **Answer: b – Unique index**

---

**Q17.** Which index type is created when indexing an array field?
a) Compound index
b) Sparse index
c) Multikey index
d) Clustered index

✅ **Answer: c – Multikey index**
📘 MongoDB automatically creates multikey indexes on arrays.

---

**Q18.** Which query operator **prevents scanning the entire collection** and makes use of indexes efficiently?
a) `$where`
b) `$text`
c) `$eq`
d) `$regex`

✅ **Answer: c – $eq**
📘 Equality queries leverage indexes best. `$regex` often causes collection scan.

---

### **Special Operators**

**Q19.** Which operator is used for pattern matching in MongoDB?
a) `$regex`
b) `$text`
c) `$pattern`
d) `$match`

✅ **Answer: a – $regex**

---

**Q20.** Which operator is used for full-text search?
a) `$regex`
b) `$text`
c) `$search`
d) `$lookup`

✅ **Answer: b – $text**
📘 Requires a **text index**.

---

---

🔥 **Revision Strategy:**

* **Comparison**: `$eq, $ne, $gt, $gte, $lt, $lte, $in, $nin`
* **Array**: `$all, $elemMatch, $size`
* **Logic**: `$and, $or, $not, $nor`
* **Aggregation**: `$match, $group, $project, $sort, $lookup, $limit, $unwind`
* **Indexing**: Unique, Compound, Multikey, Text

--- --------------------------------------------------------------------------------------------


# 🔹 MongoDB Practical MCQs with Examples

### **Query Basics**

**Q1.** If we run:

```js
db.users.findOne({ name: "Rashid" })
```

What does it return?
a) All matching documents in an array
b) Only the first matching document
c) Only the `_id` field of the matching doc
d) Error if multiple docs exist

✅ **Answer: b – Only the first matching document**
📘 `findOne()` returns **one doc**, not an array.

---

**Q2.** If we run:

```js
db.users.find({ age: { $gte: 25 } })
```

Which documents will be returned?
a) Documents with age = 25 only
b) Documents with age > 25
c) Documents with age ≥ 25
d) None

✅ **Answer: c – Documents with age ≥ 25**

---

**Q3.** What will this query return?

```js
db.users.find({ age: { $in: [20, 25] } })
```

a) Users whose age is **20 or 25**
b) Users whose age is between 20 and 25
c) Users with age not equal to 20 or 25
d) All users

✅ **Answer: a – Users whose age is 20 or 25**

---

### **Projection**

**Q4.** What will this return?

```js
db.users.findOne({ name: "Rashid" }, { name: 1, age: 1 })
```

a) Only `name` field
b) `name` and `age` fields (+ `_id` by default)
c) All fields except `name` and `age`
d) Error

✅ **Answer: b**
📘 Projections (`{ field: 1 }`) return only those fields, but `_id` is **always included** unless excluded.

---

### **Update Queries**

**Q5.** What does this query do?

```js
db.users.updateOne(
  { name: "Rashid" },
  { $set: { age: 30 } }
)
```

a) Updates all users named Rashid
b) Updates the first user named Rashid, setting age to 30
c) Creates a new user named Rashid with age 30
d) Deletes age field

✅ **Answer: b**
📘 `updateOne()` updates only the **first matching document**.

---

**Q6.** What does this do?

```js
db.users.updateMany(
  { role: "dev" },
  { $inc: { salary: 1000 } }
)
```

a) Sets salary = 1000 for all devs
b) Increases salary by 1000 for all devs
c) Deletes salary for all devs
d) Updates only one dev

✅ **Answer: b – Increases salary by 1000**

---

### **Delete Queries**

**Q7.** What does this query do?

```js
db.users.deleteOne({ age: 25 })
```

a) Deletes all users with age 25
b) Deletes the first user with age 25
c) Deletes age field from one doc
d) Deletes nothing

✅ **Answer: b – Deletes the first user with age 25**

---

### **Sorting & Limiting**

**Q8.** What will this query return?

```js
db.users.find().sort({ age: -1 }).limit(1)
```

a) The youngest user
b) The oldest user
c) Random user
d) Error

✅ **Answer: b – The oldest user**
📘 `-1` means descending sort.

---

### **Aggregation**

**Q9.** What does this aggregation do?

```js
db.orders.aggregate([
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } }
])
```

a) Groups all orders by `customerId` and sums their amount
b) Sums all order amounts
c) Returns each order as is
d) Error

✅ **Answer: a**

---

**Q10.** What does this query do?

```js
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customerId", count: { $sum: 1 } } }
])
```

a) Groups all customers
b) Groups only completed orders by customerId and counts them
c) Deletes completed orders
d) Updates customer data

✅ **Answer: b**

---

### **Array Queries**

**Q11.** What will this query return?

```js
db.users.find({ skills: { $all: ["Node.js", "MongoDB"] } })
```

a) Users having either Node.js or MongoDB
b) Users having **both Node.js and MongoDB**
c) Users with skills array length 2
d) None

✅ **Answer: b**

---

**Q12.** What does this query do?

```js
db.users.find({ scores: { $size: 3 } })
```

a) Finds users with scores field equal to 3
b) Finds users with scores array having exactly 3 elements
c) Finds users with score ≥ 3
d) Error

✅ **Answer: b**

---

### **Indexes**

**Q13.** If you create an index like this:

```js
db.users.createIndex({ email: 1 }, { unique: true })
```

What will happen?
a) Multiple users can have the same email
b) No two users can have the same email
c) Only one user can be inserted
d) Emails must be integers

✅ **Answer: b – No duplicates allowed**

---

### **Special Operators**

**Q14.** What does this query return?

```js
db.products.find({ name: { $regex: /^Sam/ } })
```

a) Products whose name contains “Sam” anywhere
b) Products whose name starts with “Sam”
c) Products whose name ends with “Sam”
d) All products

✅ **Answer: b**

---

**Q15.** What does this query do?

```js
db.blogs.find({ $text: { $search: "angular node" } })
```

a) Finds blogs containing **both words**
b) Finds blogs containing “angular” or “node”
c) Finds blogs that only contain “angular node” together
d) Error

✅ **Answer: b – OR search**
📘 `$text` searches for any of the terms unless quoted `"angular node"`.

---

---

🔥 **Quick Interview Pointers**

* `findOne()` → first match, object
* `find()` → all matches, cursor/array
* `$set` → update/add field
* `$inc` → increment numeric field
* `$push / $pull` → modify arrays
* `$all / $elemMatch / $size` → array queries
* Aggregation pipeline is like SQL `WHERE → GROUP BY → SELECT → ORDER`

---

👉 Do you want me to now prepare a **mock interview test (30–40 MCQs)** mixing **find, update, delete, operators, aggregation, indexing** — so you can simulate a real **MongoDB exam**?

