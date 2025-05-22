# Data Partitioning Simulation in JavaScript

This project demonstrates how large datasets can be split across multiple "partitions" (like database shards) using different partitioning strategies: range-based, hash-based, and directory-based.

---

## Key Concepts Explained

### 1. Range-Based Partitioning
- **Description**: Splits data by a defined range (e.g., letters A-M).
- **Pros**:
    - Easy to query ranges (e.g., "get all users A-M").
- **Cons**:
    - Uneven distribution (e.g., too many users with names starting with "A").

---

### 2. Hash-Based Partitioning
- **Description**: Uses a hash function to randomly but evenly distribute data.
- **Pros**:
    - Balanced data distribution.
- **Cons**:
    - Hard to query ranges (e.g., "find users A-M" requires checking all partitions).

---

### 3. Directory-Based Partitioning
- **Description**: Uses a lookup table (directory) to map data to partitions.
- **Pros**:
    - Flexible (manually assign data).
- **Cons**:
    - Directory becomes a single point of failure.

---

## When to Use Which?

- **Range-Based Partitioning**: Use for ordered data (e.g., time-series logs).
- **Hash-Based Partitioning**: Use for even distribution (e.g., user IDs in social apps).
- **Directory-Based Partitioning**: Use for custom routing (e.g., multi-tenant SaaS apps).

---

## Conclusion

This project illustrates how partitioning helps scale databases horizontally by splitting data across multiple servers!