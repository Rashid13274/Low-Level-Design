# Real-Time Inventory Tracking System for E-Commerce Platform

This project demonstrates a real-world use case of using **Redis** (for fast caching) and **MySQL** (for persistent storage) to efficiently track product stock levels in an e-commerce platform.

---

## **Project Overview**

### **Goal**
Efficiently track product stock levels.

### **Technologies Used**
- **Redis**: Cache product stock for instant reads.
- **MySQL**: Store complete product details permanently.

---

## **Workflow**

### **1. User Checks Product Stock (Read Workflow)**
- **First Request**:
    - Cache miss → Fetch data from MySQL.
    - Store result in Redis for future requests.
- **Subsequent Requests**:
    - Cache hit → Return data from Redis instantly.

### **2. Admin Updates Product Stock (Write Workflow)**
- Update MySQL.
- Invalidate Redis cache to ensure consistency.

---

## **Key Components Explained**

### **Redis**
- Acts as a cache layer to reduce MySQL queries.
- Uses `SET/GET` with expiration (e.g., `EX: 60`) to auto-clear old data.

### **MySQL**
- Source of truth for all product data.
- Handles complex queries and ensures permanent storage.

### **Cache Invalidation**
- When stock updates, delete the Redis key to prevent stale data.

---

## **Why This Matters in the Real World**

- **Performance**: Redis serves 100,000+ requests/sec vs MySQL’s ~1,000/sec.
- **Scalability**: Reduces load on MySQL during traffic spikes (e.g., Black Friday sales).
- **Consistency**: Ensures users see accurate stock counts.

---

## **How to Test**

### **1. Check Stock (Cache Miss → MySQL)**
```bash
curl http://localhost:3000/products/1/stock
# Output: {"stock":50,"source":"MySQL Database"}
```

### **2. Check Again (Cache Hit → Redis)**
```bash
curl http://localhost:3000/products/1/stock
# Output: {"stock":50,"source":"Redis Cache"}
```

### **3. Update Stock**
```bash
curl -X POST http://localhost:3000/products/1/stock?stock=45
# Output: "Stock updated and cache invalidated!"
```

### **4. Check Stock (Cache Refreshed)**
```bash
curl http://localhost:3000/products/1/stock
# Output: {"stock":45,"source":"MySQL Database"}
```

---

## **Summary**

- **Redis**: Lightning-fast cache for frequently accessed data.
- **MySQL**: Reliable persistent storage for critical data.
- **Use Together**: Balance speed and durability for high-traffic apps.

This pattern is widely used by companies like **Amazon**, **Shopify**, and **Netflix** to handle massive traffic efficiently!
