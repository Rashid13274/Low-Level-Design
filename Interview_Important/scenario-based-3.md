# Caching, Session Management & OOP Interview Questions

## **CACHING SCENARIOS - Common Questions**

### **1. Basic Caching Concepts**
- **What is caching and why do we use it?**
- **Explain different types of caching (in-memory, distributed, browser, CDN)**
- **What is the difference between cache and database?**
- **What are cache hits and cache misses?**

### **2. Cache Eviction Strategies**
**Q: Explain different cache eviction policies. When would you use each?**

**Answer should cover:**
- **LRU (Least Recently Used)**: Removes least recently accessed items - good for general purpose
- **LFU (Least Frequently Used)**: Removes least frequently accessed items
- **FIFO (First In First Out)**: Removes oldest entries first
- **TTL (Time To Live)**: Items expire after specific time
- **Random Replacement**: Randomly removes items

**Example scenario**: "For a news website, I'd use TTL because news becomes outdated. For product catalog, LRU works better since popular products are accessed frequently."

### **3. Real-World Caching Scenarios**

**Q: You have an e-commerce application where product prices change frequently. How would you implement caching?**

**Good answer:**
```
- Cache product details (name, description) with longer TTL (24 hours)
- Cache prices separately with shorter TTL (5-10 minutes)
- Use cache invalidation when admin updates product
- Implement cache-aside pattern: check cache first, if miss, fetch from DB and update cache
```

**Q: Your application's database queries are slow. How would you use caching to improve performance?**

**Answer approach:**
```
- Identify frequently accessed queries (analytics/user behavior data)
- Implement Redis/Memcached for query result caching
- Use cache key based on query parameters
- Set appropriate TTL based on data update frequency
- Monitor cache hit ratio (aim for 80%+)
```

### **4. Distributed Caching Questions**

**Q: What is the difference between local cache and distributed cache?**

| Local Cache | Distributed Cache |
|------------|------------------|
| Stored in application memory | Stored in external system (Redis, Memcached) |
| Fast access | Network latency |
| Lost when app restarts | Persistent across restarts |
| Not shared between servers | Shared across multiple servers |
| Good for: small, rarely changing data | Good for: large datasets, multi-server apps |

**Q: When would you choose Redis over Memcached?**

**Answer:**
- **Redis**: Need data persistence, complex data structures (lists, sets), pub/sub, transactions
- **Memcached**: Simple key-value storage, pure caching needs, slightly faster for simple operations

### **5. Cache Invalidation Scenarios**

**Q: "There are only two hard things in Computer Science: cache invalidation and naming things." How do you handle cache invalidation?**

**Strategies:**
1. **Time-based (TTL)**: Automatic expiration
2. **Event-based**: Invalidate when data changes
3. **Manual**: Explicitly clear cache on updates
4. **Write-through**: Update cache when updating database
5. **Write-behind**: Update database async, cache updated immediately

**Q: User updates their profile, but still sees old data. What could be the issue and how do you fix it?**

**Answer:**
```
Issue: Cache not invalidated after update
Solutions:
- Implement cache invalidation in update API
- Use shorter TTL for user-specific data
- Use cache tagging to invalidate related caches
- Implement version-based caching
```

### **6. Caching Patterns**

**Q: Explain Cache-Aside vs Read-Through vs Write-Through patterns**

**Cache-Aside (Lazy Loading):**
```
1. Application checks cache
2. If miss, fetch from DB
3. Store in cache
4. Return data
```

**Read-Through:**
```
Cache itself fetches from DB on miss (transparent to app)
```

**Write-Through:**
```
Write to cache and DB simultaneously
```

### **7. Practical Coding Question**

**Q: Implement a simple LRU cache**

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity
    
    def get(self, key):
        if key not in self.cache:
            return -1
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            # Remove first item (least recently used)
            self.cache.popitem(last=False)
```

---

## **SESSION MANAGEMENT QUESTIONS**

### **8. Basic Session Concepts**

**Q: What is the difference between session and cookies?**

| Session | Cookie |
|---------|--------|
| Stored on server | Stored on client browser |
| More secure | Less secure (can be stolen) |
| Larger storage capacity | Limited size (4KB) |
| Lost when server restarts (unless persistent) | Persists until expiry |
| Slower (server lookup) | Faster (local access) |

**Q: How do sessions work internally?**

**Answer:**
```
1. User logs in
2. Server creates session, generates unique session ID
3. Session ID sent to client as cookie
4. Client sends session ID with each request
5. Server looks up session data using session ID
6. Session expires after timeout or logout
```

### **9. Session Storage Questions**

**Q: Where can you store sessions? Compare different approaches.**

**Options:**
1. **In-Memory (server RAM)**: Fast but lost on restart, not scalable
2. **Database**: Persistent but slower
3. **Redis/Memcached**: Fast, scalable, persistent (Redis)
4. **File System**: Simple but slow for high traffic
5. **JWT Tokens**: Stateless, no server storage needed

**Q: Your application is deployed on multiple servers. How do you handle sessions?**

**Answer:**
```
Problem: User might hit different servers, session not available

Solutions:
1. Sticky sessions (load balancer routes user to same server)
2. Centralized session storage (Redis)
3. Session replication across servers
4. Use JWT for stateless authentication

Best: Redis-based session storage - scalable, fast, shared
```

### **10. Security Questions**

**Q: How do you prevent session hijacking?**

**Measures:**
- Use HTTPS only (prevent session ID interception)
- Regenerate session ID after login
- Set HttpOnly flag on cookies (prevents XSS)
- Set Secure flag (cookies sent over HTTPS only)
- Implement session timeout
- Bind session to IP address (careful with mobile users)
- Use SameSite cookie attribute

**Q: What is session fixation attack and how do you prevent it?**

**Answer:**
```
Attack: Attacker sets victim's session ID to known value, then hijacks after login

Prevention:
- Regenerate session ID after authentication
- Don't accept session IDs from URL parameters
- Validate session origin
```

### **11. Practical Session Scenarios**

**Q: User complains they're being logged out frequently. How do you debug?**

**Debugging steps:**
```
1. Check session timeout settings (too short?)
2. Verify session storage isn't full
3. Check if session is being cleared unintentionally
4. Look for session conflicts (same session ID overwriting)
5. Check server restarts/deployments
6. Verify cookie expiration settings
```

**Q: Implement "Remember Me" functionality**

**Approach:**
```
1. On login with "remember me" checked:
   - Generate secure random token
   - Store token in database with user ID and expiry
   - Set long-lived cookie with token
2. On subsequent visits:
   - Check for remember-me cookie
   - Validate token from database
   - Auto-login if valid
   - Regenerate token for security
```

---

## **OOP (Object-Oriented Programming) QUESTIONS**

### **12. Core OOP Concepts**

**Q: Explain the 4 pillars of OOP with real examples**

**1. Encapsulation:**
```python
class BankAccount:
    def __init__(self):
        self.__balance = 0  # Private variable
    
    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount
    
    def get_balance(self):
        return self.__balance

# Can't directly access __balance, must use methods
```

**2. Inheritance:**
```python
class Vehicle:
    def __init__(self, brand):
        self.brand = brand
    
    def start(self):
        print("Vehicle starting")

class Car(Vehicle):
    def __init__(self, brand, model):
        super().__init__(brand)
        self.model = model
    
    def start(self):
        print(f"{self.brand} {self.model} starting")
```

**3. Polymorphism:**
```python
class Payment:
    def process(self):
        pass

class CreditCardPayment(Payment):
    def process(self):
        print("Processing credit card")

class PayPalPayment(Payment):
    def process(self):
        print("Processing PayPal")

# Same method name, different behavior
def make_payment(payment: Payment):
    payment.process()
```

**4. Abstraction:**
```python
from abc import ABC, abstractmethod

class DatabaseConnection(ABC):
    @abstractmethod
    def connect(self):
        pass
    
    @abstractmethod
    def query(self, sql):
        pass

# User doesn't need to know connection details
```

### **13. SOLID Principles**

**Q: Explain SOLID principles with examples**

**S - Single Responsibility:**
```python
# Bad
class User:
    def save_to_db(self):
        pass
    def send_email(self):
        pass

# Good - each class has one responsibility
class User:
    pass

class UserRepository:
    def save(self, user):
        pass

class EmailService:
    def send(self, user):
        pass
```

**O - Open/Closed:**
```python
# Open for extension, closed for modification
class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius
    
    def area(self):
        return 3.14 * self.radius ** 2

# Add new shapes without modifying existing code
```

**L - Liskov Substitution:**
```python
# Subclass should be substitutable for parent class
class Bird:
    def fly(self):
        print("Flying")

class Sparrow(Bird):
    pass  # Can fly, follows LSP

class Penguin(Bird):
    def fly(self):
        raise Exception("Can't fly")  # Violates LSP!
```

**I - Interface Segregation:**
```python
# Don't force classes to implement unused methods
# Bad
class Worker(ABC):
    @abstractmethod
    def work(self):
        pass
    @abstractmethod
    def eat(self):
        pass

# Good - separate interfaces
class Workable(ABC):
    @abstractmethod
    def work(self):
        pass

class Eatable(ABC):
    @abstractmethod
    def eat(self):
        pass
```

**D - Dependency Inversion:**
```python
# Depend on abstractions, not concrete classes
class EmailService:
    def send(self, message):
        pass

class SMSService:
    def send(self, message):
        pass

# Bad
class NotificationManager:
    def __init__(self):
        self.email_service = EmailService()

# Good
class NotificationManager:
    def __init__(self, notification_service):
        self.service = notification_service  # Inject dependency
```

### **14. Design Patterns (Common for 2 years exp)**

**Q: Explain Singleton pattern and when to use it**

```python
class DatabaseConnection:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            # Initialize connection
        return cls._instance

# Use for: Logger, Configuration, Database connection pool
```

**Q: Explain Factory pattern**

```python
class PaymentFactory:
    @staticmethod
    def create_payment(type):
        if type == "credit_card":
            return CreditCardPayment()
        elif type == "paypal":
            return PayPalPayment()
        elif type == "crypto":
            return CryptoPayment()

# Use when: Object creation is complex, type determined at runtime
```

**Q: What is Dependency Injection?**

```python
# Without DI
class UserService:
    def __init__(self):
        self.db = MySQLDatabase()  # Tightly coupled

# With DI
class UserService:
    def __init__(self, database):
        self.db = database  # Loosely coupled, testable

# Usage
db = MySQLDatabase()
service = UserService(db)  # Inject dependency
```

### **15. Practical OOP Scenarios**

**Q: Design a parking lot system using OOP**

```python
class Vehicle(ABC):
    def __init__(self, license_plate, vehicle_type):
        self.license_plate = license_plate
        self.vehicle_type = vehicle_type

class Car(Vehicle):
    def __init__(self, license_plate):
        super().__init__(license_plate, "car")

class ParkingSpot:
    def __init__(self, spot_id, spot_type):
        self.spot_id = spot_id
        self.spot_type = spot_type
        self.is_occupied = False
        self.vehicle = None
    
    def park_vehicle(self, vehicle):
        if not self.is_occupied:
            self.vehicle = vehicle
            self.is_occupied = True
            return True
        return False
    
    def remove_vehicle(self):
        self.vehicle = None
        self.is_occupied = False

class ParkingLot:
    def __init__(self):
        self.spots = []
    
    def find_available_spot(self, vehicle_type):
        for spot in self.spots:
            if not spot.is_occupied and spot.spot_type == vehicle_type:
                return spot
        return None
```

**Q: Difference between abstract class and interface**

| Abstract Class | Interface |
|---------------|-----------|
| Can have concrete methods | Only method signatures (traditionally) |
| Can have state/variables | No state |
| Single inheritance | Multiple inheritance |
| Use when: classes share code | Use when: defining contract |

**Q: What is composition vs inheritance? When to use each?**

```python
# Inheritance (IS-A relationship)
class Car(Vehicle):
    pass  # Car IS-A Vehicle

# Composition (HAS-A relationship)
class Car:
    def __init__(self):
        self.engine = Engine()  # Car HAS-AN Engine
        self.wheels = [Wheel(), Wheel(), Wheel(), Wheel()]

# Prefer composition for flexibility
```

---

## **Preparation Tips:**

1. **Practice coding OOP examples** - don't just memorize theory
2. **Think in real-world scenarios** - relate concepts to actual applications
3. **Know trade-offs** - every solution has pros/cons
4. **Be ready to write code** - they might ask you to implement on the spot
5. **Explain your thought process** - talk through your reasoning

Good luck! 🚀