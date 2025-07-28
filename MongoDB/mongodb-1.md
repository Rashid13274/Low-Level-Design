# Indexing in MongoDB

Indexing in MongoDB is a mechanism for improving the performance and efficiency of search queries. It works like the index in a book—rather than scanning the entire collection, MongoDB uses indexes to quickly locate the desired data.

---

## 🔍 Why Indexing is Important

- **Without indexes:** MongoDB must scan every document in a collection to find matches (collection scan), which is inefficient for large collections.
- **With indexes:** MongoDB can narrow down the search and return results much faster.

---

## ⚙️ How Indexing Works

An index is a special data structure that stores a small portion of the collection’s data in an easy-to-traverse form. Think of it as a sorted list that MongoDB can search through efficiently.

---

## 📌 Types of Indexes in MongoDB

### 1. Single Field Index

- Created on one field.

```js
db.users.createIndex({ name: 1 }) // 1 for ascending, -1 for descending
```

---

### 2. Compound Index

- Created on multiple fields.

```js
db.users.createIndex({ age: 1, name: -1 })
```

---

### 3. Multikey Index

- Used when the indexed field is an array.

---

### 4. Text Index

- For text search in string fields.

```js
db.articles.createIndex({ content: "text" })
```

---

### 5. Geospatial Index

- For location-based data (e.g., longitude and latitude).

---

### 6. Hashed Index

- Used for sharding based on hashed values.

---

## ✅ Benefits of Indexing

- Faster query performance
- Optimizes sort operations
- Helps in uniqueness constraints

---

## ⚠️ Drawbacks

- Consumes additional storage
- Slows down write operations (insert, update, delete) because indexes need to be updated

---

## 🧠 Example

Suppose you have a `products` collection and want to search products by category quickly:

```js
db.products.createIndex({ category: 1 })
```

Now, a query like:

```js
db.products.find({ category: "Electronics" })
```

will use the index instead of scanning all products.

---

*Let me know if you want to see how to analyze index usage using `.explain()`!*
