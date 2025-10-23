

### Section 3: Cluster Module (10 Questions)
### Q21: Basic Cluster Memory Sharing

```javascript
javascriptconst cluster = require('cluster');
const http = require('http');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  
  const sharedData = { counter: 0 };
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  http.createServer((req, res) => {
    sharedData.counter++;
    res.end(`Counter: ${sharedData.counter}`);
  }).listen(8000);
}

What happens to sharedData.counter?
A) All workers share the same counter
B) Each worker has its own counter starting at 0
C) Reference error: sharedData is not defined
D) Counter increments but inconsistently
Answer: C) Reference error: sharedData is not defined
Explanation:
Workers are separate Node.js processes with isolated memory. sharedData exists only in the master process. Workers cannot access master's memory.
Correct Pattern for Shared State:
javascriptconst cluster = require('cluster');
const http = require('http');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  let counter = 0;
  
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    
    // Workers send messages to master
    worker.on('message', (msg) => {
      if (msg.cmd === 'increment') {
        counter++;
        // Broadcast new value to all workers
        Object.values(cluster.workers).forEach(w => {
          w.send({ cmd: 'counter', value: counter });
        });
      }
    });
  }
} else {
  let localCounter = 0;
  
  process.on('message', (msg) => {
    if (msg.cmd === 'counter') {
      localCounter = msg.value;
    }
  });
  
  http.createServer((req, res) => {
    process.send({ cmd: 'increment' });
    res.end(`Counter: ${localCounter}`);
  }).listen(8000);
}

// Better: Use Redis for shared state
const Redis = require('ioredis');
const redis = new Redis();

if (!cluster.isMaster) {
  http.createServer(async (req, res) => {
    const counter = await redis.incr('counter');
    res.end(`Counter: ${counter}`);
  }).listen(8000);
}
```
-------
### Q22: Worker Restart Strategy

```javascript
javascriptconst cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  require('./app');
}
What problem exists with this restart strategy?
A) Workers restart too slowly
B) Restart loops can exhaust resources
C) No problem, it's correct
D) Workers don't restart
Answer: B) Restart loops can exhaust resources
Explanation:
If a worker crashes immediately on startup (e.g., syntax error, missing dependency), it creates an infinite restart loop, spawning thousands of processes and crashing the system.
Correct Implementation with Throttling:
javascriptconst cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  const restartQueue = [];
  let restarting = false;
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (code: ${code})`);
    
    const now = Date.now();
    restartQueue.push(now);
    
    // Remove restarts older than 1 minute
    const cutoff = now - 60000;
    while (restartQueue.length && restartQueue[0] < cutoff) {
      restartQueue.shift();
    }
    
    // If more than 5 restarts in 1 minute, something's wrong
    if (restartQueue.length > 5) {
      console.error('Too many restarts, stopping cluster');
      process.exit(1);
    }
    
    // Delay restart slightly to prevent thundering herd
    setTimeout(() => {
      console.log('Restarting worker...');
      cluster.fork();
    }, 1000);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Master received SIGTERM, shutting down gracefully');
    
    Object.values(cluster.workers).forEach(worker => {
      worker.send('shutdown');
      
      setTimeout(() => {
        worker.kill();
      }, 10000); // Force kill after 10s
    });
  });
} else {
  const server = require('./app');
  
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      console.log('Worker received shutdown signal');
      
      server.close(() => {
        console.log('Worker closed all connections');
        process.exit(0);
      });
      
      // Force exit after 5s if connections don't close
      setTimeout(() => {
        process.exit(0);
      }, 5000);
    }
  });
}
```
------
### Q23: Load Distribution in Cluster

```javascript
javascriptconst cluster = require('cluster');
const express = require('express');
const os = require('os');

if (cluster.isMaster) {
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
} else {
  const app = express();
  
  // Simulate long-running request
  app.get('/long', (req, res) => {
    const start = Date.now();
    while (Date.now() - start < 5000) {
      // Block for 5 seconds
    }
    res.send('Done');
  });
  
  app.get('/fast', (req, res) => {
    res.send('Fast response');
  });
  
  app.listen(3000);
}
If one worker receives a /long request, what happens to /fast requests?
A) They're distributed to other workers
B) They're blocked on the same worker
C) They're queued until /long completes
D) An error is thrown
Answer: A) They're distributed to other workers
Explanation:
The OS kernel handles round-robin distribution of incoming connections to workers. While one worker is blocked, others continue accepting requests.
However, if ALL workers are blocked:
javascript// If you have 4 CPUs and 4 concurrent /long requests
// The 5th request (even /fast) must wait!
Better Pattern - Don't Block:
javascriptconst { Worker } = require('worker_threads');

app.get('/long', (req, res) => {
  const worker = new Worker('./heavy-work.js');
  
  worker.on('message', (result) => {
    res.send(result);
  });
  
  worker.on('error', (err) => {
    res.status(500).send('Error');
  });
});

// Or use async operations
app.get('/long', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 5000));
  res.send('Done');
});
 ```

-----------

### Q24: Cluster Communication Performance
```javascript 
javascriptconst cluster = require('cluster');
const express = require('express');

if (cluster.isMaster) {
  cluster.fork();
  cluster.fork();
  
  cluster.on('message', (worker, msg) => {
    // Broadcast to all other workers
    Object.values(cluster.workers).forEach(w => {
      if (w.id !== worker.id) {
        w.send(msg);
      }
    });
  });
} else {
  const app = express();
  
  app.post('/broadcast', (req, res) => {
    process.send({ type: 'broadcast', data: req.body });
    res.json({ success: true });
  });
  
  process.on('message', (msg) => {
    console.log('Received broadcast:', msg);
  });
  
  app.listen(3000);
}
What's the performance concern with this pattern?
A) Messages are lost
B) IPC (Inter-Process Communication) is slow for high-frequency messages
C) Memory leak in message queue
D) Race conditions
Answer: B) IPC (Inter-Process Communication) is slow for high-frequency messages
Explanation:
IPC between processes involves:

Serialization (JSON.stringify)
System calls
Deserialization (JSON.parse)

For high-frequency broadcasts (e.g., 1000/sec), this creates bottlenecks.
Better Patterns:
javascript// Pattern 1: Use Redis Pub/Sub for high-frequency broadcasts
const Redis = require('ioredis');
const redis = new Redis();
const subscriber = new Redis();

if (!cluster.isMaster) {
  subscriber.subscribe('broadcasts');
  
  subscriber.on('message', (channel, message) => {
    console.log('Received:', JSON.parse(message));
  });
  
  app.post('/broadcast', async (req, res) => {
    await redis.publish('broadcasts', JSON.stringify(req.body));
    res.json({ success: true });
  });
}

// Pattern 2: Batch messages to reduce IPC overhead
class MessageBatcher {
  constructor(interval = 100) {
    this.queue = [];
    this.interval = interval;
    this.start();
  }
  
  send(message) {
    this.queue.push(message);
  }
  
  start() {
    setInterval(() => {
      if (this.queue.length > 0) {
        process.send({ batch: this.queue });
        this.queue = [];
      }
    }, this.interval);
  }
}

const batcher = new MessageBatcher();

app.post('/broadcast', (req, res) => {
  batcher.send(req.body);
  res.json({ success: true });
});

```

--------
### Q25: Cluster Zero-Downtime Deployment
```javascript
javascriptconst cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const workers = [];
  
  for (let i = 0; i < os.cpus().length; i++) {
    workers.push(cluster.fork());
  }
  
  process.on('SIGUSR2', () => {
    console.log('Reloading workers');
    
    workers.forEach(worker => {
      worker.kill();
    });
    
    for (let i = 0; i < os.cpus().length; i++) {
      workers.push(cluster.fork());
    }
  });
} else {
  require('./app').listen(3000);
}
What's wrong with this reload strategy?
A) All workers are killed simultaneously, causing downtime
B) New workers start before old ones finish
C) No error handling
D) All of the above
Answer: D) All of the above
Explanation:
This causes several seconds of complete downtime as all workers are killed before new ones are ready.
Correct Zero-Downtime Pattern:
javascriptconst cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  const workers = [];
  
  function forkWorker() {
    const worker = cluster.fork();
    worker.on('listening', () => {
      console.log(`Worker ${worker.process.pid} is listening`);
    });
    return worker;
  }
  
  // Initial workers
  for (let i = 0; i < numCPUs; i++) {
    workers.push(forkWorker());
  }
  
  function reloadWorkers() {
    const workersToReload = [...workers];
    workers.length = 0;
    
    function reloadNext() {
      if (workersToReload.length === 0) {
        console.log('All workers reloaded');
        return;
      }
      
      const oldWorker = workersToReload.shift();
      const newWorker = forkWorker();
      workers.push(newWorker);
      
      // Wait for new worker to be ready
      newWorker.once('listening', () => {
        console.log(`New worker ready, disconnecting old worker ${oldWorker.process.pid}`);
        
        // Gracefully disconnect old worker
        oldWorker.disconnect();
        
        // Give old worker 10s to finish existing requests
        setTimeout(() => {
          if (!oldWorker.isDead()) {
            oldWorker.kill();
          }
          
          // Reload next worker
          setTimeout(reloadNext, 500);
        }, 10000);
      });
    }
    
    reloadNext();
  }
  
  process.on('SIGUSR2', () => {
    console.log('Received reload signal');
    reloadWorkers();
  });
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    const index = workers.indexOf(worker);
    if (index !== -1) {
      workers.splice(index, 1);
      workers.push(forkWorker());
    }
  });
}

```
---------
### Q26: Cluster Sticky Sessions
```javascript 

javascriptconst cluster = require('cluster');
const express = require('express');
const session = require('express-session');

if (cluster.isMaster) {
  cluster.fork();
  cluster.fork();
} else {
  const app = express();
  
  app.use(session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: true
  }));
  
  app.get('/set', (req, res) => {
    req.session.data = 'important data';
    res.send('Session set');
  });
  
  app.get('/get', (req, res) => {
    res.send(req.session.data || 'No data');
  });
  
  app.listen(3000);
}
What problem occurs with this session setup?
A) Sessions work correctly
B) Sessions randomly return "No data" on different requests
C) Memory leak
D) Sessions are shared across workers
Answer: B) Sessions randomly return "No data" on different requests
Explanation:
By default, sessions are stored in memory. With cluster mode:

Request 1 goes to Worker A, sets session
Request 2 goes to Worker B, session doesn't exist

Each worker has its own memory space.
Solutions:
javascript// Solution 1: Sticky sessions (route by IP)
const cluster = require('cluster');
const sticky = require('sticky-session');

if (cluster.isMaster) {
  cluster.fork();
  cluster.fork();
  
  // Don't listen in workers
} else {
  const app = express();
  // ... session setup
  const server = app.listen(3000);
}

// Master handles sticky routing
if (cluster.isMaster) {
  const net = require('net');
  const server = net.createServer({ pauseOnConnect: true }, (connection) => {
    // Hash IP address to determine worker
    const worker = workers[hash(connection.remoteAddress) % workers.length];
    worker.send('sticky-session:connection', connection);
  });
  server.listen(3000);
}

// Solution 2: Shared session store (RECOMMENDED)
const RedisStore = require('connect-redis')(session);
const Redis = require('ioredis');
const redis = new Redis();

if (!cluster.isMaster) {
  app.use(session({
    store: new RedisStore({ client: redis }),
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false
  }));
}

// Solution 3: JWT tokens (stateless)
const jwt = require('jsonwebtoken');

app.post('/login', (req, res) => {
  const token = jwt.sign(
    { userId: req.body.userId },
    'secret',
    { expiresIn: '1h' }
  );
  res.json({ token });
});

app.get('/protected', (req, res) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, 'secret');
  res.json({ userId: decoded.userId });
});

```

----------

### Q27: Worker Resource Limits
```javascript

javascriptconst cluster = require('cluster');
const v8 = require('v8');

if (cluster.isMaster) {
  cluster.fork();
  cluster.fork();
  cluster.fork();
  cluster.fork();
} else {
  const express = require('express');
  const app = express();
  
  app.get('/memory', (req, res) => {
    const stats = v8.getHeapStatistics();
    res.json({
      worker: cluster.worker.id,
      heapUsed: stats.used_heap_size / 1024 / 1024,
      heapTotal: stats.total_heap_size / 1024 / 1024
    });
  });
  
  app.get('/leak', (req, res) => {
    global.leakyArray = global.leakyArray || [];
    global.leakyArray.push(new Array(1000000).fill('leak'));
    res.send('Leaked 1MB');
  });
  
  app.listen(3000);
}
If Worker 1 has a memory leak, what happens?
A) All workers crash
B) Only Worker 1 crashes eventually
C) Master detects and restarts Worker 1
D) Memory is shared, all workers affected
Answer: B) Only Worker 1 crashes eventually
Explanation:
Workers are isolated processes. One worker's memory leak doesn't affect others. However, without monitoring, the leaky worker consumes resources until it crashes.
Better: Monitor and Restart Leaky Workers:
javascriptconst cluster = require('cluster');
const v8 = require('v8');

if (cluster.isMaster) {
  const workers = new Map();
  
  for (let i = 0; i < 4; i++) {
    const worker = cluster.fork();
    workers.set(worker.id, {
      worker,
      memoryUsage: []
    });
  }
  
  // Monitor worker memory every 30 seconds
  setInterval(() => {
    workers.forEach(({ worker }) => {
      worker.send({ cmd: 'memory-check' });
    });
  }, 30000);
  
  cluster.on('message', (worker, msg) => {
    if (msg.cmd === 'memory-stats') {
      const workerData = workers.get(worker.id);
      workerData.memoryUsage.push(msg.heapUsed);
      
      // Keep only last 10 measurements
      if (workerData.memoryUsage.length > 10) {
        workerData.memoryUsage.shift();
      }
      
      // Check if memory is consistently growing
      const increasing = workerData.memoryUsage.every((val, idx, arr) => 
        idx === 0 || val >= arr[idx - 1]
      );
      
      if (increasing && msg.heapUsed > 500) { // 500MB threshold
        console.log(`Worker ${worker.id} may have memory leak, restarting`);
        worker.kill();
      }
    }
  });
} else {
  process.on('message', (msg) => {
    if (msg.cmd === 'memory-check') {
      const stats = v8.getHeapStatistics();
      process.send({
        cmd: 'memory-stats',
        heapUsed: stats.used_heap_size / 1024 / 1024
      });
    }
  });
  
  require('./app').listen(3000);
}


```

---------

### Q28: Cluster with WebSocket

```javascript

javascriptconst cluster = require('cluster');
const express = require('express');
const WebSocket = require('ws');

if (cluster.isMaster) {
  cluster.fork();
  cluster.fork();
} else {
  const app = express();
  const server = require('http').createServer(app);
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });
  
  server.listen(3000);
}
What problem exists with WebSocket broadcasting in cluster mode?
A) WebSockets don't work with cluster
B) Messages only broadcast within the same worker
C) Connection drops randomly
D) Memory leak
Answer: B) Messages only broadcast within the same worker
Explanation:
Each worker has its own wss.clients Set. A message from Client A (Worker 1) only broadcasts to other clients on Worker 1, not Worker 2.
Solution: Redis Pub/Sub for Cross-Worker Broadcasting:
javascriptconst Redis = require('ioredis');
const publisher = new Redis();
const subscriber = new Redis();

if (!cluster.isMaster) {
  const app = express();
  const server = require('http').createServer(app);
  const wss = new WebSocket.Server({ server });
  
  // Subscribe to broadcast channel
  subscriber.subscribe('websocket-broadcast');
  
  subscriber.on('message', (channel, message) => {
    // Forward to all clients on THIS worker
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      // Publish to Redis (reaches all workers)
      publisher.publish('websocket-broadcast', message.toString());
    });
  });
  
  server.listen(3000);
}

// Alternative: Socket.IO with Redis adapter (handles this automatically)
const io = require('socket.io')(server);
const redisAdapter = require('socket.io-redis');

io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));

io.on('connection', (socket) => {
  socket.on('message', (msg) => {
    io.emit('message', msg); // Broadcasts across ALL workers automatically
  });
});

```

---------
### Q29: Cluster Master Process CPU Usage
``` javascript
javascriptconst cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const stats = { requests: 0 };
  
  for (let i = 0; i < os.cpus().length; i++) {
    const worker = cluster.fork();
    
    worker.on('message', (msg) => {
      if (msg.type === 'request') {
        stats.requests++;
        
        // Send updated stats to all workers
        Object.values(cluster.workers).forEach(w => {
          w.send({ type: 'stats', data: stats });
        });
      }
    });
  }
  
  // Log stats every second
  setInterval(() => {
    console.log('Total requests:', stats.requests);
  }, 1000);
} else {
  const express = require('express');
  const app = express();
  
  app.get('*', (req, res) => {
    process.send({ type: 'request' });
    res.send('OK');
  });
  
  app.listen(3000);
}
What's the performance issue with this pattern?
A) No issue, this is correct
B) Master process becomes CPU-bound from message handling
C) Memory leak in stats object
D) Workers receive duplicate messages
Answer: B) Master process becomes CPU-bound from message handling
Explanation:
Under high load (e.g., 10,000 req/sec), the master process:

Receives 10,000 messages/sec
Broadcasts 10,000 × (num_workers) messages/sec
Becomes a bottleneck, reducing overall throughput

Better Pattern - Aggregate in Workers:
javascriptif (cluster.isMaster) {
  const workerStats = new Map();
  
  for (let i = 0; i < os.cpus().length; i++) {
    const worker = cluster.fork();
    workerStats.set(worker.id, { requests: 0 });
    
    worker.on('message', (msg) => {
      if (msg.type === 'batch-stats') {
        workerStats.set(worker.id, msg.data);
      }
    });
  }
  
  // Aggregate stats every 5 seconds instead of per-request
  setInterval(() => {
    const total = Array.from(workerStats.values())
      .reduce((sum, stat) => sum + stat.requests, 0);
    console.log('Total requests:', total);
  }, 5000);
} else {
  const express = require('express');
  const app = express();
  
  let localStats = { requests: 0 };
  
  // Send stats periodically instead of per-request
  setInterval(() => {
    process.send({ type: 'batch-stats', data: localStats });
  }, 5000);
  
  app.get('*', (req, res) => {
    localStats.requests++;
    res.send('OK');
  });
  
  app.listen(3000);
}

```
---------

### Q30: Cluster Port Sharing

``` javascript
javascriptconst cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {
  cluster.fork();
  cluster.fork();
  
  // Master also acts as a worker
  http.createServer((req, res) => {
    res.end(`Master: ${process.pid}`);
  }).listen(3000);
} else {
  http.createServer((req, res) => {
    res.end(`Worker: ${process.pid}`);
  }).listen(3000);
}
What happens when you run this code?
A) All processes share port 3000 equally
B) EADDRINUSE error on workers
C) Only master handles requests
D) Round-robin between master and workers
Answer: B) EADDRINUSE error on workers
Explanation:
The master binds to port 3000 first. When workers try to bind, they get "address already in use" error.
Correct Pattern:
javascriptif (cluster.isMaster) {
  cluster.fork();
  cluster.fork();
  // Master should NOT listen
} else {
  // Only workers listen
  http.createServer((req, res) => {
    res.end(`Worker: ${process.pid}`);
  }).listen(3000);
}

// Special case: If you WANT master to handle some requests
if (cluster.isMaster) {
  const workers = [];
  
  for (let i = 0; i < 2; i++) {
    workers.push(cluster.fork());
  }
  
  // Master listens on different port
  http.createServer((req, res) => {
    res.end('Admin interface');
  }).listen(3001); // Different port!
}
