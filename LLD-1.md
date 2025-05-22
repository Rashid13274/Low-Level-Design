# Low-Level System Design (LLSD)

Low-Level System Design (LLSD) is the process of transforming a high-level architectural blueprint into a detailed, implementable plan. It focuses on the granular aspects of system components, including class structures, algorithms, data storage, APIs, and interaction mechanisms. Unlike High-Level Design (HLD), which outlines the system's architecture, LLSD dives into specifics that developers can directly code.

## Key Concepts in LLSD

### Object-Oriented Design (OOD)
- **SOLID Principles**: Ensure modular, maintainable code (e.g., Single Responsibility, Dependency Inversion).
- **Design Patterns**: Reusable solutions like Singleton (single instance), Factory (object creation), and Observer (event-driven systems).

### Data Structures & Algorithms
- Choose efficient structures (e.g., hash maps for O(1) lookups, queues for FIFO operations).

### Concurrency & Multithreading
- Manage simultaneous access (e.g., locks, semaphores) to prevent race conditions.

### Database Design
- Schema normalization, indexing, ACID transactions, and query optimization.

### API Design
- Define RESTful endpoints, request/response formats, and error codes.

### Caching
- Use strategies like LRU or tools like Redis to reduce latency.

### Error Handling & Logging
- Graceful degradation, exception handling, and monitoring.

### Performance Optimization
- Minimize latency, maximize throughput, and reduce resource usage.

### Scalability & Extensibility
- Design modular components for future scaling (e.g., microservices).

## Projects & Examples

### 1. Parking Lot System
- **OOD**: Classes for ParkingLot, ParkingSpot, Vehicle, and Ticket.
- **Design Patterns**:
    - Factory Pattern: Create spots (compact, handicapped).
    - Strategy Pattern: Dynamic fee calculation (hourly, flat rates).
- **Data Structures**: Hash map to track spot occupancy.
- **Concurrency**: Locks to handle simultaneous entry/exit.
- **Database**: Schema for tickets (entry_time, exit_time, vehicle_id).
- **API**: /entry (generate ticket), /exit (calculate fee).

### 2. URL Shortener (e.g., Bitly)
- **Algorithms**: Base62 encoding to generate short URLs from IDs.
- **Data Structures**: Distributed hash table for short-to-long URL mapping.
- **Database**: Key-value store (e.g., DynamoDB) for quick lookups.
- **Caching**: Redis to cache frequently accessed URLs.
- **Concurrency**: Atomic counters for ID generation.
- **API**: /create (returns short URL), /{shortURL} (redirects).

### 3. Rate Limiter
- **Algorithms**: Token Bucket or Leaky Bucket to limit requests.
- **Data Structures**: In-memory cache (e.g., Redis) with TTL for request counts.
- **Concurrency**: Atomic operations to track usage.
- **API Middleware**: Intercepts requests to enforce limits.

### 4. Library Management System
- **OOD**: Classes for Book, User, Loan.
- **Design Patterns**:
    - Observer Pattern: Notify users of due dates.
- **Database**: Tables for books (ISBN, title), loans (user_id, due_date).
- **Concurrency**: Handle simultaneous checkouts of the same book.
- **API**: /checkout, /return, /reserve.

### 5. Vending Machine
- **State Management**: Use State Pattern for states (idle, payment).
- **Inventory**: Track items using a hash map (product_id → count).
- **Concurrency**: Handle coin insertion and product selection atomically.
- **API**: /select_item, /insert_coin, /dispense.

## Real-World Applications
- **Parking Lot**: Smart city parking solutions.
- **URL Shortener**: Services like Bitly or TinyURL.
- **Rate Limiter**: APIs (Twitter, GitHub) to prevent abuse.
- **Vending Machine**: IoT-based retail systems.

## Bridging Architecture and Code

Low-Level System Design (LLSD) bridges the gap between architecture and code, ensuring systems are efficient, scalable, and maintainable. It is commonly tested in interviews through whiteboard exercises focusing on class diagrams and interaction logic.

---

### Horizontal Scaling

**What it is**: Adding more machines/servers to share the workload.  
**Analogy**: Imagine a pizza shop getting too many orders. Instead of making one chef work faster, you hire more chefs to split the work.

**Pros**:
- **Unlimited growth**: Add as many servers as needed.
- **Fault-tolerant**: If one server crashes, others keep running.
- **Cost-effective**: Use cheaper, smaller machines.

**Cons**:
- **Complexity**: Requires load balancing and coordination between servers.
- **Data consistency**: Harder to keep data synced across multiple servers.

**Example**:  
Netflix uses horizontal scaling to handle millions of streaming requests by distributing traffic across thousands of servers.

---

### Vertical Scaling

**What it is**: Upgrading a single machine’s power (CPU, RAM, storage) to handle more load.  
**Analogy**: Instead of hiring more chefs, you give your existing chef a bigger oven and sharper knives.

**Pros**:
- **Simple**: No code changes or distributed systems needed.
- **No coordination**: Everything runs on one machine.

**Cons**:
- **Limited**: You can’t upgrade hardware infinitely.
- **Downtime**: Requires shutting down the system to upgrade.
- **Expensive**: High-end hardware costs rise exponentially.

**Example**:  
A small blog upgrading its server from 4GB to 16GB RAM to handle more visitors.
