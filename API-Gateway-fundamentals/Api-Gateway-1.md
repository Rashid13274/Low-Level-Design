# Project Structure

```
api-gateway-demo/
├── api-gateway/
│   ├── server.js
│   └── package.json
├── product-service/
│   ├── server.js
│   └── package.json
└── user-service/
    ├── server.js
    └── package.json
```

---

## 1. Why We Need an API Gateway

### Key Problems Without API Gateway:
- Clients must know all service endpoints.
- No centralized security management.
- Complex client-side service integration.
- No unified monitoring/analytics.
- Difficulty in versioning and protocol translation.

### Solution:
An API Gateway acts as a single entry point that:
- Routes requests to appropriate services.
- Handles cross-cutting concerns centrally.
- Provides a unified interface to clients.

---

## 2. Testing the System

### Start Services:
```bash
# Terminal 1
cd product-service && npm install express
node server.js

# Terminal 2
cd user-service && npm install express
node server.js

# Terminal 3
cd api-gateway && npm install express http-proxy-middleware jsonwebtoken express-rate-limit
node server.js
```

### Generate JWT Token:
Use the Node.js console:
```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 123 }, 'SECRET_KEY');
console.log(token);
```

### Make Requests:
```bash
# Without token (Blocked)
curl http://localhost:3000/products

# With valid token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/products

# Access aggregated endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/dashboard
```

---

## 3. Key Benefits Demonstrated

### Single Entry Point:
- Clients only interact with the gateway (port 3000).
- Services can be changed without client updates.

### Centralized Security:
- All authentication logic is in one place.
- Easy to add/remove security features.

### Traffic Control:
- Rate limiting protects services.
- Circuit breakers can be added easily.

### Simplified Monitoring:
- One place to log all requests.
- Unified analytics for the entire system.

### Protocol Management:
- Can translate between REST/GraphQL/WebSocket.
- Handles versioning in the gateway.

---

## 4. When to Use API Gateway
- Microservices Architecture (3+ services).
- Need for Unified Security (JWT, OAuth).
- Multiple Client Types (Web, Mobile, IoT).
- Complex Routing Requirements.
- Need for Service Aggregation.

---

## 5. Potential Enhancements
- Service Discovery (Dynamic routing).
- Response Caching (Redis integration).
- Request/Response Transformation.
- Canary Deployments.
- Detailed Analytics Dashboard.

---

This implementation demonstrates the core value of an API Gateway in managing and securing microservices communication while providing a unified interface to clients. The gateway becomes particularly valuable as systems grow in complexity and scale.
