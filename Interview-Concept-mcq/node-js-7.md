####  **Section 5: Worker Threads (10 Questions)**


### Q41: Worker Threads vs Child Process
```javascript
javascriptconst { Worker } = require('worker_threads');
const { fork } = require('child_process');

// Version A: Worker Thread
function cpuIntensiveWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// Version B: Child Process
function cpuIntensiveChild(data) {
  return new Promise((resolve, reject) => {
    const child = fork('./child.js');
    child.send(data);
    child.on('message', resolve);
    child.on('error', reject);
  });
}
When processing 1000 tasks, which is more efficient and why?
A) Both are equally efficient
B) Worker threads - lighter weight, shared memory
C) Child processes - better isolation
D) Worker threads - faster IPC
Answer: B) Worker threads - lighter weight, shared memory
Explanation:
Worker Threads:

Lightweight (threads vs processes)
Share memory (via SharedArrayBuffer)
Faster startup (~2ms vs ~30ms)
Lower memory overhead
Same V8 instance

Child Processes:

Complete isolation
Higher overhead
Separate V8 instances
Can run different Node versions
Better for untrusted code

Benchmark:
javascriptconst { Worker } = require('worker_threads');
const { fork } = require('child_process');

// Worker Thread: ~2-5ms startup, ~4MB memory per thread
async function benchmarkWorker() {
  const start = Date.now();
  const worker = new Worker('./worker.js');
  await new Promise(resolve => worker.on('online', resolve));
  await worker.terminate();
  return Date.now() - start;
}

// Child Process: ~30-50ms startup, ~30MB memory per process
async function benchmarkChild() {
  const start = Date.now();
  const child = fork('./child.js');
  await new Promise(resolve => child.on('message', resolve));
  child.kill();
  return Date.now() - start;
}

// Use Worker Threads for:
// - CPU-intensive tasks (image processing, crypto)
// - High-frequency parallel tasks
// - Shared memory requirements

// Use Child Processes for:
// - Complete isolation
// - Running different programs
// - Untrusted code
// - Long-running background jobs

```


### Q42: SharedArrayBuffer and Atomics

```javascript

javascriptconst { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  const sharedBuffer = new SharedArrayBuffer(4);
  const sharedArray = new Int32Array(sharedBuffer);
  
  const worker1 = new Worker(__filename, { workerData: { sharedBuffer } });
  const worker2 = new Worker(__filename, { workerData: { sharedBuffer } });
  
  // Increment counter 1000 times in each worker
} else {
  const sharedArray = new Int32Array(workerData.sharedBuffer);
  
  for (let i = 0; i < 1000; i++) {
    sharedArray[0]++;
  }
  
  parentPort.postMessage('done');
}
What is the expected final value of sharedArray[0]?
A) 2000 (always)
B) Less than 2000 (race condition)
C) More than 2000 (overflow)
D) 1000 (only one worker writes)
Answer: B) Less than 2000 (race condition)
Explanation:
Without atomic operations, concurrent writes cause race conditions:

Worker1 reads value: 100
Worker2 reads value: 100
Worker1 writes: 101
Worker2 writes: 101 (lost update!)

Correct Implementation with Atomics:
javascriptconst { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  const sharedBuffer = new SharedArrayBuffer(4);
  const sharedArray = new Int32Array(sharedBuffer);
  
  const worker1 = new Worker(__filename, { workerData: { sharedBuffer } });
  const worker2 = new Worker(__filename, { workerData: { sharedBuffer } });
  
  Promise.all([
    new Promise(resolve => worker1.on('message', resolve)),
    new Promise(resolve => worker2.on('message', resolve))
  ]).then(() => {
    console.log('Final count:', sharedArray[0]); // Guaranteed 2000
    worker1.terminate();
    worker2.terminate();
  });
} else {
  const sharedArray = new Int32Array(workerData.sharedBuffer);
  
  for (let i = 0; i < 1000; i++) {
    // Atomic increment - thread-safe
    Atomics.add(sharedArray, 0, 1);
  }
  
  parentPort.postMessage('done');
}

// Other useful Atomics operations:
const buffer = new SharedArrayBuffer(16);
const array = new Int32Array(buffer);

// Compare and exchange (lock-free algorithms)
Atomics.compareExchange(array, 0, 50, 100); // If array[0] === 50, set to 100

// Load and store (guaranteed atomic reads/writes)
Atomics.store(array, 0, 42);
const value = Atomics.load(array, 0);

// Wait and notify (thread synchronization)
// Thread 1: Wait for notification
Atomics.wait(array, 0, 0); // Block until array[0] changes from 0

// Thread 2: Notify waiting threads
Atomics.store(array, 0, 1);
Atomics.notify(array, 0); // Wake up 1 waiting thread


```
### Q43: Worker Thread Pool Performance

```javascript

javascriptconst { Worker } = require('worker_threads');

class WorkerPool {
  constructor(workerPath, size) {
    this.workers = [];
    for (let i = 0; i < size; i++) {
      this.workers.push(new Worker(workerPath));
    }
  }
  
  async execute(data) {
    const worker = this.workers.shift();
    
    return new Promise((resolve, reject) => {
      worker.once('message', (result) => {
        this.workers.push(worker);
        resolve(result);
      });
      
      worker.postMessage(data);
    });
  }
}

const pool = new WorkerPool('./worker.js', 4);
What happens if you execute 100 tasks simultaneously?
A) All tasks run in parallel
B) First 4 run, others wait indefinitely
C) Error is thrown
D) Tasks are distributed evenly
Answer: B) First 4 run, others wait indefinitely
Explanation:
The pool shifts workers but only pushes them back after tasks complete. Tasks 5-100 never get a worker because workers.shift() returns undefined.
Correct Worker Pool Implementation:
javascriptconst { Worker } = require('worker_threads');
const { EventEmitter } = require('events');

class WorkerPool extends EventEmitter {
  constructor(workerPath, size = 4) {
    super();
    this.workerPath = workerPath;
    this.size = size;
    this.workers = [];
    this.freeWorkers = [];
    this.taskQueue = [];
    
    for (let i = 0; i < size; i++) {
      this.createWorker();
    }
  }
  
  createWorker() {
    const worker = new Worker(this.workerPath);
    
    worker.on('message', (result) => {
      const task = worker.currentTask;
      if (task) {
        task.resolve(result);
        worker.currentTask = null;
        this.freeWorkers.push(worker);
        this.processQueue();
      }
    });
    
    worker.on('error', (err) => {
      const task = worker.currentTask;
      if (task) {
        task.reject(err);
        worker.currentTask = null;
      }
      
      // Replace failed worker
      const index = this.workers.indexOf(worker);
      if (index !== -1) {
        this.workers.splice(index, 1);
        this.createWorker();
      }
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
      
      const index = this.workers.indexOf(worker);
      if (index !== -1) {
        this.workers.splice(index, 1);
      }
    });
    
    this.workers.push(worker);
    this.freeWorkers.push(worker);
  }
  
  async execute(data, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const task = {
        data,
        resolve,
        reject,
        timeoutId: null
      };
      
      // Set timeout
      task.timeoutId = setTimeout(() => {
        const index = this.taskQueue.indexOf(task);
        if (index !== -1) {
          this.taskQueue.splice(index, 1);
          reject(new Error('Task timeout'));
        }
      }, timeout);
      
      this.taskQueue.push(task);
      this.processQueue();
    });
  }
  
  processQueue() {
    while (this.taskQueue.length > 0 && this.freeWorkers.length > 0) {
      const task = this.taskQueue.shift();
      const worker = this.freeWorkers.shift();
      
      clearTimeout(task.timeoutId);
      
      worker.currentTask = task;
      worker.postMessage(task.data);
    }
  }
  
  async terminate() {
    const promises = this.workers.map(worker => worker.terminate());
    await Promise.all(promises);
    this.workers = [];
    this.freeWorkers = [];
  }
  
  getStats() {
    return {
      totalWorkers: this.workers.length,
      freeWorkers: this.freeWorkers.length,
      queuedTasks: this.taskQueue.length
    };
  }
}

// Usage
const pool = new WorkerPool('./worker.js', 4);

// Execute 100 tasks - they'll be queued and processed 4 at a time
const tasks = Array.from({ length: 100 }, (_, i) => pool.execute({ id: i }));
const results = await Promise.all(tasks);

// Check stats
console.log(pool.getStats());

// Cleanup
await pool.terminate();


```
-----------------------------------------------------------------------
### Q44: Worker Thread Memory Leak
```javascript

javascriptconst { Worker, isMainThread, workerData } = require('worker_threads');

if (isMainThread) {
  setInterval(() => {
    const worker = new Worker(__filename, { workerData: { data: 'test' } });
    
    worker.on('message', (msg) => {
      console.log(msg);
    });
  }, 100);
} else {
  parentPort.postMessage('Worker started');
  
  // Simulate work
  setTimeout(() => {
    parentPort.postMessage('Work done');
  }, 1000);
}
What memory issue exists?
A) No issue
B) Workers are never terminated
C) Message listener leak
D) Both B and C
Answer: D) Both B and C
Explanation:

New worker created every 100ms but never terminated
Event listeners accumulate
Memory grows ~30MB per second

Correct Implementation:
javascriptconst { Worker, isMainThread, workerData, parentPort } = require('worker_threads');

if (isMainThread) {
  let activeWorkers = 0;
  const MAX_WORKERS = 10;
  
  setInterval(() => {
    if (activeWorkers >= MAX_WORKERS) {
      console.log('Max workers reached, skipping');
      return;
    }
    
    activeWorkers++;
    const worker = new Worker(__filename, { workerData: { data: 'test' } });
    
    const messageHandler = (msg) => {
      console.log(msg);
    };
    
    const exitHandler = (code) => {
      activeWorkers--;
      console.log(`Worker exited with code ${code}`);
    };
    
    worker.on('message', messageHandler);
    worker.once('exit', exitHandler);
    
    // Set timeout to terminate worker
    setTimeout(() => {
      worker.terminate().catch(console.error);
    }, 5000);
  }, 100);
  
  // Monitor memory
  setInterval(() => {
    const used = process.memoryUsage();
    console.log('Memory:', {
      rss: Math.round(used.rss / 1024 / 1024),
      heapUsed: Math.round(used.heapUsed / 1024 / 1024),
      activeWorkers
    });
  }, 5000);
} else {
  parentPort.postMessage('Worker started');
  
  setTimeout(() => {
    parentPort.postMessage('Work done');
    process.exit(0); // Explicit exit
  }, 1000);
}

// Better: Use a pool
class WorkerPool {
  constructor(workerPath, size) {
    this.workers = [];
    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerPath);
      this.workers.push(worker);
    }
  }
  
  async execute(data) {
    const worker = this.workers[Math.floor(Math.random() * this.workers.length)];
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, 30000);
      
      const messageHandler = (msg) => {
        clearTimeout(timeout);
        worker.removeListener('message', messageHandler);
        resolve(msg);
      };
      
      worker.once('message', messageHandler);
      worker.postMessage(data);
    });
  }
}

```

--------------------------------------------------------

### Q45: transferList for Zero-Copy

```javascript

javascriptconst { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // Process large buffer
  const largeBuffer = Buffer.allocUnsafe(100 * 1024 * 1024); // 100MB
  
  const worker = new Worker(__filename);
  worker.postMessage({ buffer: largeBuffer });
  
  // Try to use buffer after sending
  console.log('Buffer length:', largeBuffer.length);
} else {
  parentPort.on('message', ({ buffer }) => {
    console.log('Received buffer:', buffer.length);
  });
}
What's inefficient about this code?
A) Nothing, it's optimal
B) Buffer is copied, doubling memory usage
C) Buffer transfer is slow
D) Both B and C
Answer: D) Both B and C
Explanation:
postMessage() serializes/deserializes by default, creating a copy. For 100MB buffer:

Memory usage: 200MB (original + copy)
CPU time spent copying

Zero-Copy with transferList:
javascriptconst { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  const largeBuffer = Buffer.allocUnsafe(100 * 1024 * 1024); // 100MB
  
  const worker = new Worker(__filename);
  
  // Transfer ownership - zero-copy
  worker.postMessage(
    { buffer: largeBuffer },
    [largeBuffer.buffer] // transferList: ArrayBuffer is transferred
  );
  
  // Buffer is now neutered (length = 0)
  console.log('Buffer length after transfer:', largeBuffer.length); // 0
  
  worker.on('message', ({ buffer }) => {
    console.log('Buffer returned:', buffer.length);
  });
} else {
  parentPort.on('message', ({ buffer }) => {
    console.log('Received buffer:', buffer.length);
    
    // Process buffer...
    
    // Transfer back to main thread
    parentPort.postMessage(
      { buffer },
      [buffer.buffer]
    );
  });
}

// Real-world example: Image processing
const sharp = require('sharp');

if (isMainThread) {
  async function processImage(inputPath) {
    // Read image into buffer
    const imageBuffer = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
    
    const worker = new Worker(__filename);
    
    // Transfer buffer to worker (zero-copy)
    worker.postMessage(
      { 
        buffer: imageBuffer.data,
        width: imageBuffer.info.width,
        height: imageBuffer.info.height
      },
      [imageBuffer.data.buffer]
    );
    
    return new Promise((resolve, reject) => {
      worker.once('message', ({ buffer }) => {
        worker.terminate();
        resolve(Buffer.from(buffer));
      });
      
      worker.once('error', reject);
    });
  }
} else {
  parentPort.on('message', ({ buffer, width, height }) => {
    // Apply filter to image buffer
    const pixels = new Uint8Array(buffer);
    
    for (let i = 0; i < pixels.length; i += 3) {
      // Grayscale conversion
      const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
    }
    
    // Transfer back
    parentPort.postMessage(
      { buffer: pixels.buffer },
      [pixels.buffer]
    );
  });
}


```

----------------------------------------------------------
### Q46: Worker Thread Error Handling
```javascript

javascriptconst { Worker } = require('worker_threads');

function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { workerData: data });
    
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// worker.js
const { workerData, parentPort } = require('worker_threads');

if (workerData.value === 0) {
  throw new Error('Invalid value');
}

parentPort.postMessage(workerData.value * 2);
What happens if worker throws an error before setting up message handler?
A) Error is caught by 'error' listener
B) Uncaught exception crashes main thread
C) Promise rejects normally
D) Worker hangs
Answer: B) Uncaught exception crashes main thread
Explanation:
If error occurs during worker initialization (synchronous code), it may crash before the 'error' listener is attached.
Robust Error Handling:
javascriptconst { Worker } = require('worker_threads');

function runWorker(data, timeout = 30000) {
  return new Promise((resolve, reject) => {
    let worker;
    let finished = false;
    
    const cleanup = () => {
      if (worker && !finished) {
        worker.terminate().catch(console.error);
      }
    };
    
    const timeoutId = setTimeout(() => {
      if (!finished) {
        finished = true;
        cleanup();
        reject(new Error('Worker timeout'));
      }
    }, timeout);
    
    try {
      worker = new Worker('./worker.js', { 
        workerData: data,
        // Catch initialization errors
        eval: false // Disable eval for security
      });
      
      worker.on('message', (result) => {
        if (!finished) {
          finished = true;
          clearTimeout(timeoutId);
          resolve(result);
        }
      });
      
      worker.on('error', (err) => {
        if (!finished) {
          finished = true;
          clearTimeout(timeoutId);
          cleanup();
          reject(err);
        }
      });
      
      worker.on('exit', (code) => {
        if (!finished && code !== 0) {
          finished = true;
          clearTimeout(timeoutId);
          reject(new Error(`Worker exited with code ${code}`));
        }
      });
      
      worker.on('online', () => {
        console.log('Worker started successfully');
      });
      
    } catch (err) {
      // Catch synchronous errors during Worker creation
      finished = true;
      clearTimeout(timeoutId);
      reject(err);
    }
  });
}

// worker.js with proper error handling
const { workerData, parentPort } = require('worker_threads');

// Wrap all code in try-catch
try {
  if (!workerData || workerData.value === 0) {
    throw new Error('Invalid value');
  }
  
  const result = workerData.value * 2;
  parentPort.postMessage(result);
  
} catch (err) {
  // Send error as message instead of throwing
  parentPort.postMessage({
    error: true,
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  parentPort.postMessage({
    error: true,
    message: 'Unhandled rejection: ' + err.message
  });
  process.exit(1);
});

// Updated main thread handler
worker.on('message', (result) => {
  if (result.error) {
    reject(new Error(result.message));
  } else {
    resolve(result);
  }
});

```

---------------------------------------------------------------------

### Q47: Worker Thread MessageChannel

```javascript

javascriptconst { Worker, MessageChannel } = require('worker_threads');

const worker = new Worker('./worker.js');
const { port1, port2 } = new MessageChannel();

worker.postMessage({ port: port2 }, [port2]);

port1.on('message', (msg) => {
  console.log('Main received:', msg);
});

port1.postMessage('Hello from main');

// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ port }) => {
  port.on('message', (msg) => {
    console.log('Worker received:', msg);
    port.postMessage('Hello from worker');
  });
});
What's the advantage of MessageChannel over parentPort?
A) Faster communication
B) Bidirectional dedicated channel
C) Better error handling
D) No advantage
Answer: B) Bidirectional dedicated channel
Explanation:
MessageChannel creates a dedicated two-way communication channel, useful for:

Multiple workers communicating directly
Complex messaging patterns
Isolating different communication flows

Advanced Pattern - Worker-to-Worker Communication:
javascriptconst { Worker, MessageChannel, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  const worker1 = new Worker(__filename, { workerData: { name: 'Worker1' } });
  const worker2 = new Worker(__filename, { workerData: { name: 'Worker2' } });
  
  // Create channel for direct worker-to-worker communication
  const { port1, port2 } = new MessageChannel();
  
  // Give port1 to worker1
  worker1.postMessage({ type: 'setup', port: port1 }, [port1]);
  
  // Give port2 to worker2
  worker2.postMessage({ type: 'setup', port: port2 }, [port2]);
  
  // Workers can now communicate directly without main thread
  
  setTimeout(() => {
    worker1.postMessage({ type: 'send', message: 'Hi from Worker1!' });
  }, 1000);
  
} else {
  const { workerData } = require('worker_threads');
  let directPort;
  
  parentPort.on('message', ({ type, port, message }) => {
    if (type === 'setup') {
      directPort = port;
      
      directPort.on('message', (msg) => {
        console.log(`${workerData.name} received via channel:`, msg);
        
        // Send response back through channel
        directPort.postMessage(`${workerData.name} says: Message received!`);
      });
      
      console.log(`${workerData.name} channel setup complete`);
    }
    
    if (type === 'send' && directPort) {
      directPort.postMessage(message);
    }
  });
}

// Real-world use case: Pipeline processing
class WorkerPipeline {
  constructor(stages) {
    this.workers = [];
    this.channels = [];
    
    // Create workers for each stage
    for (let i = 0; i < stages.length; i++) {
      const worker = new Worker(stages[i].workerPath, {
        workerData: stages[i].config
      });
      this.workers.push(worker);
    }
    
    // Connect workers with MessageChannels
    for (let i = 0; i < this.workers.length - 1; i++) {
      const { port1, port2 } = new MessageChannel();
      this.channels.push({ port1, port2 });
      
      // Current worker sends to port1
      this.workers[i].postMessage({ outputPort: port1 }, [port1]);
      
      // Next worker receives from port2
      this.workers[i + 1].postMessage({ inputPort: port2 }, [port2]);
    }
  }
  
  async process(data) {
    return new Promise((resolve, reject) => {
      // First worker receives input
      this.workers[0].postMessage({ input: data });
      
      // Last worker sends output
      const lastWorker = this.workers[this.workers.length - 1];
      lastWorker.once('message', ({ output }) => {
        resolve(output);
      });
    });
  }
}

// Usage: image processing pipeline
const pipeline = new WorkerPipeline([
  { workerPath: './resize-worker.js', config: { width: 800 } },
  { workerPath: './filter-worker.js', config: { filter: 'grayscale' } },
  { workerPath: './compress-worker.js', config: { quality: 80 } }
]);

const result = await pipeline.process(imageBuffer);


```

----------------------------------------------------


### Q48: Worker Thread Resource Limits

```javascript

javascriptconst { Worker } = require('worker_threads');

const worker = new Worker(`
  const { parentPort } = require('worker_threads');
  
  const hugeArray = [];
  for (let i = 0; i < 1000000000; i++) {
    hugeArray.push(i);
  }
  
  parentPort.postMessage('done');
`, { eval: true });
What happens to this worker?
A) Runs successfully
B) Out of memory error
C) Crashes main thread
D) Automatically throttled
Answer: B) Out of memory error
Explanation:
Workers share V8 heap limits with the main thread. A worker consuming excessive memory can crash the entire process.
Setting Resource Limits:
javascriptconst { Worker } = require('worker_threads');
const v8 = require('v8');

// Set max heap size for main process
// node --max-old-space-size=4096 app.js

// Monitor worker memory
function createMonitoredWorker(workerPath, options = {}) {
  const worker = new Worker(workerPath, options);
  
  let memoryCheckInterval = setInterval(() => {
    worker.postMessage({ type: 'memory-check' });
  }, 5000);
  
  worker.on('message', (msg) => {
    if (msg.type === 'memory-stats') {
      const heapUsedMB = msg.heapUsed / 1024 / 1024;
      console.log(`Worker memory: ${heapUsedMB.toFixed(2)}MB`);
      
      // Kill worker if memory exceeds threshold
      if (heapUsedMB > 500) {
        console.error('Worker exceeded memory limit, terminating');
        clearInterval(memoryCheckInterval);
        worker.terminate();
      }
    }
  });
  
  worker.on('exit', () => {
    clearInterval(memoryCheckInterval);
  });
  
  return worker;
}

// worker.js
const { parentPort } = require('worker_threads');
const v8 = require('v8');

parentPort.on('message', (msg) => {
  if (msg.type === 'memory-check') {
    const stats = v8.getHeapStatistics();
    parentPort.postMessage({
      type: 'memory-stats',
      heapUsed: stats.used_heap_size,
      heapTotal: stats.total_heap_size
    });
  }
});

// Alternative: Use worker.resourceLimits (Node.js 13.2+)
const worker = new Worker('./worker.js', {
  resourceLimits: {
    maxOldGenerationSizeMb: 512,  // 512MB heap limit
    maxYoungGenerationSizeMb: 64,  // 64MB young gen
    codeRangeSizeMb: 128,          // Code space limit
    stackSizeMb: 4                 // Stack size
  }
});

// Worker exceeding limits will be terminated automatically
worker.on('exit', (code) => {
  if (code === 1) {
    console.error('Worker terminated due to resource limits');
  }
});

```
---------------------------------------------------------------------

### Q49: Worker Thread with TypedArray Performance

```javascript

javascriptconst { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  const data = Array.from({ length: 1000000 }, (_, i) => i);
  
  const worker = new Worker(__filename);
  worker.postMessage(data);
  
  worker.on('message', (sum) => {
    console.log('Sum:', sum);
  });
} else {
  parentPort.on('message', (data) => {
    const sum = data.reduce((acc, val) => acc + val, 0);
    parentPort.postMessage(sum);
  });
}
What's the performance issue?
A) No issue
B) Array serialization overhead
C) Slow reduce operation
D) Memory leak
Answer: B) Array serialization overhead
Explanation:
Regular arrays are serialized with structured clone algorithm, which is slow for large arrays. Each element is copied individually.
Optimized with TypedArray:
javascriptconst { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // Use TypedArray for better performance
  const data = new Float64Array(1000000);
  for (let i = 0; i < data.length; i++) {
    data[i] = i;
  }
  
  const start = Date.now();
  const worker = new Worker(__filename);
  
  // Transfer ownership - zero-copy
  worker.postMessage(data, [data.buffer]);
  
  worker.on('message', (sum) => {
    console.log('Sum:', sum);
    console.log('Time:', Date.now() - start, 'ms');
  });
} else {
  parentPort.on('message', (data) => {
    // Much faster for TypedArray
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    parentPort.postMessage(sum);
  });
}

// Performance comparison
async function benchmark() {
  const size = 10000000; // 10M elements
  
  // Regular Array
  console.time('Array transfer');
  const arr = Array.from({ length: size }, (_, i) => i);
  const worker1 = new Worker('./worker-array.js');
  worker1.postMessage(arr);
  await new Promise(resolve => worker1.on('message', resolve));
  console.timeEnd('Array transfer'); // ~800ms
  
  // TypedArray with transfer
  console.time('TypedArray transfer');
  const typed = new Float64Array(size);
  for (let i = 0; i < size; i++) typed[i] = i;
  const worker2 = new Worker('./worker-typed.js');
  worker2.postMessage(typed, [typed.buffer]);
  await new Promise(resolve => worker2.on('message', resolve));
  console.timeEnd('TypedArray transfer'); // ~2ms
  
  // 400x faster!
}

// Real-world example: Audio processing
class AudioProcessor {
  constructor() {
    this.worker = new Worker('./audio-worker.js');
  }
  
  async processAudio(audioBuffer) {
    // AudioBuffer already uses Float32Array
    const channelData = audioBuffer.getChannelData(0);
    
    return new Promise((resolve, reject) => {
      this.worker.once('message', (processedBuffer) => {
        resolve(processedBuffer);
      });
      
      this.worker.once('error', reject);
      
      // Transfer audio data efficiently
      this.worker.postMessage(
        { 
          samples: channelData,
          sampleRate: audioBuffer.sampleRate
        },
        [channelData.buffer]
      );
    });
  }
}

// audio-worker.js
parentPort.on('message', ({ samples, sampleRate }) => {
  const processed = new Float32Array(samples.length);
  
  // Apply effects (e.g., normalize)
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    max = Math.max(max, Math.abs(samples[i]));
  }
  
  for (let i = 0; i < samples.length; i++) {
    processed[i] = samples[i] / max;
  }
  
  parentPort.postMessage(processed, [processed.buffer]);
});


```

-----------------------------------------------------------------------------------
```javascript
### Q50: Worker Thread Startup Cost
javascriptconst { Worker } = require('worker_threads');
const express = require('express');
const app = express();

app.post('/process', async (req, res) => {
  const worker = new Worker('./processor.js');
  
  worker.postMessage(req.body);
  
  worker.on('message', (result) => {
    res.json(result);
    worker.terminate();
  });
});

app.listen(3000);
What's the performance problem?
A) No problem
B) Worker creation overhead on every request
C) Memory leak from unterminated workers
D) Race condition
Answer: B) Worker creation overhead on every request
Explanation:
Creating a worker takes ~2-5ms. For high-frequency requests (e.g., 1000/sec), this adds 2-5 seconds of overhead.
Solution: Worker Pool with Warm Workers:
javascriptconst { Worker } = require('worker_threads');
const express = require('express');
const app = express();

class WorkerPool {
  constructor(workerPath, size = 4) {
    this.workerPath = workerPath;
    this.workers = [];
    this.freeWorkers = [];
    this.taskQueue = [];
    
    // Pre-create workers
    for (let i = 0; i < size; i++) {
      this.createWorker();
    }
  }
  
  createWorker() {
    const worker = new Worker(this.workerPath);
    
    worker.on('message', (result) => {
      if (worker.currentTask) {
        worker.currentTask.resolve(result);
        worker.currentTask = null;
        this.freeWorkers.push(worker);
        this.processQueue();
      }
    });
    
    worker.on('error', (err) => {
      if (worker.currentTask) {
        worker.currentTask.reject(err);
        worker.currentTask = null;
      }
      this.replaceWorker(worker);
    });
    
    this.workers.push(worker);
    this.freeWorkers.push(worker);
  }
  
  replaceWorker(oldWorker) {
    const index = this.workers.indexOf(oldWorker);
    if (index !== -1) {
      this.workers.splice(index, 1);
      oldWorker.terminate().catch(console.error);
      this.createWorker();
    }
  }
  
  execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };
      this.taskQueue.push(task);
      this.processQueue();
    });
  }
  
  processQueue() {
    while (this.taskQueue.length > 0 && this.freeWorkers.length > 0) {
      const task = this.taskQueue.shift();
      const worker = this.freeWorkers.shift();
      
      worker.currentTask = task;
      worker.postMessage(task.data);
    }
  }
}

const pool = new WorkerPool('./processor.js', 4);

app.post('/process', async (req, res) => {
  try {
    const result = await pool.execute(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Performance comparison
async function benchmark() {
  const iterations = 1000;
  
  // Without pool - create worker per request
  console.time('No pool');
  for (let i = 0; i < iterations; i++) {
    const worker = new Worker('./processor.js');
    await new Promise(resolve => {
      worker.on('message', () => {
        worker.terminate();
        resolve();
      });
      worker.postMessage({ data: i });
    });
  }
  console.timeEnd('No pool'); // ~5000ms
  
  // With pool - reuse workers
  console.time('With pool');
  const pool = new WorkerPool('./processor.js', 4);
  const tasks = [];
  for (let i = 0; i < iterations; i++) {
    tasks.push(pool.execute({ data: i }));
  }
  await Promise.all(tasks);
  console.timeEnd('With pool'); // ~200ms
  
  // 25x faster!
}

app.listen(3000);

```


# Summary: Key Takeaways

## Event Loop

- **Execution Order:** Sync → nextTick → Microtasks → Event Loop Phases
- **Avoid Blocking:** Break CPU-intensive work into chunks with setImmediate
- **nextTick Recursion:** Can starve event loop; use setImmediate instead

## Filesystem

- **Atomic Writes:** Use temp file + rename for crash-safe writes
- **File Descriptor Leaks:** Always close file handles in finally blocks
- **Race Conditions:** Use file locking for concurrent access
- **Path Traversal:** Validate and sanitize all user-provided file paths
- **Memory Efficiency:** Use streams for large files, never readFile for GB files

## Cluster

- **Memory Isolation:** Workers don't share memory; use Redis for shared state
- **Graceful Restart:** Replace workers one-by-one for zero-downtime deploys
- **Sticky Sessions:** Use Redis session store or sticky routing for sessions
- **Resource Monitoring:** Monitor worker memory and restart leaky workers
- **WebSocket:** Use Redis Pub/Sub for cross-worker broadcasting

## Child Process

- **Security:** Use spawn over exec to prevent command injection
- **Resource Limits:** Use process pools to limit concurrent child processes
- **Zombie Processes:** Always handle exit/close events
- **Backpressure:** Handle IPC channel overflow with batching
- **Cleanup:** Terminate child processes on parent exit

## Worker Threads

- **vs Child Process:** Use workers for CPU tasks (lighter, faster, shared memory)
- **Atomics:** Use Atomics for SharedArrayBuffer thread-safe operations
- **Transfer Lists:** Use transferList for zero-copy buffer transfers
- **Worker Pools:** Reuse workers to avoid startup overhead (~2-5ms per worker)
- **TypedArray:** 100-400x faster transfer than regular arrays
- **Resource Limits:** Set memory limits to prevent worker OOM crashes

## 🎯 Pro Tips

- Use streams for anything >10MB
- Use worker pools, not one-off workers
- Always clean up resources (listeners, workers, file handles)
- Monitor memory in production
- Test concurrent scenarios
- Use TypedArrays for performance-critical data transfer

## Key Takeaways

1. **Event Loop Ordering**: `process.nextTick` > Promises (microtasks) > `setImmediate` > I/O callbacks > timers
2. **Stream Backpressure**: Always use `pipe()` or manually check `write()` return value
3. **EventEmitter Leaks**: Always remove listeners on cleanup (connection close, request end)
4. **Error Events**: Always handle 'error' events on EventEmitters to prevent crashes
5. **WebSocket Health**: Implement ping/pong heartbeats to detect dead connections
6. **Async Ordering**: Don't forget `await` for operations that must complete before continuing
7. **Stream Errors**: Handle errors before piping to responses to avoid hung connections
8. **File Race Conditions**: Use locking mechanisms for concurrent file access
9. **Memory Management**: Clean up resources (listeners, timers, connections) on disconnect/close
10. **Pipeline Pattern**: Use `stream.pipeline()` for automatic error propagation and cleanup

## Topics Covered:

✅ **Event Loop Behavior** - with streams & async fs operations  
✅ **Filesystem Operations** - race conditions, atomic operations, file locking  
✅ **Streams** - backpressure, transform streams, error handling, pipeline  
✅ **EventEmitter** - memory leaks, error handling, listener management  
✅ **WebSocket** - connection health, ping/pong, cleanup, memory leaks

