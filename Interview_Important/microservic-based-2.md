

## **SECURITY**

### **8. Authentication & Authorization**

**Q: How do you handle authentication in microservices? Each service needs to verify user identity.**

**Answer - JWT Token Approach:**

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth Service - Login endpoint
const authApp = express();

authApp.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verify user credentials
    const user = await User.findOne({ email });
    
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles: user.roles, // ['user', 'admin']
        permissions: user.permissions // ['read:orders', 'write:orders']
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      refreshToken,
      expiresIn: 86400 // 24 hours in seconds
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token endpoint
authApp.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token: newToken });

  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Middleware to verify JWT (used in all microservices)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Role-based authorization middleware
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.roles
      });
    }

    next();
  };
}

// Permission-based authorization
function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermission = requiredPermissions.every(permission =>
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredPermissions
      });
    }

    next();
  };
}

// Order Service - Protected endpoints
const orderApp = express();

// Public endpoint - no auth
orderApp.get('/api/orders/public', (req, res) => {
  res.json({ message: 'Public data' });
});

// Protected endpoint - requires authentication
orderApp.get('/api/orders', authenticateToken, async (req, res) => {
  const orders = await Order.find({ userId: req.user.userId });
  res.json(orders);
});

// Admin only endpoint
orderApp.get('/api/orders/all', 
  authenticateToken, 
  requireRole('admin'), 
  async (req, res) => {
    const orders = await Order.find();
    res.json(orders);
  }
);

// Permission-based endpoint
orderApp.delete('/api/orders/:id', 
  authenticateToken, 
  requirePermission('delete:orders'), 
  async (req, res) => {
    await Order.deleteOne({ _id: req.params.id });
    res.json({ message: 'Order deleted' });
  }
);

// Call other services with token forwarding
orderApp.post('/api/orders', authenticateToken, async (req, res) => {
  const order = await createOrder(req.body, req.user.userId);

  // Forward JWT token to payment service
  const paymentResponse = await axios.post(
    `${PAYMENT_SERVICE}/charge`,
    { orderId: order.id, amount: order.total },
    {
      headers: {
        'Authorization': req.headers.authorization // Forward token
      }
    }
  );

  res.json(order);
});
```

**Q: How do you prevent unauthorized access between internal microservices?**

**Answer - Service-to-Service Authentication:**

```javascript
// API Key based authentication for service-to-service
const SERVICE_API_KEYS = {
  'order-service': process.env.ORDER_SERVICE_KEY,
  'payment-service': process.env.PAYMENT_SERVICE_KEY,
  'notification-service': process.env.NOTIFICATION_SERVICE_KEY
};

// Middleware to verify service API key
function authenticateService(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const serviceName = req.headers['x-service-name'];

  if (!apiKey || !serviceName) {
    return res.status(401).json({ error: 'Service authentication required' });
  }

  if (SERVICE_API_KEYS[serviceName] !== apiKey) {
    return res.status(403).json({ error: 'Invalid service credentials' });
  }

  req.service = { name: serviceName };
  next();
}

// Internal endpoint - only accessible by other services
app.post('/internal/orders/bulk-update', 
  authenticateService, 
  async (req, res) => {
    console.log(`Request from service: ${req.service.name}`);
    // Process bulk update
    res.json({ success: true });
  }
);

// Order Service calling Payment Service
async function chargePayment(orderId, amount) {
  const response = await axios.post(
    `${PAYMENT_SERVICE}/internal/charge`,
    { orderId, amount },
    {
      headers: {
        'x-api-key': process.env.ORDER_SERVICE_KEY,
        'x-service-name': 'order-service'
      }
    }
  );
  return response.data;
}

// Alternative: mTLS (Mutual TLS) for service-to-service
// Each service has its own certificate
const https = require('https');
const fs = require('fs');

const httpsAgent = new https.Agent({
  cert: fs.readFileSync('./certs/service-cert.pem'),
  key: fs.readFileSync('./certs/service-key.pem'),
  ca: fs.readFileSync('./certs/ca-cert.pem'),
  rejectUnauthorized: true
});

async function callPaymentService(data) {
  const response = await axios.post(
    `${PAYMENT_SERVICE}/charge`,
    data,
    { httpsAgent }
  );
  return response.data;
}
```

---

## **DATA CONSISTENCY**

### **9. Handling Distributed Transactions**

**Q: User places an order. You need to: 1) Create order, 2) Charge payment, 3) Update inventory, 4) Send email. If any step fails, how do you maintain data consistency?**

**Answer - Event-Driven Saga with Message Queue:**

```javascript
const amqp = require('amqplib');

class OrderSagaOrchestrator {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
    
    // Declare queues
    await this.channel.assertQueue('order.created');
    await this.channel.assertQueue('payment.process');
    await this.channel.assertQueue('inventory.reserve');
    await this.channel.assertQueue('notification.send');
    await this.channel.assertQueue('saga.compensate');
  }

  async createOrder(orderData) {
    // Step 1: Create order with PENDING status
    const order = await Order.create({
      ...orderData,
      status: 'PENDING',
      sagaState: 'ORDER_CREATED'
    });

    // Publish event to start saga
    const event = {
      sagaId: order.id,
      orderId: order.id,
      userId: orderData.userId,
      amount: orderData.amount,
      items: orderData.items,
      timestamp: new Date(),
      step: 'ORDER_CREATED'
    };

    await this.channel.sendToQueue(
      'payment.process',
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    console.log(`Saga started for order: ${order.id}`);
    return order;
  }
}

// Payment Service - Saga Participant
class PaymentService {
  async listen() {
    const channel = await getChannel();

    channel.consume('payment.process', async (msg) => {
      const event = JSON.parse(msg.content.toString());
      
      try {
        // Process payment
        const payment = await this.chargePayment(event.amount, event.userId);
        
        // Update saga state
        await Order.updateOne(
          { _id: event.orderId },
          { sagaState: 'PAYMENT_COMPLETED' }
        );

        // Publish success event to next step
        const successEvent = {
          ...event,
          paymentId: payment.id,
          step: 'PAYMENT_COMPLETED'
        };

        await channel.sendToQueue(
          'inventory.reserve',
          Buffer.from(JSON.stringify(successEvent))
        );

        channel.ack(msg);
        console.log(`Payment completed for saga: ${event.sagaId}`);

      } catch (error) {
        console.error(`Payment failed for saga: ${event.sagaId}`, error);

        // Publish compensation event
        const compensationEvent = {
          ...event,
          step: 'PAYMENT_FAILED',
          error: error.message,
          compensate: ['ORDER']
        };

        await channel.sendToQueue(
          'saga.compensate',
          Buffer.from(JSON.stringify(compensationEvent))
        );

        channel.ack(msg);
      }
    });
  }

  async chargePayment(amount, userId) {
    // Payment logic
    return { id: 'pay_123', amount, status: 'succeeded' };
  }
}

// Inventory Service - Saga Participant
class InventoryService {
  async listen() {
    const channel = await getChannel();

    channel.consume('inventory.reserve', async (msg) => {
      const event = JSON.parse(msg.content.toString());

      try {
        // Reserve inventory
        const reservation = await this.reserveItems(event.items);

        await Order.updateOne(
          { _id: event.orderId },
          { sagaState: 'INVENTORY_RESERVED' }
        );

        // Publish to notification
        const successEvent = {
          ...event,
          reservationId: reservation.id,
          step: 'INVENTORY_RESERVED'
        };

        await channel.sendToQueue(
          'notification.send',
          Buffer.from(JSON.stringify(successEvent))
        );

        channel.ack(msg);
        console.log(`Inventory reserved for saga: ${event.sagaId}`);

      } catch (error) {
        console.error(`Inventory reservation failed for saga: ${event.sagaId}`);

        // Trigger compensation
        const compensationEvent = {
          ...event,
          step: 'INVENTORY_FAILED',
          error: error.message,
          compensate: ['PAYMENT', 'ORDER']
        };

        await channel.sendToQueue(
          'saga.compensate',
          Buffer.from(JSON.stringify(compensationEvent))
        );

        channel.ack(msg);
      }
    });
  }

  async reserveItems(items) {
    // Check and reserve inventory
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productId}`);
      }
      product.stock -= item.quantity;
      await product.save();
    }
    return { id: 'res_123' };
  }
}

// Notification Service - Final Step
class NotificationService {
  async listen() {
    const channel = await getChannel();

    channel.consume('notification.send', async (msg) => {
      const event = JSON.parse(msg.content.toString());

      try {
        await this.sendOrderConfirmation(event);

        // Mark saga as complete
        await Order.updateOne(
          { _id: event.orderId },
          { 
            status: 'CONFIRMED',
            sagaState: 'COMPLETED'
          }
        );

        channel.ack(msg);
        console.log(`Saga completed successfully: ${event.sagaId}`);

      } catch (error) {
        console.error(`Notification failed but saga continues: ${event.sagaId}`);
        // Even if notification fails, don't rollback the order
        channel.ack(msg);
      }
    });
  }

  async sendOrderConfirmation(event) {
    // Send email
    console.log(`Sending confirmation email for order ${event.orderId}`);
  }
}

// Compensation Handler - Rollback
class CompensationHandler {
  async listen() {
    const channel = await getChannel();

    channel.consume('saga.compensate', async (msg) => {
      const event = JSON.parse(msg.content.toString());
      
      console.log(`Starting compensation for saga: ${event.sagaId}`);
      console.log(`Steps to compensate: ${event.compensate}`);

      try {
        // Compensate in reverse order
        if (event.compensate.includes('INVENTORY')) {
          await this.compensateInventory(event);
        }

        if (event.compensate.includes('PAYMENT')) {
          await this.compensatePayment(event);
        }

        if (event.compensate.includes('ORDER')) {
          await this.compensateOrder(event);
        }

        channel.ack(msg);
        console.log(`Compensation completed for saga: ${event.sagaId}`);

      } catch (error) {
        console.error(`Compensation failed for saga: ${event.sagaId}`, error);
        // Retry or manual intervention needed
        channel.nack(msg, false, true);
      }
    });
  }

  async compensateInventory(event) {
    // Release reserved inventory
    for (const item of event.items) {
      const product = await Product.findById(item.productId);
      product.stock += item.quantity;
      await product.save();
    }
    console.log('Inventory compensation completed');
  }

  async compensatePayment(event) {
    // Refund payment
    if (event.paymentId) {
      await axios.post(`${PAYMENT_SERVICE}/refund`, {
        paymentId: event.paymentId
      });
      console.log('Payment compensation completed');
    }
  }

  async compensateOrder(event) {
    // Cancel order
    await Order.updateOne(
      { _id: event.orderId },
      { 
        status: 'CANCELLED',
        sagaState: 'COMPENSATED',
        cancellationReason: event.error
      }
    );
    console.log('Order compensation completed');
  }
}

// Start all services
async function startServices() {
  const orchestrator = new OrderSagaOrchestrator();
  await orchestrator.connect();

  const paymentService = new PaymentService();
  await paymentService.listen();

  const inventoryService = new InventoryService();
  await inventoryService.listen();

  const notificationService = new NotificationService();
  await notificationService.listen();

  const compensationHandler = new CompensationHandler();
  await compensationHandler.listen();

  console.log('All saga participants started');
}
```

---

## **COMMON INTERVIEW SCENARIOS**

### **10. Real-World Problem Solving**

**Q: Your microservices architecture is experiencing cascading failures. One service is down and it's affecting all other services. What do you do?**

**Answer:**

```javascript
// Implement Circuit Breaker with Graceful Degradation

const CircuitBreaker = require('opossum');

class ResilientOrderService {
  constructor() {
    // Circuit breaker for each dependency
    this.paymentBreaker = this.createCircuitBreaker(
      this.callPaymentService.bind(this),
      'payment-service'
    );

    this.inventoryBreaker = this.createCircuitBreaker(
      this.callInventoryService.bind(this),
      'inventory-service'
    );

    this.recommendationBreaker = this.createCircuitBreaker(
      this.callRecommendationService.bind(this),
      'recommendation-service'
    );
  }

  createCircuitBreaker(fn, serviceName) {
    const options = {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      volumeThreshold: 10
    };

    const breaker = new CircuitBreaker(fn, options);

    // Monitoring
    breaker.on('open', () => {
      console.error(`Circuit breaker OPEN for ${serviceName}`);
      // Send alert
    });

    breaker.on('halfOpen', () => {
      console.warn(`Circuit breaker HALF-OPEN for ${serviceName}`);
    });

    breaker.on('close', () => {
      console.info(`Circuit breaker CLOSED for ${serviceName}`);
    });

    return breaker;
  }

  async callPaymentService(data) {
    const response = await axios.post(`${PAYMENT_SERVICE}/charge`, data, {
      timeout: 3000
    });
    return response.data;
  }

  async callInventoryService(productId) {
    const response = await axios.get(`${INVENTORY_SERVICE}/products/${productId}`, {
      timeout: 3000
    });
    return response.data;
  }

  async callRecommendationService(userId) {
    const response = await axios.get(`${RECOMMENDATION_SERVICE}/users/${userId}`, {
      timeout: 3000
    });
    return response.data;
  }

  // Order creation with graceful degradation
  async createOrder(orderData) {
    const order = await Order.create({
      ...orderData,
      status: 'PENDING'
    });

    try {
      // Critical: Payment must succeed
      const payment = await this.paymentBreaker.fire({
        amount: order.total,
        userId: order.userId
      });
      
      order.paymentId = payment.id;
      order.status = 'PAID';

    } catch (error) {
      // Payment failed - cannot proceed
      order.status = 'PAYMENT_FAILED';
      await order.save();
      throw new Error('Payment processing failed');
    }

    // Non-critical: Inventory check (graceful degradation)
    try {
      const inventory = await this.inventoryBreaker.fire(orderData.productId);
      order.inventoryConfirmed = true;
    } catch (error) {
      console.warn('Inventory check failed, proceeding anyway');
      order.inventoryConfirmed = false;
      // Queue for manual verification later
      await this.queueInventoryCheck(order.id);
    }

    // Non-critical: Recommendations (fail silently)
    try {
      const recommendations = await this.recommendationBreaker.fire(order.userId);
      order.recommendations = recommendations;
    } catch (error) {
      console.warn('Recommendations unavailable');
      order.recommendations = [];
      // Service down doesn't affect order
    }

    await order.save();
    return order;
  }

  async queueInventoryCheck(orderId) {
    // Add to queue for retry
    await queue.add('inventory-check', { orderId }, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 60000 // 1 minute
      }
    });
  }
}
```

**Q: You deployed a new version and now seeing 50% error rate. How do you roll back quickly?**

**Answer:**

```javascript
// Automated Canary Deployment with Auto-Rollback

class CanaryDeployment {
  constructor() {
    this.canaryPercentage = 0;
    this.errorThreshold = 0.05; // 5%
    this.latencyThreshold = 500; // 500ms
    this.checkInterval = 60000; // 1 minute
  }

  async startCanary() {
    const versions = {
      stable: 'v1.0',
      canary: 'v2.0'
    };

    const increments = [10, 25, 50, 75, 100];

    for (const percentage of increments) {
      this.canaryPercentage = percentage;
      console.log(`Canary at ${percentage}%`);

      // Wait and monitor
      await this.sleep(this.checkInterval);

      // Check metrics
      const metrics = await this.getMetrics(versions.canary);

      if (metrics.errorRate > this.errorThreshold) {
        console.error(`High error rate: ${metrics.errorRate}`);
        await this.rollback(versions.stable);
        return false;
      }

      if (metrics.p95Latency > this.latencyThreshold) {
        console.error(`High latency: ${metrics.p95Latency}ms`);
        await this.rollback(versions.stable);
        return false;
      }

      console.log(`Metrics OK - Error: ${metrics.errorRate}, Latency: ${metrics.p95Latency}ms`);
    }

    console.log('Canary deployment successful');
    return true;
  }

  async getMetrics(version) {
    // Query Prometheus
    const errorRate = await this.queryPrometheus(`
      sum(rate(http_requests_total{status_code=~"5..", version="${version}"}[5m]))
      /
      sum(rate(http_requests_total{version="${version}"}[5m]))
    `);

    const p95Latency = await this.queryPrometheus(`
      histogram_quantile(0.95, 
        rate(http_request_duration_seconds_bucket{version="${version}"}[5m])
      ) * 1000
    `);

    return {
      errorRate: errorRate || 0,
      p95Latency: p95Latency || 0
    };
  }

  async rollback(stableVersion) {
    console.log(`ROLLING BACK to ${stableVersion}`);
    
    // Immediate rollback
    this.canaryPercentage = 0;
    
    // Update load balancer / Kubernetes deployment
    await this.updateDeployment(stableVersion, 100);
    
    // Send alert
    await this.sendAlert({
      title: 'Canary Deployment Failed - Auto Rollback',
      message: `Rolled back to ${stableVersion} due to high error rate or latency`
    });
  }

  async queryPrometheus(query) {
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
      params: { query }
    });
    return response.data.data.result[0]?.value[1];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Express middleware for canary routing
function canaryRouter(req, res, next) {
  const canaryPercentage = getCanaryPercentage(); // From config/feature flag
  const random = Math.random() * 100;

  if (random < canaryPercentage) {
    req.targetVersion = 'v2.0';
    req.headers['x-version'] = 'v2.0';
  } else {
    req.targetVersion = 'v1.0';
    req.headers['x-version'] = 'v1.0';
  }

  next();
}

app.use(canaryRouter);
```

---

## **ADDITIONAL SCENARIO-BASED QUESTIONS**

**Q: Your database is overloaded. Multiple services are hitting it simultaneously. What do you do?**

**Answer:**
```
Solutions:

1. Implement Connection Pooling
2. Add Read Replicas
3. Implement Caching Layer (Redis)
4. Database Query Optimization
5. Implement Rate Limiting
6. Use Database-per-Service pattern
```

```javascript
// Connection Pooling
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'orders',
  max: 20, // maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Query with pool
async function getOrders(userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM orders WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// Read/Write Split
class DatabaseRouter {
  constructor() {
    this.masterPool = new Pool({ /* master config */ });
    this.replicaPool = new Pool({ /* replica config */ });
  }

  async query(sql, params, useReplica = true) {
    const pool = useReplica ? this.replicaPool : this.masterPool;
    const client = await pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  async read(sql, params) {
    return this.query(sql, params, true);
  }

  async write(sql, params) {
    return this.query(sql, params, false);
  }
}
```

**Q: How do you handle versioning of APIs in microservices?**

**Answer:**

```javascript
// Strategy 1: URL Versioning
app.get('/api/v1/orders', (req, res) => {
  // Old version
  res.json({ orders: [] });
});

app.get('/api/v2/orders', (req, res) => {
  // New version with breaking changes
  res.json({ 
    data: { orders: [] },
    meta: { version: '2.0' }
  });
});


// Strategy 2: Header Versioning
app.get('/api/orders', (req, res) => {
  const apiVersion = req.headers['api-version'] || '1.0';
  
  if (apiVersion === '1.0') {
    // Old format
    return res.json({ orders: [] });
  } else if (apiVersion === '2.0') {
    // New format
    return res.json({ 
      data: { orders: [] },
      meta: { version: '2.0' }
    });
  } else {
    return res.status(400).json({ error: 'Unsupported API version' });
  }
});

// Strategy 3: Content Negotiation
app.get('/api/orders', (req, res) => {
  const acceptHeader = req.headers['accept'];
  
  if (acceptHeader.includes('application/vnd.company.v1+json')) {
    return res.json({ orders: [] });
  } else if (acceptHeader.includes('application/vnd.company.v2+json')) {
    return res.json({ 
      data: { orders: [] },
      meta: { version: '2.0' }
    });
  }
  
  // Default to latest version
  return res.json({ 
    data: { orders: [] },
    meta: { version: '2.0' }
  });
});

// Strategy 4: Gateway-Level Version Routing
// API Gateway handles version routing
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const gateway = express();

// Route based on URL version
gateway.use('/api/v1', createProxyMiddleware({
  target: 'http://order-service-v1:8080',
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '/api' }
}));

gateway.use('/api/v2', createProxyMiddleware({
  target: 'http://order-service-v2:8080',
  changeOrigin: true,
  pathRewrite: { '^/api/v2': '/api' }
}));

// Backward compatibility layer
class APIVersionAdapter {
  // Convert v1 response to v2 format
  static v1ToV2(v1Response) {
    return {
      data: v1Response,
      meta: {
        version: '2.0',
        convertedFrom: '1.0'
      }
    };
  }

  // Convert v2 response to v1 format (for legacy clients)
  static v2ToV1(v2Response) {
    return v2Response.data;
  }
}

// Middleware for automatic conversion
function versionAdapter(req, res, next) {
  const requestedVersion = req.headers['api-version'] || '2.0';
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    if (requestedVersion === '1.0' && data.meta?.version === '2.0') {
      // Client wants v1, but service returns v2
      return originalJson(APIVersionAdapter.v2ToV1(data));
    } else if (requestedVersion === '2.0' && !data.meta) {
      // Client wants v2, but service returns v1
      return originalJson(APIVersionAdapter.v1ToV2(data));
    }
    return originalJson(data);
  };

  next();
}

app.use(versionAdapter);
```

---

## **PERFORMANCE & OPTIMIZATION**

**Q: Your microservices are making too many HTTP calls to each other, causing high latency. How do you optimize?**

**Answer:**

```javascript
// Problem: N+1 Query Problem in Microservices
// Order Service needs user data for 100 orders = 100 HTTP calls

// BAD APPROACH
async function getOrdersWithUsers_Bad(orderIds) {
  const orders = await Order.find({ _id: { $in: orderIds } });
  
  // 100 orders = 100 HTTP calls!
  for (const order of orders) {
    const user = await axios.get(`${USER_SERVICE}/users/${order.userId}`);
    order.userData = user.data;
  }
  
  return orders;
}

// SOLUTION 1: Batch API Calls
async function getOrdersWithUsers_Batched(orderIds) {
  const orders = await Order.find({ _id: { $in: orderIds } });
  
  // Get unique user IDs
  const userIds = [...new Set(orders.map(o => o.userId))];
  
  // Single batch call instead of 100 individual calls
  const usersResponse = await axios.post(`${USER_SERVICE}/users/batch`, {
    ids: userIds
  });
  
  // Create a map for quick lookup
  const usersMap = new Map(
    usersResponse.data.map(user => [user.id, user])
  );
  
  // Attach user data to orders
  return orders.map(order => ({
    ...order.toObject(),
    userData: usersMap.get(order.userId)
  }));
}

// User Service - Batch endpoint
app.post('/users/batch', async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || ids.length === 0) {
    return res.status(400).json({ error: 'IDs required' });
  }
  
  if (ids.length > 100) {
    return res.status(400).json({ error: 'Maximum 100 IDs allowed' });
  }
  
  const users = await User.find({ _id: { $in: ids } });
  res.json(users);
});

// SOLUTION 2: DataLoader (Batching + Caching)
const DataLoader = require('dataloader');

class UserDataLoader {
  constructor() {
    this.loader = new DataLoader(
      async (userIds) => {
        console.log(`Fetching users: ${userIds.join(', ')}`);
        
        const response = await axios.post(`${USER_SERVICE}/users/batch`, {
          ids: userIds
        });
        
        const usersMap = new Map(
          response.data.map(user => [user.id, user])
        );
        
        // Return in same order as requested
        return userIds.map(id => usersMap.get(id) || null);
      },
      {
        cache: true,
        maxBatchSize: 100,
        batchScheduleFn: (callback) => setTimeout(callback, 10) // Wait 10ms to batch
      }
    );
  }

  async load(userId) {
    return this.loader.load(userId);
  }

  async loadMany(userIds) {
    return this.loader.loadMany(userIds);
  }

  clear(userId) {
    this.loader.clear(userId);
  }

  clearAll() {
    this.loader.clearAll();
  }
}

// Usage with DataLoader
const userLoader = new UserDataLoader();

app.get('/api/orders', async (req, res) => {
  const orders = await Order.find({ userId: req.user.id });
  
  // Multiple calls are automatically batched
  const ordersWithUsers = await Promise.all(
    orders.map(async (order) => {
      const user = await userLoader.load(order.userId);
      return { ...order.toObject(), userData: user };
    })
  );
  
  res.json(ordersWithUsers);
});

// SOLUTION 3: Response Caching
const NodeCache = require('node-cache');
const responseCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

function cacheMiddleware(duration) {
  return (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = responseCache.get(key);

    if (cached) {
      console.log('Cache hit');
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      responseCache.set(key, data, duration);
      return originalJson(data);
    };

    next();
  };
}

app.get('/api/products', cacheMiddleware(300), async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// SOLUTION 4: GraphQL Federation (Advanced)
// Single GraphQL query can fetch from multiple services efficiently
const { ApolloServer } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');

// Order Service GraphQL
const orderTypeDefs = `
  type Order @key(fields: "id") {
    id: ID!
    userId: ID!
    items: [Item!]!
    total: Float!
    user: User @requires(fields: "userId")
  }
  
  extend type User @key(fields: "id") {
    id: ID! @external
  }
`;

const orderResolvers = {
  Order: {
    user(order) {
      return { __typename: "User", id: order.userId };
    }
  }
};

// User Service GraphQL
const userTypeDefs = `
  type User @key(fields: "id") {
    id: ID!
    name: String!
    email: String!
    orders: [Order!]!
  }
  
  extend type Order @key(fields: "id") {
    id: ID! @external
  }
`;

// Client makes single query, federation handles batching
// query {
//   orders {
//     id
//     total
//     user {
//       name
//       email
//     }
//   }
// }
```

---

## **TESTING MICROSERVICES**

**Q: How do you test microservices? What's your testing strategy?**

**Answer:**

```javascript
// 1. UNIT TESTS - Test individual functions
const { expect } = require('chai');
const sinon = require('sinon');

describe('OrderService', () => {
  let orderService;
  let mockOrderRepo;
  let mockPaymentService;

  beforeEach(() => {
    mockOrderRepo = {
      create: sinon.stub(),
      findById: sinon.stub()
    };
    
    mockPaymentService = {
      charge: sinon.stub()
    };

    orderService = new OrderService(mockOrderRepo, mockPaymentService);
  });

  it('should create order successfully', async () => {
    const orderData = { userId: 1, items: [], total: 100 };
    const mockOrder = { id: 'order_123', ...orderData };
    
    mockOrderRepo.create.resolves(mockOrder);
    mockPaymentService.charge.resolves({ id: 'pay_123' });

    const result = await orderService.createOrder(orderData);

    expect(result.id).to.equal('order_123');
    expect(mockOrderRepo.create.calledOnce).to.be.true;
    expect(mockPaymentService.charge.calledOnce).to.be.true;
  });

  it('should rollback order when payment fails', async () => {
    const orderData = { userId: 1, items: [], total: 100 };
    
    mockOrderRepo.create.resolves({ id: 'order_123' });
    mockPaymentService.charge.rejects(new Error('Payment failed'));

    try {
      await orderService.createOrder(orderData);
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error.message).to.include('Payment failed');
    }
  });
});

// 2. INTEGRATION TESTS - Test service interactions
const request = require('supertest');
const app = require('../app');

describe('Order API Integration Tests', () => {
  let authToken;

  before(async () => {
    // Setup test database
    await setupTestDB();
    
    // Get auth token
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = response.body.token;
  });

  after(async () => {
    await cleanupTestDB();
  });

  it('should create order with valid data', async () => {
    const orderData = {
      items: [
        { productId: 'prod_1', quantity: 2, price: 50 }
      ],
      total: 100
    };

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(orderData)
      .expect(201);

    expect(response.body).to.have.property('id');
    expect(response.body.status).to.equal('PENDING');
  });

  it('should return 401 without auth token', async () => {
    await request(app)
      .post('/api/orders')
      .send({})
      .expect(401);
  });
});

// 3. CONTRACT TESTS - Test API contracts between services
const { Pact } = require('@pact-foundation/pact');
const { like } = require('@pact-foundation/pact/dsl/matchers');

describe('Order Service - Payment Service Contract', () => {
  const provider = new Pact({
    consumer: 'OrderService',
    provider: 'PaymentService',
    port: 9000
  });

  before(() => provider.setup());
  after(() => provider.finalize());

  describe('when requesting payment', () => {
    before(async () => {
      await provider.addInteraction({
        state: 'user has sufficient balance',
        uponReceiving: 'a request to charge payment',
        withRequest: {
          method: 'POST',
          path: '/charge',
          headers: { 'Content-Type': 'application/json' },
          body: {
            amount: 100,
            userId: like('user_123')
          }
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: like('pay_123'),
            amount: 100,
            status: 'succeeded'
          }
        }
      });
    });

    it('returns payment confirmation', async () => {
      const response = await axios.post('http://localhost:9000/charge', {
        amount: 100,
        userId: 'user_123'
      });

      expect(response.data.status).to.equal('succeeded');
    });

    afterEach(() => provider.verify());
  });
});

// 4. END-TO-END TESTS - Test complete workflows
describe('Complete Order Flow E2E', () => {
  it('should complete order from creation to confirmation', async () => {
    // Step 1: User logs in
    const loginResponse = await request(authService)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    const token = loginResponse.body.token;

    // Step 2: Create order
    const orderResponse = await request(orderService)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 'prod_1', quantity: 1, price: 50 }],
        total: 50
      });

    const orderId = orderResponse.body.id;
    expect(orderResponse.status).to.equal(201);

    // Step 3: Wait for async processing
    await sleep(2000);

    // Step 4: Verify payment was processed
    const paymentResponse = await request(paymentService)
      .get(`/payments?orderId=${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(paymentResponse.body.status).to.equal('succeeded');

    // Step 5: Verify inventory was updated
    const inventoryResponse = await request(inventoryService)
      .get('/inventory/prod_1');

    expect(inventoryResponse.body.reserved).to.be.greaterThan(0);

    // Step 6: Verify order status
    const finalOrderResponse = await request(orderService)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(finalOrderResponse.body.status).to.equal('CONFIRMED');
  });
});

// 5. CHAOS TESTING - Test resilience
const axios = require('axios');

describe('Chaos Tests - Service Failures', () => {
  it('should handle payment service being down', async () => {
    // Simulate payment service down
    const paymentServiceDown = true;

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(orderData);

    // Order should be created but marked as PENDING
    expect(response.status).to.equal(201);
    expect(response.body.status).to.equal('PENDING');
  });

  it('should handle slow payment service', async () => {
    // Simulate slow service (timeout test)
    this.timeout(10000);

    const start = Date.now();
    
    try {
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);
    } catch (error) {
      const duration = Date.now() - start;
      expect(duration).to.be.lessThan(5000); // Should timeout before 5s
    }
  });
});

// 6. LOAD TESTING - Test performance
const autocannon = require('autocannon');

describe('Load Tests', () => {
  it('should handle 1000 requests/sec', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/orders',
      connections: 100,
      duration: 30,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    console.log('Requests:', result.requests.total);
    console.log('Throughput:', result.throughput.average);
    console.log('Latency p95:', result.latency.p95);

    expect(result.errors).to.equal(0);
    expect(result.latency.p95).to.be.lessThan(500); // 95th percentile < 500ms
  });
});
```

---

## **BONUS: COMMON MISTAKES TO AVOID**

**Q: What are common mistakes developers make when building microservices?**

**Answer:**

```javascript
// MISTAKE 1: Too Many Microservices (Nano-services)
// Bad: Separate service for every single entity
// UserService, UserAddressService, UserProfileService, UserPreferencesService

// Good: Logical boundaries based on business domains
// UserService (handles users, addresses, profiles, preferences)
// OrderService (handles orders, order items, order history)

// MISTAKE 2: Shared Database
// Bad: Multiple services accessing same database tables
const userService = {
  getUser: () => db.query('SELECT * FROM users')
};
const orderService = {
  getUser: () => db.query('SELECT * FROM users') // Same table!
};

// Good: Each service has its own database
const userService = {
  database: 'user_db',
  getUser: () => userDB.query('SELECT * FROM users')
};
const orderService = {
  database: 'order_db',
  getUser: (userId) => axios.get(`${USER_SERVICE}/users/${userId}`)
};

// MISTAKE 3: Synchronous Chains (Cascading Failures)
// Bad: Long synchronous call chains
app.post('/orders', async (req, res) => {
  const user = await userService.getUser(req.userId); // Call 1
  const inventory = await inventoryService.check(req.productId); // Call 2
  const price = await pricingService.calculate(req.items); // Call 3
  const payment = await paymentService.charge(price); // Call 4
  // If any service is slow/down, entire request fails
});

// Good: Use async events or parallel calls
app.post('/orders', async (req, res) => {
  const order = await createOrder(req.body);
  
  // Publish event for async processing
  await eventBus.publish('order.created', order);
  
  res.status(202).json({ 
    orderId: order.id, 
    status: 'PROCESSING' 
  });
});

// MISTAKE 4: No Retry Logic
// Bad: Single attempt, fails immediately
async function callService() {
  return await axios.get(`${SERVICE_URL}/data`);
}

// Good: Retry with backoff
async function callServiceWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axios.get(`${SERVICE_URL}/data`, { timeout: 3000 });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}

// MISTAKE 5: No Timeouts
// Bad: Waits forever
const response = await axios.get(`${SERVICE_URL}/data`);

// Good: Always set timeouts
const response = await axios.get(`${SERVICE_URL}/data`, {
  timeout: 5000 // 5 seconds
});

// MISTAKE 6: Missing Correlation IDs
// Bad: Can't trace requests across services
app.post('/orders', async (req, res) => {
  await paymentService.charge();
  await inventoryService.reserve();
});

// Good: Pass correlation ID through all services
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuid();
  next();
});

app.post('/orders', async (req, res) => {
  const headers = { 'x-correlation-id': req.correlationId };
  await paymentService.charge({ headers });
  await inventoryService.reserve({ headers });
});

// MISTAKE 7: No Circuit Breakers
// Services keep calling failed services, wasting resources

// MISTAKE 8: Distributed Monolith
// All services must deploy together, defeating microservices purpose

// MISTAKE 9: No API Versioning
// Breaking changes break all clients immediately

// MISTAKE 10: Ignoring Security Between Services
// Assuming internal services are safe without authentication
```

---

## **KEY TAKEAWAYS FOR YOUR INTERVIEW**

### **When discussing your HTTP-based microservices project, emphasize:**

1. **Resilience Patterns You Used:**
   - Circuit breakers
   - Retries with exponential backoff
   - Timeouts
   - Fallback mechanisms

2. **How You Handled Failures:**
   - Saga pattern for distributed transactions
   - Compensating transactions
   - Event-driven recovery

3. **Monitoring & Debugging:**
   - Distributed tracing with correlation IDs
   - Centralized logging
   - Health checks
   - Metrics collection

4. **Security:**
   - JWT authentication
   - Service-to-service authentication
   - API gateway for single entry point

5. **Performance Optimizations:**
   - Caching strategies
   - Batching API calls
   - Connection pooling
   - Read replicas

6. **Trade-offs You Made:**
   - Why synchronous over async for certain flows
   - When you chose consistency over availability
   - How you balanced complexity vs benefits

---

## **PRACTICE QUESTIONS TO PREPARE**

1. Walk me through how your microservices communicate
2. What happens when one service is down?
3. How do you ensure data consistency across services?
4. How do you deploy updates without downtime?
5. How do you debug issues across multiple services?
6. What's your strategy for handling high traffic?
7. How do you secure inter-service communication?
8. What monitoring tools do you use?
9. How do you handle database migrations?
10. What would you do differently if you rebuild the system?

**Good luck with your interview! Focus on real scenarios from your project and be ready to discuss trade-offs and challenges you faced.** 🚀