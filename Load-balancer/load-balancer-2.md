# Load Balancing Explained with a Simple Project Using MongoDB and Express

Load Balancing distributes incoming traffic across multiple servers to optimize resource use, maximize throughput, and minimize response time. Here's a simple implementation:

---

## Project Setup

### Tools Used:
- **Express.js**: Web server framework.
- **MongoDB**: Database for shared data storage.
- **http-proxy-middleware**: For load balancing between servers.

### Directory Structure:
```
load-balancer-example/
├── server.js         # Backend Express server
├── loadBalancer.js   # Load balancer
└── package.json
```

---

## Step 1: Create the Backend Servers

### Install Dependencies:
```bash
npm install express mongoose http-proxy-middleware
```

### Backend Server Code (`server.js`):
```javascript
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000; // Use PORT environment variable

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/loadbalancing');

// Define a task schema
const Task = mongoose.model('Task', new mongoose.Schema({
    title: String,
    completed: { type: Boolean, default: false }
}));

// Middleware to parse JSON
app.use(express.json());

// GET all tasks
app.get('/api/tasks', async (req, res) => {
    const tasks = await Task.find();
    res.send(tasks);
});

// POST a new task
app.post('/api/tasks', async (req, res) => {
    const task = new Task(req.body);
    await task.save();
    res.send(task);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
```

### Start Two Servers:
```bash
PORT=3001 node server.js  # Server 1
PORT=3002 node server.js  # Server 2
```

---

## Step 2: Create the Load Balancer

### Load Balancer Code (`loadBalancer.js`):
```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// List of backend servers
const servers = ['http://localhost:3001', 'http://localhost:3002'];
let current = 0; // Track the current server for round-robin

// Load balancer middleware
app.use('/', createProxyMiddleware({
    target: servers[0], // Default target (overridden by router)
    changeOrigin: true,
    router: (req) => {
        // Rotate servers in round-robin fashion
        const server = servers[current];
        current = (current + 1) % servers.length; // Increment and wrap around
        return server;
    }
}));

// Start the load balancer on port 3000
app.listen(3000, () => {
    console.log('Load balancer running on port 3000');
});
```

### Start the Load Balancer:
```bash
node loadBalancer.js
```

---

## Step 3: Test the Setup

### Add a Task:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"title":"Learn load balancing"}' http://localhost:3000/api/tasks
```

### Fetch Tasks:
```bash
curl http://localhost:3000/api/tasks
```

### Observe Logs:
Requests alternate between servers `3001` and `3002` (check their logs).

---

## Key Concepts

- **Stateless Servers**: Both servers use the same MongoDB, so data is consistent.
- **Round-Robin**: Requests alternate between servers to distribute load.
- **Scalability**: Add more servers by updating the `servers` array in the load balancer.

This setup demonstrates how load balancing improves scalability and reliability by distributing traffic across multiple servers.
