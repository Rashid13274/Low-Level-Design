# Object-Oriented Programming (OOP) Interview Questions - TypeScript Edition

I'll create comprehensive OOP MCQs with deep explanations using TypeScript, Node.js, and Express.js examples for software developer interviews.

***

## Section 1: Classes, Objects, and Memory Management

### Q1: Instance vs Static Members - Memory Allocation

```typescript
// Express.js API Rate Limiter Implementation

class RateLimiter {
  private requestCount: number = 0;
  private static totalRequests: number = 0;
  private static instances: Map<string, RateLimiter> = new Map();
  
  constructor(private userId: string, private maxRequests: number) {}
  
  public checkLimit(): boolean {
    this.requestCount++;
    RateLimiter.totalRequests++;
    return this.requestCount <= this.maxRequests;
  }
  
  public static getInstance(userId: string, maxRequests: number): RateLimiter {
    if (!RateLimiter.instances.has(userId)) {
      RateLimiter.instances.set(userId, new RateLimiter(userId, maxRequests));
    }
    return RateLimiter.instances.get(userId)!;
  }
  
  public getRequestCount(): number {
    return this.requestCount;
  }
  
  public static getTotalRequests(): number {
    return RateLimiter.totalRequests;
  }
}

// Usage in Express.js
import express, { Request, Response, NextFunction } from 'express';
const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['user-id'] as string || 'anonymous';
  const limiter = RateLimiter.getInstance(userId, 100);
  
  if (limiter.checkLimit()) {
    next();
  } else {
    res.status(429).json({ error: 'Rate limit exceeded' });
  }
});

// Testing scenario:
const limiter1 = RateLimiter.getInstance('user123', 100);
const limiter2 = RateLimiter.getInstance('user123', 100);
const limiter3 = RateLimiter.getInstance('user456', 100);

limiter1.checkLimit(); // user123: requestCount = 1
limiter2.checkLimit(); // user123: requestCount = 2
limiter3.checkLimit(); // user456: requestCount = 1

console.log(limiter1.getRequestCount());        // Line A
console.log(limiter2.getRequestCount());        // Line B
console.log(RateLimiter.getTotalRequests());    // Line C
```

**Question:** What will be the output of Lines A, B, and C?

A) Line A: 1, Line B: 1, Line C: 2  
B) Line A: 2, Line B: 2, Line C: 3  
C) Line A: 1, Line B: 2, Line C: 3  
D) Line A: 2, Line B: 1, Line C: 3

**Answer: B) Line A: 2, Line B: 2, Line C: 3**

**Explanation:**
Understanding **instance vs static members** is crucial for memory management and design patterns. This demonstrates the Singleton pattern commonly used in Express.js middleware.

**Instance vs Static Members Deep Dive:**

```typescript
// ===================================================================
// PART 1: UNDERSTANDING MEMORY ALLOCATION
// ===================================================================

class User {
  // Instance members (each object gets its own copy in HEAP memory)
  private name: string;
  private email: string;
  private loginCount: number = 0;
  
  // Static members (shared across ALL instances, stored in METHOD AREA/STATIC MEMORY)
  private static totalUsers: number = 0;
  private static readonly MAX_LOGIN_ATTEMPTS: number = 5;
  private static userDatabase: Map<string, User> = new Map();
  
  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
    User.totalUsers++; // Increment shared counter
  }
  
  // Instance method (operates on specific object)
  public login(): void {
    this.loginCount++;
    console.log(`${this.name} logged in. Login count: ${this.loginCount}`);
  }
  
  // Static method (operates on class level, no access to instance members)
  public static getTotalUsers(): number {
    return User.totalUsers;
  }
  
  public static resetAllUsers(): void {
    User.userDatabase.clear();
    User.totalUsers = 0;
  }
}

// Memory allocation demonstration:
const user1 = new User('Alice', 'alice@example.com');
const user2 = new User('Bob', 'bob@example.com');
const user3 = new User('Charlie', 'charlie@example.com');

/*
HEAP MEMORY (Instance data):
┌─────────────────────────────────────┐
│ user1 object:                       │
│   name: "Alice"                     │
│   email: "alice@example.com"        │
│   loginCount: 0                     │
├─────────────────────────────────────┤
│ user2 object:                       │
│   name: "Bob"                       │
│   email: "bob@example.com"          │
│   loginCount: 0                     │
├─────────────────────────────────────┤
│ user3 object:                       │
│   name: "Charlie"                   │
│   email: "charlie@example.com"      │
│   loginCount: 0                     │
└─────────────────────────────────────┘

METHOD AREA / STATIC MEMORY (Shared data):
┌─────────────────────────────────────┐
│ User class static members:          │
│   totalUsers: 3                     │
│   MAX_LOGIN_ATTEMPTS: 5             │
│   userDatabase: Map {...}           │
└─────────────────────────────────────┘
*/

user1.login(); // Alice's loginCount: 0 → 1
user1.login(); // Alice's loginCount: 1 → 2
user2.login(); // Bob's loginCount: 0 → 1

console.log(User.getTotalUsers()); // 3 (shared across all instances)


// ===================================================================
// PART 2: REAL-WORLD SCENARIO - DATABASE CONNECTION POOL (SINGLETON)
// ===================================================================

class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private static connectionCount: number = 0;
  private connectionId: string;
  private isConnected: boolean = false;
  
  // Private constructor prevents direct instantiation
  private constructor() {
    DatabaseConnection.connectionCount++;
    this.connectionId = `conn_${DatabaseConnection.connectionCount}`;
    console.log(`Creating database connection: ${this.connectionId}`);
  }
  
  // Static factory method - ensures only one instance exists
  public static getInstance(): DatabaseConnection {
    if (DatabaseConnection.instance === null) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
  
  public connect(): void {
    if (!this.isConnected) {
      this.isConnected = true;
      console.log(`${this.connectionId} connected to database`);
    } else {
      console.log(`${this.connectionId} already connected`);
    }
  }
  
  public query(sql: string): void {
    if (this.isConnected) {
      console.log(`Executing query: ${sql}`);
    } else {
      throw new Error('Not connected to database');
    }
  }
  
  public static getConnectionCount(): number {
    return DatabaseConnection.connectionCount;
  }
}

// Express.js usage:
import express from 'express';
const app = express();

// Database connection is shared across all routes
const db = DatabaseConnection.getInstance();
db.connect();

app.get('/users', (req, res) => {
  const db = DatabaseConnection.getInstance(); // Same instance!
  db.query('SELECT * FROM users');
  res.json({ users: [] });
});

app.get('/products', (req, res) => {
  const db = DatabaseConnection.getInstance(); // Same instance!
  db.query('SELECT * FROM products');
  res.json({ products: [] });
});

// Attempting to create multiple instances
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
const db3 = DatabaseConnection.getInstance();

console.log(db1 === db2); // true (same instance)
console.log(db2 === db3); // true (same instance)
console.log(DatabaseConnection.getConnectionCount()); // 1 (only one created)


// ===================================================================
// PART 3: STATIC METHODS VS INSTANCE METHODS
// ===================================================================

class Logger {
  private instanceId: string;
  private instanceLogCount: number = 0;
  
  private static globalLogCount: number = 0;
  private static logLevel: 'DEBUG' | 'INFO' | 'ERROR' = 'INFO';
  
  constructor(instanceId: string) {
    this.instanceId = instanceId;
  }
  
  // Instance method - needs object to be called
  public log(message: string): void {
    this.instanceLogCount++;
    Logger.globalLogCount++;
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.instanceId}] ${message}`);
    console.log(`Instance logs: ${this.instanceLogCount}, Global logs: ${Logger.globalLogCount}`);
  }
  
  // Static method - called on class itself
  public static setLogLevel(level: 'DEBUG' | 'INFO' | 'ERROR'): void {
    Logger.logLevel = level;
    console.log(`Global log level set to: ${level}`);
  }
  
  public static getGlobalLogCount(): number {
    // ❌ CANNOT access instance members here
    // console.log(this.instanceId); // ERROR!
    // console.log(this.instanceLogCount); // ERROR!
    
    // ✅ CAN access static members
    return Logger.globalLogCount;
  }
  
  public getInstanceLogCount(): number {
    // ✅ CAN access both instance and static members
    console.log(`Instance: ${this.instanceLogCount}, Global: ${Logger.globalLogCount}`);
    return this.instanceLogCount;
  }
}

// Express.js middleware with different logger instances
const requestLogger = new Logger('REQUEST');
const errorLogger = new Logger('ERROR');
const dbLogger = new Logger('DATABASE');

app.use((req, res, next) => {
  requestLogger.log(`${req.method} ${req.path}`);
  next();
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  errorLogger.log(`Error: ${err.message}`);
  res.status(500).json({ error: err.message });
});

// Each logger has its own count, but global count is shared
requestLogger.log('Request received'); // Instance: 1, Global: 1
requestLogger.log('Request processed'); // Instance: 2, Global: 2
errorLogger.log('Database error');      // Instance: 1, Global: 3
dbLogger.log('Query executed');         // Instance: 1, Global: 4

console.log(Logger.getGlobalLogCount()); // 4 (all logs combined)


// ===================================================================
// PART 4: STATIC INITIALIZATION BLOCK (Advanced)
// ===================================================================

class ConfigurationManager {
  private static config: Map<string, string> = new Map();
  private static isInitialized: boolean = false;
  
  // Static initialization - runs once when class is first loaded
  static {
    console.log('Initializing configuration...');
    ConfigurationManager.loadConfig();
    ConfigurationManager.isInitialized = true;
  }
  
  private static loadConfig(): void {
    // Simulate loading from environment variables
    ConfigurationManager.config.set('DB_HOST', process.env.DB_HOST || 'localhost');
    ConfigurationManager.config.set('DB_PORT', process.env.DB_PORT || '5432');
    ConfigurationManager.config.set('API_KEY', process.env.API_KEY || 'default_key');
  }
  
  public static get(key: string): string | undefined {
    return ConfigurationManager.config.get(key);
  }
  
  public static set(key: string, value: string): void {
    ConfigurationManager.config.set(key, value);
  }
}

// Static block runs automatically before any usage
console.log(ConfigurationManager.get('DB_HOST')); // Triggers static initialization
// Output: "Initializing configuration..."
//         "localhost"


// ===================================================================
// PART 5: WHEN TO USE STATIC VS INSTANCE MEMBERS
// ===================================================================

/*
USE STATIC MEMBERS WHEN:
✅ Data/behavior is shared across ALL instances
   - Configuration settings
   - Counters for all objects
   - Factory methods
   - Utility functions

✅ No need for object state
   - Math.max(), Math.random()
   - Validators, formatters
   - Constants

✅ Implementing design patterns
   - Singleton (single instance)
   - Factory (object creation)
   - Utility classes

EXAMPLES:
*/

class MathUtils {
  // All static - no instance needed
  public static PI: number = 3.14159;
  
  public static calculateCircleArea(radius: number): number {
    return MathUtils.PI * radius * radius;
  }
  
  public static max(a: number, b: number): number {
    return a > b ? a : b;
  }
}

// Usage: No object creation needed
console.log(MathUtils.calculateCircleArea(5));
console.log(MathUtils.max(10, 20));


/*
USE INSTANCE MEMBERS WHEN:
✅ Each object needs its own state
   - User profiles (each user has own name, email)
   - Shopping carts (each cart has own items)
   - Database records (each record has own data)

✅ Behavior depends on object's state
   - user.login() - depends on user's credentials
   - cart.checkout() - depends on cart's items

✅ Multiple objects with different values
   - Different users, products, orders

EXAMPLES:
*/

class ShoppingCart {
  // Each cart has its own items (instance member)
  private items: Array<{ productId: string; quantity: number }> = [];
  private userId: string;
  
  // Shared tax rate (static member)
  private static TAX_RATE: number = 0.08;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  public addItem(productId: string, quantity: number): void {
    this.items.push({ productId, quantity });
  }
  
  public calculateTotal(subtotal: number): number {
    // Uses both instance data and static constant
    return subtotal * (1 + ShoppingCart.TAX_RATE);
  }
  
  public getItemCount(): number {
    return this.items.length;
  }
  
  public static updateTaxRate(newRate: number): void {
    ShoppingCart.TAX_RATE = newRate;
  }
}

// Each user has their own cart
const cart1 = new ShoppingCart('user123');
const cart2 = new ShoppingCart('user456');

cart1.addItem('product1', 2);
cart1.addItem('product2', 1);

cart2.addItem('product3', 5);

console.log(cart1.getItemCount()); // 2 (user123's cart)
console.log(cart2.getItemCount()); // 1 (user456's cart)

// Tax rate is shared
ShoppingCart.updateTaxRate(0.10); // Affects ALL carts


// ===================================================================
// PART 6: COMMON INTERVIEW PITFALLS
// ===================================================================

class Counter {
  private count: number = 0;
  private static globalCount: number = 0;
  
  public increment(): void {
    this.count++;
    Counter.globalCount++;
  }
  
  public getCount(): number {
    return this.count;
  }
  
  public static getGlobalCount(): number {
    return Counter.globalCount;
  }
  
  // ❌ WRONG: Static method trying to access instance member
  public static resetInstance(): void {
    // this.count = 0; // ERROR! Static method can't access instance members
    Counter.globalCount = 0; // ✅ OK
  }
  
  // ✅ CORRECT: Instance method can access both
  public reset(): void {
    this.count = 0; // ✅ OK
    Counter.globalCount = 0; // ✅ OK
  }
}


// ===================================================================
// PART 7: MEMORY IMPLICATIONS
// ===================================================================

class Employee {
  // Instance members: Each object allocates memory
  private name: string;
  private salary: number;
  private department: string;
  
  // Static members: Single allocation for entire class
  private static companyName: string = 'TechCorp';
  private static employeeCount: number = 0;
  
  constructor(name: string, salary: number, department: string) {
    this.name = name;
    this.salary = salary;
    this.department = department;
    Employee.employeeCount++;
  }
}

// Creating 1000 employees
const employees: Employee[] = [];
for (let i = 0; i < 1000; i++) {
  employees.push(new Employee(`Employee${i}`, 50000, 'Engineering'));
}

/*
MEMORY USAGE:
Instance members: 1000 objects × (3 fields × ~8 bytes) = ~24KB
Static members: 2 fields × ~8 bytes = ~16 bytes (shared!)

If companyName was instance member:
1000 objects × "TechCorp" string = ~9KB wasted

CONCLUSION: Use static for shared data to save memory!
*/


// ===================================================================
// PART 8: EXPRESS.JS REAL-WORLD EXAMPLE - API RATE LIMITER
// ===================================================================

class AdvancedRateLimiter {
  // Each user has their own limiter (instance)
  private requests: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;
  
  // All users share this registry (static)
  private static limiters: Map<string, AdvancedRateLimiter> = new Map();
  private static totalBlockedRequests: number = 0;
  
  private constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  public static getOrCreate(userId: string, maxRequests: number = 100, windowMs: number = 60000): AdvancedRateLimiter {
    if (!AdvancedRateLimiter.limiters.has(userId)) {
      AdvancedRateLimiter.limiters.set(
        userId,
        new AdvancedRateLimiter(maxRequests, windowMs)
      );
    }
    return AdvancedRateLimiter.limiters.get(userId)!;
  }
  
  public checkLimit(): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Remove old requests outside time window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return {
        allowed: true,
        remaining: this.maxRequests - this.requests.length
      };
    }
    
    AdvancedRateLimiter.totalBlockedRequests++;
    return {
      allowed: false,
      remaining: 0
    };
  }
  
  public static getStatistics(): { totalUsers: number; totalBlocked: number } {
    return {
      totalUsers: AdvancedRateLimiter.limiters.size,
      totalBlocked: AdvancedRateLimiter.totalBlockedRequests
    };
  }
  
  public static cleanup(): void {
    // Remove limiters with no recent activity
    const now = Date.now();
    const inactiveThreshold = 300000; // 5 minutes
    
    for (const [userId, limiter] of AdvancedRateLimiter.limiters.entries()) {
      const lastRequest = limiter.requests[limiter.requests.length - 1];
      if (!lastRequest || now - lastRequest > inactiveThreshold) {
        AdvancedRateLimiter.limiters.delete(userId);
      }
    }
  }
}

// Express.js middleware implementation
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = req.headers['user-id'] as string || req.ip;
  const limiter = AdvancedRateLimiter.getOrCreate(userId, 100, 60000);
  
  const result = limiter.checkLimit();
  
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  
  if (result.allowed) {
    next();
  } else {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: 60
    });
  }
});

// Admin endpoint to view statistics
app.get('/admin/rate-limit-stats', (req, res) => {
  const stats = AdvancedRateLimiter.getStatistics();
  res.json(stats);
});

// Periodic cleanup (run every 5 minutes)
setInterval(() => {
  AdvancedRateLimiter.cleanup();
  console.log('Rate limiter cleanup completed');
}, 300000);


// ===================================================================
// KEY TAKEAWAYS
// ===================================================================

/*
1. INSTANCE MEMBERS:
   - Each object gets its own copy in HEAP memory
   - Accessed with 'this' keyword
   - Used for object-specific state/behavior
   - Memory: O(n) where n = number of objects

2. STATIC MEMBERS:
   - Single copy shared by all instances in METHOD AREA
   - Accessed with class name (ClassName.member)
   - Used for class-level state/behavior
   - Memory: O(1) regardless of object count

3. WHEN TO USE STATIC:
   ✅ Singleton pattern
   ✅ Factory methods
   ✅ Utility functions
   ✅ Counters/statistics
   ✅ Configuration/constants
   ✅ Shared resources

4. WHEN TO USE INSTANCE:
   ✅ Object-specific data
   ✅ Behavior depending on state
   ✅ Multiple objects with different values
   ✅ Encapsulation of object state

5. MEMORY CONSIDERATIONS:
   - Static: Memory efficient for shared data
   - Instance: Necessary for unique object state
   - Over-using static: Can lead to tight coupling
   - Over-using instance: Can waste memory

6. DESIGN PATTERNS:
   - Singleton: Static instance + private constructor
   - Factory: Static creation methods
   - Utility: All static methods
   - Registry: Static collection + instance objects
*/
```

***

### Q2: Encapsulation and Access Modifiers - Data Hiding

```typescript
// Express.js User Authentication Service

class UserAuthService {
  private password: string;
  protected email: string;
  public username: string;
  private readonly createdAt: Date;
  
  private static readonly SALT_ROUNDS: number = 10;
  private static encryptionKey: string = 'secret_key_12345';
  
  constructor(username: string, email: string, password: string) {
    this.username = username;
    this.email = email;
    this.password = this.hashPassword(password);
    this.createdAt = new Date();
  }
  
  // Private method - only accessible within this class
  private hashPassword(plainPassword: string): string {
    // Simplified hashing
    return `hashed_${plainPassword}_with_${UserAuthService.SALT_ROUNDS}`;
  }
  
  // Public method - accessible from anywhere
  public authenticate(inputPassword: string): boolean {
    const hashedInput = this.hashPassword(inputPassword);
    return this.password === hashedInput;
  }
  
  // Protected method - accessible in this class and subclasses
  protected validateEmail(email: string): boolean {
    return email.includes('@');
  }
  
  // Public getter - controlled access to private field
  public getCreatedAt(): Date {
    return new Date(this.createdAt); // Return copy, not reference
  }
  
  // Public setter with validation
  public setEmail(newEmail: string): void {
    if (this.validateEmail(newEmail)) {
      this.email = newEmail;
    } else {
      throw new Error('Invalid email format');
    }
  }
}

class AdminAuthService extends UserAuthService {
  private adminLevel: number;
  
  constructor(username: string, email: string, password: string, adminLevel: number) {
    super(username, email, password);
    this.adminLevel = adminLevel;
  }
  
  public promoteUser(): void {
    // ✅ Can access protected member from parent
    console.log(`Promoting user with email: ${this.email}`);
    
    // ✅ Can call protected method from parent
    if (this.validateEmail(this.email)) {
      this.adminLevel++;
    }
    
    // ❌ CANNOT access private members from parent
    // console.log(this.password); // ERROR!
    // this.hashPassword('test'); // ERROR!
  }
}

// Usage:
const user = new UserAuthService('john_doe', 'john@example.com', 'mypassword123');

// Testing access levels:
console.log(user.username);           // Line A: ✅ Works (public)
console.log(user.email);              // Line B: ? (protected)
console.log(user.password);           // Line C: ? (private)
console.log(user.getCreatedAt());     // Line D: ? (public method)
user.hashPassword('test');            // Line E: ? (private method)
```

**Question:** Which lines will compile successfully?

A) Only Lines A and D  
B) Lines A, B, and D  
C) Lines A, C, and D  
D) All lines will compile

**Answer: A) Only Lines A and D**

**Explanation:**
**Access modifiers** control visibility and enforce **encapsulation** - one of the four pillars of OOP. Understanding access levels is critical for designing secure, maintainable APIs.

- Line A: ✅ `public` members are accessible everywhere
- Line B: ❌ `protected` members are only accessible within the class and its subclasses
- Line C: ❌ `private` members are only accessible within the same class
- Line D: ✅ Public method provides controlled access
- Line E: ❌ Private methods are internal implementation details

**Encapsulation and Access Modifiers Deep Dive:**

```typescript
// ===================================================================
// PART 1: UNDERSTANDING ACCESS MODIFIERS
// ===================================================================

class BankAccount {
  // PUBLIC: Accessible from anywhere
  public accountNumber: string;
  public accountHolder: string;
  
  // PRIVATE: Only accessible within BankAccount class
  private balance: number;
  private pin: string;
  private transactionHistory: Array<{ type: string; amount: number; date: Date }>;
  
  // PROTECTED: Accessible in BankAccount and its subclasses
  protected bankName: string;
  protected accountType: string;
  
  // READONLY: Can only be set in constructor
  private readonly accountCreationDate: Date;
  
  // STATIC PRIVATE: Shared across all instances, but private
  private static nextAccountNumber: number = 1000;
  
  constructor(
    accountHolder: string,
    initialBalance: number,
    pin: string,
    bankName: string = 'MyBank'
  ) {
    this.accountNumber = `ACC${BankAccount.nextAccountNumber++}`;
    this.accountHolder = accountHolder;
    this.balance = initialBalance;
    this.pin = pin;
    this.bankName = bankName;
    this.accountType = 'SAVINGS';
    this.accountCreationDate = new Date();
    this.transactionHistory = [];
  }
  
  // PUBLIC METHOD: Provides controlled access to private balance
  public getBalance(): number {
    return this.balance;
  }
  
  // PUBLIC METHOD: Validates before modifying private field
  public deposit(amount: number): boolean {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }
    
    this.balance += amount;
    this.recordTransaction('DEPOSIT', amount);
    return true;
  }
  
  // PUBLIC METHOD: Authentication before sensitive operation
  public withdraw(amount: number, inputPin: string): boolean {
    // Verify PIN (private field)
    if (!this.verifyPin(inputPin)) {
      throw new Error('Invalid PIN');
    }
    
    // Check sufficient balance (private field)
    if (amount > this.balance) {
      throw new Error('Insufficient funds');
    }
    
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }
    
    this.balance -= amount;
    this.recordTransaction('WITHDRAWAL', amount);
    return true;
  }
  
  // PRIVATE METHOD: Internal implementation detail
  private verifyPin(inputPin: string): boolean {
    return this.pin === inputPin;
  }
  
  // PRIVATE METHOD: Not exposed to outside
  private recordTransaction(type: string, amount: number): void {
    this.transactionHistory.push({
      type,
      amount,
      date: new Date()
    });
  }
  
  // PROTECTED METHOD: Available to subclasses
  protected calculateInterest(rate: number): number {
    return this.balance * rate;
  }
  
  // PUBLIC METHOD: Returns copy of private data
  public getTransactionHistory(): Array<{ type: string; amount: number; date: Date }> {
    // Return deep copy to prevent external modification
    return this.transactionHistory.map(t => ({ ...t, date: new Date(t.date) }));
  }
  
  // GETTER: Provides read-only access to private field
  public get accountAge(): number {
    const now = new Date();
    return now.getFullYear() - this.accountCreationDate.getFullYear();
  }
  
  // No setter for accountCreationDate because it's readonly!
}

// Creating account
const account = new Bank Account('Alice Johnson', 1000, '1234', 'TechBank');

// ✅ ALLOWED: Public members and methods
console.log(account.accountNumber);      // "ACC1000"
console.log(account.accountHolder);      // "Alice Johnson"
console.log(account.getBalance());       // 1000
account.deposit(500);                    // Works!
console.log(account.getBalance());       // 1500

// ❌ NOT ALLOWED: Private members
// console.log(account.balance);         // ERROR! Private property
// console.log(account.pin);             // ERROR! Private property
// account.verifyPin('1234');            // ERROR! Private method
// account.recordTransaction('TEST', 100); // ERROR! Private method

// ❌ NOT ALLOWED: Protected members (outside class)
// console.log(account.bankName);        // ERROR! Protected property
// account.calculateInterest(0.05);      // ERROR! Protected method

// ✅ ALLOWED: Public method with validation
try {
  account.withdraw(200, '1234'); // Works! Correct PIN
  console.log(account.getBalance()); // 1300
} catch (error) {
  console.error(error.message);
}

try {
  account.withdraw(200, '9999'); // Fails! Wrong PIN
} catch (error) {
  console.error(error.message); // "Invalid PIN"
}

// ✅ ALLOWED: Get copy of private data
const history = account.getTransactionHistory();
console.log(history); // Array of transactions

// Modifying returned history doesn't affect internal state
history.push({ type: 'FAKE', amount: 999, date: new Date() });
console.log(account.getTransactionHistory().length); // Still original length!


// ===================================================================
// PART 2: PROTECTED MEMBERS AND INHERITANCE
// ===================================================================

class SavingsAccount extends BankAccount {
  private interestRate: number;
  private minimumBalance: number;
  
  constructor(
    accountHolder: string,
    initialBalance: number,
    pin: string,
    interestRate: number
  ) {
    super(accountHolder, initialBalance, pin, 'TechBank');
    this.interestRate = interestRate;
    this.minimumBalance = 1000;
    
    // ✅ Can access protected member from parent
    this.accountType = 'SAVINGS';
  }
  
  // Public method using protected method from parent
  public addInterest(): void {
    // ✅ Can call protected method from parent class
    const interest = this.calculateInterest(this.interestRate);
    
    // ✅ Can access protected field from parent
    console.log(`Adding interest to ${this.bankName} account`);
    
    this.deposit(interest);
    
    // ❌ CANNOT access private members from parent
    // console.log(this.balance); // ERROR! Private to BankAccount
    // this.verifyPin('1234'); // ERROR! Private method
  }
  
  // Override protected method
  protected calculateInterest(rate: number): number {
    // Custom interest calculation for savings account
    const baseInterest = super.calculateInterest(rate);
    
    // Bonus interest if balance > minimum
    if (this.getBalance() > this.minimumBalance) {
      return baseInterest * 1.1; // 10% bonus
    }
    
    return baseInterest;
  }
  
  public displayAccountInfo(): void {
    // ✅ Public members from parent
    console.log(`Account Number: ${this.accountNumber}`);
    console.log(`Account Holder: ${this.accountHolder}`);
    
    // ✅ Protected members from parent
    console.log(`Bank: ${this.bankName}`);
    console.log(`Type: ${this.accountType}`);
    
    // ✅ Public methods from parent
    console.log(`Balance: ${this.getBalance()}`);
    
    // ❌ Private members from parent
    // console.log(this.balance); // ERROR!
    // console.log(this.pin); // ERROR!
  }
}

const savingsAccount = new SavingsAccount('Bob Smith', 5000, '5678', 0.05);
savingsAccount.addInterest(); // Works!
savingsAccount.displayAccountInfo();


// ===================================================================
// PART 3: GETTERS AND SETTERS (Property Accessors)
// ===================================================================

class UserProfile {
  private _age: number;
  private _email: string;
  private _username: string;
  private readonly _userId: string;
  
  constructor(username: string, email: string, age: number) {
    this._userId = `user_${Date.now()}_${Math.random()}`;
    this._username = username;
    this._email = email;
    this._age = age;
  }
  
  // GETTER: Provides read access with computed value
  public get age(): number {
    return this._age;
  }
  
  // SETTER: Provides write access with validation
  public set age(value: number) {
    if (value < 0 || value > 150) {
      throw new Error('Invalid age');
    }
    this._age = value;
  }
  
  // GETTER with transformation
  public get email(): string {
    return this._email.toLowerCase();
  }
  
  // SETTER with validation
  public set email(value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
    this._email = value;
  }
  
  // GETTER ONLY (read-only property)
  public get userId(): string {
    return this._userId;
  }
  
  // No setter for userId - it's immutable!
  
  // COMPUTED PROPERTY (no backing field)
  public get displayName(): string {
    return `${this._username} (${this._age} years old)`;
  }
  
  // GETTER with privacy protection
  public get username(): string {
    // Mask part of username for privacy
    if (this._username.length > 3) {
      return this._username.substring(0, 3) + '***';
    }
    return this._username;
  }
}

// Usage
const profile = new UserProfile('john_doe', 'JOHN@EXAMPLE.COM', 30);

// Using getters (like properties)
console.log(profile.age);          // 30
console.log(profile.email);        // "john@example.com" (lowercase)
console.log(profile.userId);       // "user_1234567890_0.123"
console.log(profile.displayName);  // "john_doe (30 years old)"
console.log(profile.username);     // "joh***"

// Using setters (like properties)
profile.age = 31;                  // ✅ Valid
console.log(profile.age);          // 31

try {
  profile.age = -5;                // ❌ Validation fails
} catch (error) {
  console.error(error.message);    // "Invalid age"
}

try {
  profile.email = 'invalid-email'; // ❌ Validation fails
} catch (error) {
  console.error(error.message);    // "Invalid email format"
}

// ❌ Cannot set readonly property
// profile.userId = 'new_id';      // ERROR! No setter defined


// ===================================================================
// PART 4: EXPRESS.JS REAL-WORLD EXAMPLE - USER SESSION MANAGEMENT
// ===================================================================

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

class SessionManager {
  // Private: Session data storage
  private static sessions: Map<string, SessionData> = new Map();
  
  // Private: Configuration
  private static readonly SESSION_TIMEOUT_MS: number = 3600000; // 1 hour
  private static readonly MAX_SESSIONS_PER_USER: number = 3;
  
  // Private: Cleanup interval
  private static cleanupInterval: NodeJS.Timeout | null = null;
  
  // Private: Session data structure
  private sessionId: string;
  private userId: string;
  private createdAt: Date;
  private lastAccessedAt: Date;
  private data: Record<string, any>;
  
  private constructor(userId: string) {
    this.sessionId = uuidv4();
    this.userId = userId;
    this.createdAt = new Date();
    this.lastAccessedAt = new Date();
    this.data = {};
  }
  
  // PUBLIC: Create new session
  public static createSession(userId: string): SessionManager {
    // Enforce session limit per user
    const userSessions = Array.from(SessionManager.sessions.values())
      .filter(session => session.userId === userId);
    
    if (userSessions.length >= SessionManager.MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      const oldest = userSessions.sort((a, b) => 
        a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime()
      )[0];
      SessionManager.sessions.delete(oldest.sessionId);
    }
    
    const session = new SessionManager(userId);
    SessionManager.sessions.set(session.sessionId, session);
    
    // Start cleanup if not already running
    if (!SessionManager.cleanupInterval) {
      SessionManager.startCleanup();
    }
    
    return session;
  }
  
  // PUBLIC: Get existing session
  public static getSession(sessionId: string): SessionManager | null {
    const session = SessionManager.sessions.get(sessionId);
    
    if (session) {
      if (session.isExpired()) {
        SessionManager.sessions.delete(sessionId);
        return null;
      }
      session.touch();
    }
    
    return session || null;
  }
  
  // PUBLIC: Destroy session
  public static destroySession(sessionId: string): boolean {
    return SessionManager.sessions.delete(sessionId);
  }
  
  // PRIVATE: Cleanup expired sessions
  private static cleanup(): void {
    const now = Date.now();
    for (const [sessionId, session] of SessionManager.sessions.entries()) {
      if (session.isExpired()) {
        SessionManager.sessions.delete(sessionId);
      }
    }
  }
  
  // PRIVATE: Start automatic cleanup
  private static startCleanup(): void {
    SessionManager.cleanupInterval = setInterval(() => {
      SessionManager.cleanup();
    }, 300000); // Every 5 minutes
  }
  
  // PUBLIC: Get session ID (readonly)
  public get id(): string {
    return this.sessionId;
  }
  
  // PUBLIC: Get user ID (readonly)
  public get user(): string {
    return this.userId;
  }
  
  // PUBLIC: Set session data
  public set(key: string, value: any): void {
    this.data[key] = value;
    this.touch();
  }
  
  // PUBLIC: Get session data
  public get(key: string): any {
    this.touch();
    return this.data[key];
  }
  
  // PRIVATE: Check if session expired
  private isExpired(): boolean {
    const now = Date.now();
    const age = now - this.lastAccessedAt.getTime();
    return age > SessionManager.SESSION_TIMEOUT_MS;
  }
  
  // PRIVATE: Update last accessed time
  private touch(): void {
    this.lastAccessedAt = new Date();
  }
  
  // PUBLIC: Get session age (readonly computed property)
  public get age(): number {
    return Date.now() - this.createdAt.getTime();
  }
}

// Express.js middleware
const app = express();

app.use(express.json());

// Middleware: Extract session from cookie
app.use((req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.cookies?.sessionId;
  
  if (sessionId) {
    const session = SessionManager.getSession(sessionId);
    if (session) {
      (req as any).session = session;
    }
  }
  
  next();
});

// Login endpoint
app.post('/api/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  // Authenticate user (simplified)
  if (username && password) {
    const session = SessionManager.createSession(username);
    
    res.cookie('sessionId', session.id, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000
    });
    
    session.set('username', username);
    session.set('loginTime', new Date());
    
    res.json({ message: 'Login successful', sessionId: session.id });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected endpoint
app.get('/api/profile', (req: Request, res: Response) => {
  const session = (req as any).session;
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({
    username: session.get('username'),
    sessionAge: session.age,
    loginTime: session.get('loginTime')
  });
});

// Logout endpoint
app.post('/api/logout', (req: Request, res: Response) => {
  const session = (req as any).session;
  
  if (session) {
    SessionManager.destroySession(session.id);
  }
  
  res.clearCookie('sessionId');
  res.json({ message: 'Logout successful' });
});


// ===================================================================
// PART 5: WHY ENCAPSULATION MATTERS
// ===================================================================

// ❌ BAD: No encapsulation
class BadBankAccount {
  public balance: number;
  public pin: string;
  
  constructor(initialBalance: number, pin: string) {
    this.balance = initialBalance;
    this.pin = pin;
  }
}

const badAccount = new BadBankAccount(1000, '1234');

// Anyone can do this:
badAccount.balance = 1000000; // Instant millionaire!
badAccount.pin = '0000';      // Changed PIN without verification
console.log(badAccount.pin);  // Security breach!

// ✅ GOOD: Proper encapsulation
class GoodBankAccount {
  private balance: number;
  private pin: string;
  
  constructor(initialBalance: number, pin: string) {
    this.balance = initialBalance;
    this.pin = pin;
  }
  
  public getBalance(): number {
    return this.balance;
  }
  
  public withdraw(amount: number, inputPin: string): boolean {
    if (this.pin !== inputPin) {
      throw new Error('Invalid PIN');
    }
    
    if (amount > this.balance) {
      throw new Error('Insufficient funds');
    }
    
    this.balance -= amount;
    return true;
  }
  
  public changePin(oldPin: string, newPin: string): boolean {
    if (this.pin !== oldPin) {
      throw new Error('Invalid old PIN');
    }
    
    if (newPin.length !== 4) {
      throw new Error('PIN must be 4 digits');
    }
    
    this.pin = newPin;
    return true;
  }
}

const goodAccount = new GoodBankAccount(1000, '1234');

// ❌ Cannot access private members directly
// goodAccount.balance = 1000000; // ERROR!
// goodAccount.pin = '0000'; // ERROR!

// ✅ Must use controlled methods
goodAccount.withdraw(100, '1234'); // Works with correct PIN
goodAccount.changePin('1234', '5678'); // Validates old PIN


// ===================================================================
// KEY TAKEAWAYS
// ===================================================================

/*
ACCESS MODIFIERS:

1. PUBLIC:
   - Accessible from anywhere
   - Use for: API methods, properties meant to be accessed externally
   - Example: user.login(), product.getName()

2. PRIVATE:
   - Only accessible within the same class
   - Use for: Implementation details, sensitive data, helper methods
   - Example: hashPassword(), balance, pin
   - Memory: Still allocated for each instance, just not accessible

3. PROTECTED:
   - Accessible in class and its subclasses
   - Use for: Methods/properties that subclasses need
   - Example: validateInput(), basePrice
   - Allows extensibility while hiding from external code

4. READONLY:
   - Can only be set in constructor
   - Use for: Immutable properties, IDs, timestamps
   - Example: userId, createdAt
   - Prevents accidental modification

BEST PRACTICES:

✅ DO:
- Make fields private by default
- Use getters/setters for controlled access
- Validate input in setters
- Return copies of mutable objects
- Use protected for extension points
- Document public API thoroughly

❌ DON'T:
- Make everything public
- Expose internal state directly
- Skip validation in setters
- Return references to private collections
- Use public for implementation details

BENEFITS OF ENCAPSULATION:
1. Security: Hide sensitive data (passwords, keys)
2. Validation: Enforce business rules (age > 0, valid email)
3. Flexibility: Change implementation without breaking code
4. Maintainability: Clear separation of interface and implementation
5. Debugging: Control how state is modified
6. Consistency: Ensure data remains valid

COMMON PATTERNS:
- Getters/Setters: Controlled access with validation
- Factory Methods: Control object creation
- Singleton: Private constructor + static instance
- Builder: Step-by-step object construction
*/
```

Would you like me to continue with more OOP concepts like Inheritance, Polymorphism, SOLID Principles, and Design Patterns? I can create 10-15 more detailed questions covering all intermediate-level OOP topics with Express.js/Node.js examples in TypeScript.