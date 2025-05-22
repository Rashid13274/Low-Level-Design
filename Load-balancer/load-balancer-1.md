# Load Balancing with Express.js, MongoDB, and NGINX

This guide demonstrates load balancing using a simple project with **Express.js**, **MongoDB**, and **NGINX**. We'll first explain the concepts and then provide code examples with comments.

---

## What is Load Balancing?

Load balancing distributes incoming traffic across multiple servers to:

- **Prevent overloading** a single server.
- **Improve responsiveness** and availability.
- **Handle failures gracefully** (if one server crashes, others take over).

### Types of Load Balancers:

1. **Hardware**: Physical devices (e.g., F5).
2. **Software**: Tools like **NGINX**, **HAProxy**, or cloud services (e.g., AWS ELB).

---

## Project Setup

We’ll create:

1. Two identical **Express.js** servers (simulating multiple backend instances).
2. A **MongoDB** database (shared by all servers).
3. **NGINX** as the load balancer to route requests.

---

## Step 1: Create an Express Server

Create a simple Express app that connects to MongoDB and returns server info.

```javascript
// server.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port

// Connect to MongoDB (replace URI with your MongoDB connection string)
mongoose.connect('mongodb://localhost:27017/loadBalancerDB', { useNewUrlParser: true });

// Define a simple schema
const Message = mongoose.model('Message', { text: String });

// Route to show which server handled the request
app.get('/', async (req, res) => {
    try {
        // Save a message to MongoDB (shared database)
        const message = new Message({ text: `Hello from server ${port}` });
        await message.save();
        
        // Fetch all messages
        const messages = await Message.find();
        res.send(`
            <h1>Server: ${port}</h1>
            <h2>Messages from DB:</h2>
            ${messages.map(m => `<p>${m.text}</p>`).join('')}
        `);
    } catch (err) {
        res.status(500).send('Error!');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
```

---

## Step 2: Simulate Multiple Servers

Run two instances of the server on different ports (e.g., 3000 and 3001):

```bash
# Terminal 1
PORT=3000 node server.js

# Terminal 2
PORT=3001 node server.js
```

### Output:

- Both servers connect to the same MongoDB database.
- Each server shows its port in the response (e.g., "Server: 3000").

---
