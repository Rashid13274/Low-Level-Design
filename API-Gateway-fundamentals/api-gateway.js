// API Gateway (Port 3000)

// api-gateway/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();

// 1. Authentication Middleware
app.use((req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'SECRET_KEY');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

// 2. Rate Limiting (100 requests/hour)
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// 3. Request Routing
app.use('/products', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: { '^/products': '/' },
}));

app.use('/users', createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/users': '/' },
}));

// 3.5 Service Aggregation
// ------------------------
// Example Scenario (add to gateway):
app.get('/dashboard', async (req, res) => {
    const [products, users] = await Promise.all([
        fetch('http://localhost:3001/products'),
        fetch('http://localhost:3002/users'),
    ]);
    res.json({ products, users });
});


// 4. Unified Error Handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Gateway Error' });
});

// Start the API Gateway
app.listen(3000, () => console.log('API Gateway running on 3000'));

/*
Key Concepts Explained
=======================

3.1 Request Routing
-------------------
What it does:
- Maps client requests to backend services
- Example: /products → Product Service

Why needed:
- Clients don't need to know service locations
- Enables service versioning (/v1/products)
- Simplifies client-side API consumption

3.2 Authentication
-------------------
What it does:
- Centralized JWT verification
- Protects all backend services uniformly

Why needed:
- Avoid duplicate auth code in each service
- Single point of security management
- Easily revoke/update authentication logic

3.3 Rate Limiting
------------------
What it does:
- Prevents API abuse/DDoS attacks
- Limits requests per client (100/hour in our case)

Why needed:
- Protects backend services from overload
- Fair resource allocation
- Can implement different limits per API endpoint

3.4 Protocol Translation
-------------------------
What it does (not shown in example):
- Convert between HTTP/WebSocket/gRPC
- Transform request/response formats

Why needed:
- Legacy system integration
- Support multiple client types
- Standardize API responses


*/

/*
3.5 Service Aggregation
----------------------------

app.get('/dashboard', async (req, res) => {
    const [products, users] = await Promise.all([
        fetch('http://localhost:3001/products'),
        fetch('http://localhost:3002/users'),
    ]);
    res.json({ products, users });
});

What it does:   
- Combines data from multiple services into a single response
- Example: Fetch products and users in a single request



Why needed:
- Reduce client-side round trips
- Combine data from multiple services
- Optimize network usage

4. Testing the System
=====================
*/
