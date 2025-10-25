# Microservices Architecture Interview Questions
## (For 2 Years Experience with HTTP-based Synchronous Communication)

---

## **CORE MICROSERVICES CONCEPTS**

### **1. Fundamental Questions**

**Q: What are microservices? Why use them over monolithic architecture?**

**Answer:**
```
Microservices: Architectural style where application is built as collection 
of small, independent services, each running in its own process.

Advantages:
- Independent deployment
- Technology flexibility (different languages/databases per service)
- Scalability (scale only needed services)
- Fault isolation (one service failure doesn't crash entire system)
- Team autonomy (separate teams for separate services)

Disadvantages:
- Increased complexity
- Network latency
- Distributed system challenges
- More difficult testing/debugging
```

**Q: When would you NOT use microservices?**

**Answer:**
```
Don't use microservices when:
- Small team (< 5 developers)
- Simple application with minimal complexity
- Tight deadlines (monolith faster initially)
- Limited DevOps capability
- Application domain is unclear
- High network latency concerns
```

---

## **YOUR PROJECT-SPECIFIC QUESTIONS**

### **2. Synchronous HTTP Communication**

**Q: You're using synchronous HTTP calls between microservices. What are the challenges?**

**Answer:**
```
Challenges:
1. Cascading failures - if one service is down, dependent services fail
2. Increased latency - multiple network hops add delay
3. Tight coupling - services depend on each other's availability
4. Timeout handling - need proper timeout configuration
5. Network issues - unreliable network can cause failures

Example: User Service → Order Service → Payment Service → Inventory Service
If Inventory is down, entire chain fails.
```

**Q: How do you handle failures in synchronous HTTP calls between microservices?**

**Solutions:**

**1. Circuit Breaker Pattern:**
```javascript
const CircuitBreaker = require('opossum');

class OrderService {
  constructor() {
    // Configure circuit breaker
    const options = {
      timeout: 3000, // 3 seconds
      errorThresholdPercentage: 50, // Open circuit at 50% failure
      resetTimeout: 30000 // Try again after 30 seconds
    };

    this.inventoryBreaker = new CircuitBreaker(
      this.callInventoryService.bind(this),
      options
    );

    // Fallback when circuit is open
    this.inventoryBreaker.fallback(() => {
      return { available: false, message: 'Service temporarily unavailable' };
    });
  }

  async callInventoryService(productId) {
    const response = await fetch(`${INVENTORY_SERVICE}/check/${productId}`);
    return response.json();
  }

  async getInventory(productId) {
    return await this.inventoryBreaker.fire(productId);
  }
}
```

**2. Retry with Exponential Backoff:**
```javascript
const axios = require('axios');
const axiosRetry = require('axios-retry');

// Configure axios with retry logic
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // 1s, 2s, 3s
  },
  retryCondition: (error) => {
    return error.response?.status >= 500;
  }
});

// Usage
async function callPaymentService(data) {
  try {
    const response = await axios.post(`${PAYMENT_SERVICE}/charge`, data, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('Payment service failed after retries:', error);
    throw error;
  }
}
```

**3. Timeout Configuration:**
```javascript
const axios = require('axios');

async function getUserData(userId) {
  try {
    const response = await axios.get(`${USER_SERVICE}/users/${userId}`, {
      timeout: 3000 // 3 seconds timeout
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      // Timeout occurred - return cached data
      return await getCachedUserData(userId);
    }
    throw error;
  }
}
```

**4. Fallback Mechanisms:**
```javascript
async function getUserRecommendations(userId) {
  try {
    const response = await fetch(`${RECOMMENDATION_SERVICE}/users/${userId}/recommendations`);
    if (!response.ok) throw new Error('Service unavailable');
    return await response.json();
  } catch (error) {
    console.warn('Recommendation service failed, using fallback');
    // Fallback to popular items
    return await getPopularItems();
  }
}
```

**Q: Your Order Service calls Payment Service which calls Notification Service. Payment fails but order is created. How do you handle this?**

**Answer - Saga Pattern with Compensating Transactions:**

```javascript
class OrderSaga {
  async createOrder(orderData) {
    let order = null;
    let payment = null;
    let inventory = null;

    try {
      // Step 1: Create order (PENDING status)
      order = await this.orderRepository.create({
        ...orderData,
        status: 'PENDING'
      });
      console.log(`Order created: ${order.id}`);

      // Step 2: Process payment
      payment = await this.paymentService.charge({
        amount: order.totalAmount,
        userId: order.userId,
        orderId: order.id
      });
      console.log(`Payment processed: ${payment.id}`);

      // Step 3: Reserve inventory
      inventory = await this.inventoryService.reserve({
        items: order.items,
        orderId: order.id
      });
      console.log(`Inventory reserved: ${inventory.id}`);

      // Success: Mark order as CONFIRMED
      await this.orderRepository.update(order.id, { status: 'CONFIRMED' });
      
      // Send confirmation email
      await this.notificationService.sendOrderConfirmation(order);

      return order;

    } catch (error) {
      console.error('Saga failed, executing compensating transactions:', error);

      // Compensating transactions (rollback)
      if (inventory) {
        await this.inventoryService.release(inventory.id);
        console.log('Inventory released');
      }

      if (payment) {
        await this.paymentService.refund(payment.id);
        console.log('Payment refunded');
      }

      if (order) {
        await this.orderRepository.update(order.id, { 
          status: 'CANCELLED',
          cancellationReason: error.message 
        });
        console.log('Order cancelled');
      }

      throw new Error(`Order creation failed: ${error.message}`);
    }
  }
}

// Usage
const orderSaga = new OrderSaga();
try {
  const order = await orderSaga.createOrder(orderData);
  res.status(201).json(order);
} catch (error) {
  res.status(400).json({ error: error.message });
}
```

---

## **REAL-WORLD SCENARIOS**

### **3. Service Discovery**

**Q: You have 10 microservices. How does Service A know the URL of Service B, especially when instances scale up/down?**

**Answer:**
```
Solution: Service Discovery

Options:
1. Client-Side Discovery (Eureka, Consul)
   - Service registers itself with registry
   - Client queries registry for service location
   - Client does load balancing

2. Server-Side Discovery (Kubernetes Service, AWS ELB)
   - Load balancer queries registry
   - Client calls load balancer

3. DNS-Based (Kubernetes DNS)
   - Service accessed via DNS name
   - DNS resolves to available instances
```

**Example with Consul:**
```javascript
const Consul = require('consul');

const consul = new Consul({
  host: 'localhost',
  port: 8500
});

// Register service on startup
async function registerService() {
  await consul.agent.service.register({
    name: 'order-service',
    id: 'order-service-1',
    address: '192.168.1.10',
    port: 8080,
    check: {
      http: 'http://192.168.1.10:8080/health',
      interval: '10s',
      timeout: '5s'
    }
  });
  console.log('Service registered with Consul');
}

// Discover service when making calls
async function getPaymentServiceUrl() {
  const result = await consul.health.service({
    service: 'payment-service',
    passing: true
  });

  if (result && result.length > 0) {
    const service = result[0].Service;
    return `http://${service.Address}:${service.Port}`;
  }
  throw new Error('Payment service not available');
}

// Usage
async function processPayment(paymentData) {
  const serviceUrl = await getPaymentServiceUrl();
  const response = await axios.post(`${serviceUrl}/charge`, paymentData);
  return response.data;
}
```

### **4. API Gateway**

**Q: You have multiple microservices. Mobile app needs data from 5 different services. How do you optimize this?**

**Answer - API Gateway Pattern:**
```
Without Gateway:
Mobile → User Service
Mobile → Order Service  
Mobile → Product Service
Mobile → Cart Service
Mobile → Recommendation Service
(5 network calls, slow)

With Gateway:
Mobile → API Gateway → All Services (in parallel)
(1 network call, faster)

API Gateway benefits:
- Single entry point
- Request aggregation
- Authentication/Authorization at one place
- Rate limiting
- Protocol translation (REST to gRPC)
- Caching
```

**Example:**
```javascript
const express = require('express');
const axios = require('axios');
const app = express();

// API Gateway - User Dashboard endpoint
app.get('/api/user-dashboard/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Parallel calls to multiple services
    const [userData, orders, recommendations, cart, wishlist] = await Promise.all([
      axios.get(`${USER_SERVICE}/users/${userId}`),
      axios.get(`${ORDER_SERVICE}/users/${userId}/orders`),
      axios.get(`${RECOMMENDATION_SERVICE}/users/${userId}/recommendations`),
      axios.get(`${CART_SERVICE}/users/${userId}/cart`),
      axios.get(`${WISHLIST_SERVICE}/users/${userId}/wishlist`)
    ]);

    // Aggregate response
    const dashboard = {
      user: userData.data,
      recentOrders: orders.data.slice(0, 5),
      recommendations: recommendations.data,
      cartItemCount: cart.data.items.length,
      wishlistItemCount: wishlist.data.items.length
    };

    res.json(dashboard);

  } catch (error) {
    console.error('Dashboard fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// With error handling for individual service failures
app.get('/api/user-dashboard-resilient/:userId', async (req, res) => {
  const { userId } = req.params;

  const [userData, orders, recommendations] = await Promise.allSettled([
    axios.get(`${USER_SERVICE}/users/${userId}`),
    axios.get(`${ORDER_SERVICE}/users/${userId}/orders`),
    axios.get(`${RECOMMENDATION_SERVICE}/users/${userId}/recommendations`)
  ]);

  const dashboard = {
    user: userData.status === 'fulfilled' ? userData.value.data : null,
    recentOrders: orders.status === 'fulfilled' ? orders.value.data : [],
    recommendations: recommendations.status === 'fulfilled' ? recommendations.value.data : []
  };

  res.json(dashboard);
});

app.listen(3000, () => console.log('API Gateway running on port 3000'));
```

### **5. Database per Service**

**Q: Each microservice has its own database. How do you handle joins across services?**

**Answer:**
```
Problem: Order Service needs User data, but User DB is separate

Solutions:

1. API Composition (Synchronous):
   - Order Service calls User Service API
   - Aggregate data in application layer

2. Data Duplication (Eventual Consistency):
   - Store minimal user data in Order Service DB
   - Update via events when user data changes

3. CQRS (Command Query Responsibility Segregation):
   - Separate read and write models
   - Materialized view for queries

4. Backend for Frontend (BFF):
   - Dedicated service for specific UI needs
   - Handles data aggregation
```

**Solution 1 - API Composition:**
```javascript
// Order Service
class OrderService {
  async getOrderWithUserDetails(orderId) {
    // Get order from local database
    const order = await this.orderRepository.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Fetch user details from User Service
    const userResponse = await axios.get(`${USER_SERVICE}/users/${order.userId}`);
    const user = userResponse.data;

    // Combine data
    return {
      ...order,
      userDetails: {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    };
  }

  // For multiple orders
  async getOrdersWithUserDetails(orderIds) {
    const orders = await this.orderRepository.findByIds(orderIds);
    
    // Get unique user IDs
    const userIds = [...new Set(orders.map(o => o.userId))];
    
    // Batch fetch users (if User Service supports it)
    const usersResponse = await axios.post(`${USER_SERVICE}/users/batch`, {
      ids: userIds
    });
    const usersMap = new Map(usersResponse.data.map(u => [u.id, u]));

    // Combine data
    return orders.map(order => ({
      ...order,
      userDetails: usersMap.get(order.userId)
    }));
  }
}
```

**Solution 2 - Data Duplication:**
```javascript
// Order Service with duplicated user data
const orderSchema = new mongoose.Schema({
  orderId: String,
  userId: String,
  // Duplicated user data for quick access
  userName: String,
  userEmail: String,
  userPhone: String,
  items: Array,
  totalAmount: Number,
  status: String,
  createdAt: Date
});

// When creating order, store user snapshot
async function createOrder(orderData, userId) {
  // Fetch user details
  const user = await axios.get(`${USER_SERVICE}/users/${userId}`);
  
  // Create order with user snapshot
  const order = await Order.create({
    ...orderData,
    userId: user.data.id,
    userName: user.data.name,
    userEmail: user.data.email,
    userPhone: user.data.phone
  });

  return order;
}

// Listen to user update events to sync data
const EventEmitter = require('events');
const eventBus = new EventEmitter();

eventBus.on('user.updated', async (userData) => {
  // Update all orders for this user
  await Order.updateMany(
    { userId: userData.id },
    {
      $set: {
        userName: userData.name,
        userEmail: userData.email,
        userPhone: userData.phone
      }
    }
  );
  console.log(`Updated user data in orders for user ${userData.id}`);
});
```

**Q: User Service is down. Order Service needs user email to send confirmation. What do you do?**

**Answer:**
```javascript
const NodeCache = require('node-cache');
const userCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL

class OrderService {
  async getUserData(userId) {
    // Try cache first
    let user = userCache.get(`user:${userId}`);
    
    if (user) {
      console.log('User data from cache');
      return user;
    }

    try {
      // Fetch from User Service
      const response = await axios.get(`${USER_SERVICE}/users/${userId}`, {
        timeout: 3000
      });
      user = response.data;
      
      // Cache for future use
      userCache.set(`user:${userId}`, user);
      return user;
      
    } catch (error) {
      console.error('User service unavailable:', error.message);
      
      // Check database for duplicated data
      const order = await Order.findOne({ userId }).select('userName userEmail');
      if (order) {
        return {
          name: order.userName,
          email: order.userEmail
        };
      }
      
      throw new Error('Unable to fetch user data');
    }
  }

  async createOrderAndSendEmail(orderData) {
    const order = await this.createOrder(orderData);

    try {
      const user = await this.getUserData(orderData.userId);
      await this.sendOrderConfirmation(order, user.email);
    } catch (error) {
      // Queue email for later if user service is down
      await this.emailQueue.add('send-order-confirmation', {
        orderId: order.id,
        userId: orderData.userId
      });
      console.log('Email queued for retry');
    }

    return order;
  }
}
```

---

## **DEPLOYMENT & SCALING**

### **6. Scaling Scenarios**

**Q: Your Product Service is getting 10x more traffic than other services. How do you handle it?**

**Answer:**
```
1. Horizontal Scaling:
   Deploy multiple instances of Product Service
   Use load balancer to distribute traffic
   
   Before: 1 instance handling 10,000 req/sec
   After: 5 instances handling 2,000 req/sec each

2. Caching:
   Cache product catalog (Redis/Memcached)
   Reduce database load

3. Database Read Replicas:
   Master for writes, replicas for reads
   Product reads go to replicas

4. CDN for Images:
   Serve product images from CDN
   Reduce service load

5. Rate Limiting:
   Protect service from overload
```

**Example with Redis Caching:**
```javascript
const redis = require('redis');
const client = redis.createClient({ host: 'localhost', port: 6379 });

class ProductService {
  async getProduct(productId) {
    const cacheKey = `product:${productId}`;

    // Try cache first
    const cached = await client.get(cacheKey);
    if (cached) {
      console.log('Cache hit');
      return JSON.parse(cached);
    }

    // Cache miss - fetch from database
    console.log('Cache miss - fetching from DB');
    const product = await this.productRepository.findById(productId);

    if (product) {
      // Store in cache for 1 hour
      await client.setEx(cacheKey, 3600, JSON.stringify(product));
    }

    return product;
  }

  async updateProduct(productId, updates) {
    // Update database
    const product = await this.productRepository.update(productId, updates);

    // Invalidate cache
    await client.del(`product:${productId}`);

    return product;
  }

  // Bulk fetch with caching
  async getProducts(productIds) {
    const results = [];
    const uncachedIds = [];

    // Check cache for each product
    for (const id of productIds) {
      const cached = await client.get(`product:${id}`);
      if (cached) {
        results.push(JSON.parse(cached));
      } else {
        uncachedIds.push(id);
      }
    }

    // Fetch uncached products from DB
    if (uncachedIds.length > 0) {
      const products = await this.productRepository.findByIds(uncachedIds);
      
      // Cache them
      for (const product of products) {
        await client.setEx(`product:${product.id}`, 3600, JSON.stringify(product));
        results.push(product);
      }
    }

    return results;
  }
}
```

**Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api/', limiter);

// Per-user rate limiter
const Redis = require('ioredis');
const redisClient = new Redis();

async function userRateLimiter(req, res, next) {
  const userId = req.user.id;
  const key = `rate_limit:${userId}`;
  
  const requests = await redisClient.incr(key);
  
  if (requests === 1) {
    await redisClient.expire(key, 60); // 1 minute window
  }
  
  if (requests > 100) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      retryAfter: await redisClient.ttl(key)
    });
  }
  
  next();
}

app.use('/api/protected', userRateLimiter);
```

**Q: How do you deploy a new version of a microservice without downtime?**

**Answer - Deployment Strategies:**

**1. Blue-Green Deployment:**
```yaml
# Kubernetes example
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
    version: blue  # Switch to 'green' when ready
  ports:
    - port: 80
      targetPort: 8080

---
# Blue deployment (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
      version: blue
  template:
    metadata:
      labels:
        app: order-service
        version: blue
    spec:
      containers:
      - name: order-service
        image: order-service:v1.0

---
# Green deployment (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
      version: green
  template:
    metadata:
      labels:
        app: order-service
        version: green
    spec:
      containers:
      - name: order-service
        image: order-service:v2.0

# Steps:
# 1. Deploy green (v2.0)
# 2. Test green deployment
# 3. Switch service selector from blue to green
# 4. Monitor for issues
# 5. If issues, switch back to blue (instant rollback)
# 6. If successful, delete blue deployment
```

**2. Canary Deployment with Express:**
```javascript
const express = require('express');
const app = express();

// Simple canary routing
app.use((req, res, next) => {
  const canaryPercentage = 10; // 10% to new version
  const random = Math.random() * 100;

  if (random < canaryPercentage) {
    req.targetVersion = 'v2';
  } else {
    req.targetVersion = 'v1';
  }
  next();
});

app.get('/api/orders', async (req, res) => {
  const serviceUrl = req.targetVersion === 'v2' 
    ? 'http://order-service-v2:8080' 
    : 'http://order-service-v1:8080';

  const response = await axios.get(`${serviceUrl}/orders`);
  res.json(response.data);
});

// Progressive canary with feature flags
const canaryConfig = {
  percentage: 10,
  increasement: 10,
  monitoringPeriod: 300000 // 5 minutes
};

async function progressiveCanary() {
  while (canaryConfig.percentage < 100) {
    console.log(`Canary at ${canaryConfig.percentage}%`);
    
    // Wait for monitoring period
    await new Promise(resolve => setTimeout(resolve, canaryConfig.monitoringPeriod));
    
    // Check error rates
    const errorRate = await getErrorRate('v2');
    
    if (errorRate > 5) {
      console.log('High error rate detected, rolling back');
      canaryConfig.percentage = 0;
      break;
    }
    
    // Increase canary percentage
    canaryConfig.percentage += canaryConfig.increasement;
  }
  
  console.log('Canary deployment complete');
}
```

### **7. Monitoring & Debugging**

**Q: User reports "Order failed" but you have 10 microservices. How do you debug?**

**Answer - Distributed Tracing:**

```javascript
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Configure logger with trace ID
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Middleware to handle trace ID
app.use((req, res, next) => {
  // Get trace ID from header or generate new one
  req.traceId = req.headers['x-trace-id'] || uuidv4();
  
  // Add to response headers
  res.setHeader('x-trace-id', req.traceId);
  
  next();
});

// Order Service
app.post('/api/orders', async (req, res) => {
  const { traceId } = req;
  
  logger.info({
    traceId,
    service: 'order-service',
    action: 'create_order_start',
    userId: req.body.userId
  });

  try {
    // Create order
    const order = await createOrder(req.body);
    
    logger.info({
      traceId,
      service: 'order-service',
      action: 'order_created',
      orderId: order.id
    });

    // Call payment service with trace ID
    const paymentResponse = await axios.post(
      `${PAYMENT_SERVICE}/charge`,
      { orderId: order.id, amount: order.total },
      { headers: { 'x-trace-id': traceId } }
    );

    logger.info({
      traceId,
      service: 'order-service',
      action: 'payment_completed',
      paymentId: paymentResponse.data.id
    });

    res.json(order);

  } catch (error) {
    logger.error({
      traceId,
      service: 'order-service',
      action: 'create_order_failed',
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({ error: 'Order creation failed', traceId });
  }
});

// Payment Service
app.post('/charge', async (req, res) => {
  const traceId = req.headers['x-trace-id'];
  
  logger.info({
    traceId,
    service: 'payment-service',
    action: 'charge_start',
    orderId: req.body.orderId
  });

  try {
    const payment = await processPayment(req.body);
    
    logger.info({
      traceId,
      service: 'payment-service',
      action: 'charge_success',
      paymentId: payment.id
    });

    // Call notification service
    await axios.post(
      `${NOTIFICATION_SERVICE}/send`,
      { type: 'payment_confirmation', orderId: req.body.orderId },
      { headers: { 'x-trace-id': traceId } }
    );

    res.json(payment);

  } catch (error) {
    logger.error({
      traceId,
      service: 'payment-service',
      action: 'charge_failed',
      error: error.message
    });

    res.status(500).json({ error: 'Payment failed', traceId });
  }
});

// Now you can search logs by traceId to see entire request flow:
// traceId: "abc-123" 
// Shows: order-service → payment-service → notification-service
```

**Health Check Implementation:**
```javascript
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');

const app = express();
const redisClient = redis.createClient();

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'order-service',
    version: '1.0.0',
    dependencies: {}
  };

  // Check MongoDB
  try {
    await mongoose.connection.db.admin().ping();
    health.dependencies.mongodb = { status: 'UP' };
  } catch (error) {
    health.dependencies.mongodb = { 
      status: 'DOWN', 
      error: error.message 
    };
    health.status = 'DOWN';
  }

  // Check Redis
  try {
    await redisClient.ping();
    health.dependencies.redis = { status: 'UP' };
  } catch (error) {
    health.dependencies.redis = { 
      status: 'DOWN', 
      error: error.message 
    };
    health.status = 'DOWN';
  }

  // Check dependent services
  try {
    const paymentHealth = await axios.get(`${PAYMENT_SERVICE}/health`, {
      timeout: 2000
    });
    health.dependencies.paymentService = { status: 'UP' };
  } catch (error) {
    health.dependencies.paymentService = { status: 'DOWN' };
  }

  const statusCode = health.status === 'UP' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness probe (can service handle traffic?)
app.get('/health/ready', async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const isRedisConnected = redisClient.isReady;

  if (isDbConnected && isRedisConnected) {
    res.status(200).json({ status: 'READY' });
  } else {
    res.status(503).json({ status: 'NOT_READY' });
  }
});

// Liveness probe (is service alive?)
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ALIVE' });
});
```

**Q: How do you monitor health of 20 microservices?**

**Answer with Prometheus Metrics:**

```javascript
const express = require('express');
const client = require('prom-client');

const app = express();

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const orderProcessingTime = new client.Summary({
  name: 'order_processing_duration_seconds',
  help: 'Order processing duration',
  labelNames: ['status'],
  percentiles: [0.5, 0.9, 0.95, 0.99]
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(orderProcessingTime);

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
    
    activeConnections.dec();
  });

  next();
});

// Expose metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Business metrics
app.post('/api/orders', async (req, res) => {
  const end = orderProcessingTime.startTimer();
  
  try {
    const order = await createOrder(req.body);
    end({ status: 'success' });
    res.json(order);
  } catch (error) {
    end({ status: 'failed' });
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);