
# Threading & Multithreading - Complete Guide for JavaScript/TypeScript

---

## **1. FUNDAMENTALS: Understanding Threading**

### **What is a Thread?**

A **thread** is the smallest unit of execution within a process. Think of it as a worker that can perform tasks.

**Real-World Analogy:**
```
Restaurant Kitchen:
- Kitchen (Process) = Your Application
- Chefs (Threads) = Workers executing tasks
- Orders (Tasks) = Work to be done

Single-threaded: 1 chef handles all orders sequentially
Multi-threaded: Multiple chefs handle orders simultaneously
```

---

### **JavaScript's Threading Model**

**JavaScript is Single-Threaded** but has **asynchronous capabilities**.

```javascript
// JavaScript Event Loop Architecture
┌───────────────────────────┐
│   Call Stack (Main Thread) │
│   ┌─────────────────────┐ │
│   │  function foo()     │ │
│   │  function bar()     │ │
│   └─────────────────────┘ │
└───────────────────────────┘
         ↕
┌───────────────────────────┐
│   Event Loop               │
└───────────────────────────┘
         ↕
┌───────────────────────────┐
│   Callback Queue           │
│   [callback1, callback2]   │
└───────────────────────────┘
         ↕
┌───────────────────────────┐
│   Web APIs / Node APIs     │
│   - setTimeout             │
│   - Promises              │
│   - File I/O              │
└───────────────────────────┘
```

---

## **2. JAVASCRIPT CONCURRENCY PATTERNS**

### **SCENARIO 1: Synchronous vs Asynchronous**

```javascript
// ❌ BLOCKING (Synchronous)
console.log('Start');

// This blocks the main thread for 3 seconds
function sleep(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Busy waiting - BLOCKS everything!
  }
}

sleep(3000); // Browser freezes, can't click anything!
console.log('End');

// Output:
// Start
// (3 second freeze)
// End
```

```javascript
// ✅ NON-BLOCKING (Asynchronous)
console.log('Start');

setTimeout(() => {
  console.log('Async operation done');
}, 3000);

console.log('End');

// Output:
// Start
// End
// (3 seconds later)
// Async operation done
```

**Why This Matters:**
- Blocking code freezes the UI
- Can't handle user interactions
- Bad user experience

---

### **SCENARIO 2: Promises & Async/Await**

```typescript
// Real-world example: Fetching user data
interface User {
  id: number;
  name: string;
  email: string;
}

interface Order {
  id: number;
  userId: number;
  total: number;
}

// ❌ Callback Hell (Old way)
function getUserOrders_OLD(userId: number, callback: Function) {
  fetchUser(userId, (user: User) => {
    fetchOrders(user.id, (orders: Order[]) => {
      fetchOrderDetails(orders[0].id, (details: any) => {
        callback(details);
        // 😱 Pyramid of doom!
      });
    });
  });
}

// ✅ Modern Async/Await
async function getUserOrders(userId: number): Promise<Order[]> {
  try {
    const user = await fetchUser(userId);
    const orders = await fetchOrders(user.id);
    const detailedOrders = await Promise.all(
      orders.map(order => fetchOrderDetails(order.id))
    );
    return detailedOrders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

// Simulated API calls
async function fetchUser(userId: number): Promise<User> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: userId, name: 'John', email: 'john@example.com' });
    }, 100);
  });
}

async function fetchOrders(userId: number): Promise<Order[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, userId, total: 100 },
        { id: 2, userId, total: 200 }
      ]);
    }, 100);
  });
}

async function fetchOrderDetails(orderId: number): Promise<Order> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: orderId, userId: 1, total: 100 });
    }, 50);
  });
}

// Usage
(async () => {
  const orders = await getUserOrders(123);
  console.log('Orders:', orders);
})();
```

---

### **SCENARIO 3: Parallel Execution with Promise.all**

```typescript
// Sequential execution (SLOW) - 900ms total
async function processOrders_Sequential(orderIds: number[]) {
  const start = Date.now();
  const results = [];
  
  for (const orderId of orderIds) {
    const order = await processOrder(orderId); // Waits for each
    results.push(order);
  }
  
  console.log(`Sequential took: ${Date.now() - start}ms`);
  return results;
}

// Parallel execution (FAST) - 300ms total
async function processOrders_Parallel(orderIds: number[]) {
  const start = Date.now();
  
  // All start at the same time!
  const results = await Promise.all(
    orderIds.map(orderId => processOrder(orderId))
  );
  
  console.log(`Parallel took: ${Date.now() - start}ms`);
  return results;
}

async function processOrder(orderId: number): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Order ${orderId} processed`);
    }, 300); // Each takes 300ms
  });
}

// Demo
(async () => {
  console.log('=== Sequential Execution ===');
  await processOrders_Sequential([1, 2, 3]); // 900ms

  console.log('\n=== Parallel Execution ===');
  await processOrders_Parallel([1, 2, 3]); // 300ms
})();

// Output:
// === Sequential Execution ===
// Sequential took: 903ms
//
// === Parallel Execution ===
// Parallel took: 305ms
```

**When to use what:**
- **Sequential**: When order matters, or each depends on previous
- **Parallel**: Independent operations that can run simultaneously

---

## **3. WEB WORKERS - TRUE MULTITHREADING IN JAVASCRIPT**

### **What are Web Workers?**

Web Workers run JavaScript in background threads, separate from the main thread.

```
Main Thread                 Worker Thread
┌─────────────┐            ┌─────────────┐
│   UI        │            │  Heavy      │
│   Events    │◄──────────►│  Computation│
│   Rendering │  Messages  │  Processing │
└─────────────┘            └─────────────┘
```

---

### **SCENARIO 4: CPU-Intensive Task with Web Workers**

**Problem:** Image processing blocks UI

```typescript
// ❌ Main thread (blocks UI)
// main.ts
function processImage_Blocking(imageData: ImageData): ImageData {
  const data = imageData.data;
  
  // Heavy computation - BLOCKS UI
  for (let i = 0; i < data.length; i += 4) {
    // Apply grayscale filter
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;     // Red
    data[i + 1] = avg; // Green
    data[i + 2] = avg; // Blue
  }
  
  return imageData;
}

// User can't interact with page while this runs! 😞
```

```typescript
// ✅ Web Worker (doesn't block UI)
// worker.ts
self.addEventListener('message', (e: MessageEvent) => {
  const imageData = e.data;
  const data = imageData.data;
  
  // Heavy computation in background thread
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }
  
  // Send result back to main thread
  self.postMessage(imageData);
});

// main.ts
class ImageProcessor {
  private worker: Worker;

  constructor() {
    this.worker = new Worker('worker.js');
    
    this.worker.addEventListener('message', (e: MessageEvent) => {
      const processedImage = e.data;
      console.log('Image processed!', processedImage);
      this.displayImage(processedImage);
    });
  }

  processImage(imageData: ImageData): void {
    console.log('Sending image to worker...');
    this.worker.postMessage(imageData);
    // UI remains responsive! 😊
  }

  displayImage(imageData: ImageData): void {
    // Update canvas with processed image
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
  }

  terminate(): void {
    this.worker.terminate();
  }
}

// Usage
const processor = new ImageProcessor();
const canvas = document.getElementById('sourceCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

processor.processImage(imageData);
// User can still click buttons, scroll, etc!
```

---

### **SCENARIO 5: Real-World - CSV Processing with Workers**

```typescript
// worker.ts - Process large CSV file
interface CSVRow {
  [key: string]: string | number;
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { csvText, chunkSize } = e.data;
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  let processedCount = 0;
  const results: CSVRow[] = [];
  
  // Process in chunks to report progress
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: CSVRow = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    
    // Perform calculations
    if (row.price && row.quantity) {
      row.total = Number(row.price) * Number(row.quantity);
    }
    
    results.push(row);
    processedCount++;
    
    // Report progress every 1000 rows
    if (processedCount % 1000 === 0) {
      self.postMessage({
        type: 'progress',
        processed: processedCount,
        total: lines.length - 1
      });
    }
  }
  
  // Send final results
  self.postMessage({
    type: 'complete',
    results
  });
});

// main.ts
class CSVProcessor {
  private worker: Worker;
  private onProgress?: (percent: number) => void;
  private onComplete?: (results: CSVRow[]) => void;

  constructor() {
    this.worker = new Worker('csv-worker.js');
    
    this.worker.addEventListener('message', (e: MessageEvent) => {
      const { type, processed, total, results } = e.data;
      
      if (type === 'progress') {
        const percent = (processed / total) * 100;
        console.log(`Progress: ${percent.toFixed(2)}%`);
        this.onProgress?.(percent);
      } else if (type === 'complete') {
        console.log('Processing complete!');
        this.onComplete?.(results);
      }
    });
  }

  processFile(file: File): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        
        this.onComplete = resolve;
        this.worker.postMessage({ csvText, chunkSize: 1000 });
      };
      
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  setProgressCallback(callback: (percent: number) => void): void {
    this.onProgress = callback;
  }
}

// Usage in React/Vue component
async function handleFileUpload(file: File) {
  const processor = new CSVProcessor();
  
  processor.setProgressCallback((percent) => {
    updateProgressBar(percent);
  });
  
  const results = await processor.processFile(file);
  console.log('Processed rows:', results.length);
  displayResults(results);
}
```

---

## **4. NODE.JS WORKER THREADS**

### **SCENARIO 6: Heavy Computation in Node.js**

```typescript
// worker.ts
import { parentPort, workerData } from 'worker_threads';

interface ComputeTask {
  start: number;
  end: number;
}

// CPU-intensive: Calculate prime numbers
function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  
  return true;
}

function findPrimes(start: number, end: number): number[] {
  const primes: number[] = [];
  
  for (let i = start; i <= end; i++) {
    if (isPrime(i)) {
      primes.push(i);
    }
  }
  
  return primes;
}

const { start, end } = workerData as ComputeTask;
const primes = findPrimes(start, end);

parentPort?.postMessage({ primes, count: primes.length });

// main.ts
import { Worker } from 'worker_threads';
import * as os from 'os';

class PrimeCalculator {
  private numCPUs: number;

  constructor() {
    this.numCPUs = os.cpus().length;
    console.log(`Available CPUs: ${this.numCPUs}`);
  }

  // Single-threaded (SLOW)
  async calculateSingleThread(max: number): Promise<number[]> {
    const start = Date.now();
    const primes: number[] = [];
    
    for (let i = 2; i <= max; i++) {
      if (this.isPrime(i)) {
        primes.push(i);
      }
    }
    
    const duration = Date.now() - start;
    console.log(`Single-thread: Found ${primes.length} primes in ${duration}ms`);
    
    return primes;
  }

  // Multi-threaded (FAST)
  async calculateMultiThread(max: number): Promise<number[]> {
    const start = Date.now();
    const chunkSize = Math.ceil(max / this.numCPUs);
    const workers: Promise<{ primes: number[]; count: number }>[] = [];
    
    // Create worker for each CPU core
    for (let i = 0; i < this.numCPUs; i++) {
      const chunkStart = i * chunkSize + 2;
      const chunkEnd = Math.min((i + 1) * chunkSize + 1, max);
      
      if (chunkStart <= chunkEnd) {
        workers.push(this.runWorker(chunkStart, chunkEnd));
      }
    }
    
    // Wait for all workers to complete
    const results = await Promise.all(workers);
    
    // Combine results
    const allPrimes = results.flatMap(r => r.primes);
    const duration = Date.now() - start;
    
    console.log(`Multi-thread: Found ${allPrimes.length} primes in ${duration}ms`);
    console.log(`Speedup: ${(duration / this.numCPUs).toFixed(2)}x faster`);
    
    return allPrimes.sort((a, b) => a - b);
  }

  private runWorker(start: number, end: number): Promise<{ primes: number[]; count: number }> {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./worker.js', {
        workerData: { start, end }
      });
      
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  private isPrime(num: number): boolean {
    if (num <= 1) return false;
    if (num <= 3) return true;
    
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    
    return true;
  }
}

// Demo
(async () => {
  const calculator = new PrimeCalculator();
  const max = 100000;
  
  console.log('\n=== Single-threaded ===');
  await calculator.calculateSingleThread(max);
  
  console.log('\n=== Multi-threaded ===');
  await calculator.calculateMultiThread(max);
})();

// Example Output:
// Available CPUs: 8
//
// === Single-threaded ===
// Single-thread: Found 9592 primes in 1847ms
//
// === Multi-threaded ===
// Multi-thread: Found 9592 primes in 267ms
// Speedup: 6.92x faster
```

---

### **SCENARIO 7: Worker Thread Pool**

```typescript
// WorkerPool.ts
import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';

interface Task {
  id: string;
  data: any;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

interface WorkerInfo {
  worker: Worker;
  busy: boolean;
}

class WorkerPool extends EventEmitter {
  private workers: WorkerInfo[] = [];
  private taskQueue: Task[] = [];
  private workerScript: string;

  constructor(workerScript: string, poolSize: number = os.cpus().length) {
    super();
    this.workerScript = workerScript;
    
    // Create worker pool
    for (let i = 0; i < poolSize; i++) {
      this.createWorker();
    }
    
    console.log(`Worker pool created with ${poolSize} workers`);
  }

  private createWorker(): void {
    const worker = new Worker(this.workerScript);
    const workerInfo: WorkerInfo = { worker, busy: false };
    
    worker.on('message', (result) => {
      workerInfo.busy = false;
      this.emit('workerFree', result);
      this.processNextTask();
    });
    
    worker.on('error', (error) => {
      console.error('Worker error:', error);
      workerInfo.busy = false;
      this.processNextTask();
    });
    
    this.workers.push(workerInfo);
  }

  execute<T>(data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: Task = {
        id: Math.random().toString(36),
        data,
        resolve,
        reject
      };
      
      this.taskQueue.push(task);
      this.processNextTask();
    });
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;
    
    // Find free worker
    const freeWorker = this.workers.find(w => !w.busy);
    if (!freeWorker) return; // All workers busy
    
    const task = this.taskQueue.shift()!;
    freeWorker.busy = true;
    
    console.log(`Assigning task ${task.id} to worker`);
    
    freeWorker.worker.postMessage(task.data);
    
    // Setup one-time listener for this task
    const messageHandler = (result: any) => {
      task.resolve(result);
      freeWorker.worker.removeListener('message', messageHandler);
    };
    
    freeWorker.worker.on('message', messageHandler);
  }

  getStatus(): { total: number; busy: number; queued: number } {
    const busy = this.workers.filter(w => w.busy).length;
    return {
      total: this.workers.length,
      busy,
      queued: this.taskQueue.length
    };
  }

  async terminate(): Promise<void> {
    await Promise.all(
      this.workers.map(w => w.worker.terminate())
    );
    console.log('Worker pool terminated');
  }
}

// task-worker.ts
import { parentPort } from 'worker_threads';

parentPort?.on('message', async (task) => {
  // Simulate heavy computation
  const result = await heavyComputation(task);
  parentPort?.postMessage(result);
});

async function heavyComputation(data: any): Promise<any> {
  // Simulate work
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
  return { processed: data, timestamp: Date.now() };
}

// Usage
(async () => {
  const pool = new WorkerPool('./task-worker.js', 4);
  
  // Submit 20 tasks
  const tasks = [];
  for (let i = 0; i < 20; i++) {
    tasks.push(pool.execute({ taskId: i, data: `Task ${i}` }));
    
    // Log status
    if (i % 5 === 0) {
      console.log('Pool status:', pool.getStatus());
    }
  }
  
  const results = await Promise.all(tasks);
  console.log('All tasks completed:', results.length);
  
  await pool.terminate();
})();

// Output:
// Worker pool created with 4 workers
// Pool status: { total: 4, busy: 1, queued: 0 }
// Assigning task xxx to worker
// Assigning task yyy to worker
// ...
// Pool status: { total: 4, busy: 4, queued: 1 }
// All tasks completed: 20
// Worker pool terminated
```

---

## **5. REAL-WORLD PROJECT EXAMPLES**

### **PROJECT 1: Video Transcoding Service**

```typescript
// VideoTranscoder.ts
import { Worker } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';

interface TranscodeJob {
  inputPath: string;
  outputPath: string;
  quality: 'low' | 'medium' | 'high';
}

interface TranscodeProgress {
  jobId: string;
  percent: number;
  status: 'processing' | 'complete' | 'error';
}

class VideoTranscoder {
  private workers: Map<string, Worker> = new Map();
  private maxConcurrent: number = 2; // Limit concurrent transcoding
  private queue: TranscodeJob[] = [];
  private activeJobs: Set<string> = new Set();

  async transcodeVideo(job: TranscodeJob): Promise<string> {
    const jobId = this.generateJobId();
    
    // Check if we can start immediately
    if (this.activeJobs.size < this.maxConcurrent) {
      return this.startTranscoding(jobId, job);
    }
    
    // Queue the job
    return new Promise((resolve, reject) => {
      this.queue.push({ ...job });
      console.log(`Job ${jobId} queued. Queue size: ${this.queue.length}`);
      
      // Wait for worker to become available
      const checkQueue = setInterval(() => {
        if (this.activeJobs.size < this.maxConcurrent) {
          clearInterval(checkQueue);
          const queuedJob = this.queue.shift()!;
          this.startTranscoding(jobId, queuedJob)
            .then(resolve)
            .catch(reject);
        }
      }, 1000);
    });
  }

  private async startTranscoding(
    jobId: string,
    job: TranscodeJob
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`Starting transcoding: ${jobId}`);
      this.activeJobs.add(jobId);
      
      const worker = new Worker('./transcode-worker.js', {
        workerData: { jobId, ...job }
      });
      
      this.workers.set(jobId, worker);
      
      worker.on('message', (msg: TranscodeProgress) => {
        if (msg.status === 'processing') {
          console.log(`Job ${msg.jobId}: ${msg.percent}%`);
        } else if (msg.status === 'complete') {
          console.log(`Job ${msg.jobId}: Complete!`);
          this.cleanup(jobId);
          resolve(job.outputPath);
        }
      });
      
      worker.on('error', (error) => {
        console.error(`Job ${jobId} error:`, error);
        this.cleanup(jobId);
        reject(error);
      });
    });
  }

  private cleanup(jobId: string): void {
    const worker = this.workers.get(jobId);
    if (worker) {
      worker.terminate();
      this.workers.delete(jobId);
    }
    this.activeJobs.delete(jobId);
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStatus() {
    return {
      active: this.activeJobs.size,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Usage - Video upload API endpoint
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });
const transcoder = new VideoTranscoder();

app.post('/upload-video', upload.single('video'), async (req, res) => {
  try {
    const inputPath = req.file!.path;
    const outputPath = `output/${Date.now()}_transcoded.mp4`;
    
    // Start transcoding in background
    transcoder.transcodeVideo({
      inputPath,
      outputPath,
      quality: 'medium'
    }).then(() => {
      console.log('Transcoding complete:', outputPath);
      // Send notification to user
    }).catch((error) => {
      console.error('Transcoding failed:', error);
    });
    
    // Immediately return to user
    res.json({
      message: 'Video uploaded. Transcoding in progress.',
      status: transcoder.getStatus()
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.listen(3000, () => {
  console.log('Video transcoding service running on port 3000');
});
```

---

### **PROJECT 2: Real-Time Analytics Dashboard**

```typescript
// AnalyticsProcessor.ts
import { Worker } from 'worker_threads';
import WebSocket from 'ws';

interface AnalyticsEvent {
  type: 'pageview' | 'click' | 'purchase';
  userId: string;
  timestamp: number;
  data: any;
}

interface Analytics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  uniqueUsers: Set<string>;
  revenue: number;
}

class AnalyticsProcessor {
  private worker: Worker;
  private wss: WebSocket.Server;
  private analytics: Analytics = {
    totalEvents: 0,
    eventsByType: {},
    uniqueUsers: new Set(),
    revenue: 0
  };

  constructor(port: number) {
    // Create WebSocket server for real-time updates
    this.wss = new WebSocket.Server({ port });
    
    // Create worker for heavy processing
    this.worker = new Worker('./analytics-worker.js');
    
    this.worker.on('message', (processedData) => {
      this.updateAnalytics(processedData);
      this.broadcastUpdate();
    });
    
    console.log(`Analytics processor started on port ${port}`);
  }

  processEvent(event: AnalyticsEvent): void {
    // Send to worker for processing
    this.worker.postMessage(event);
    
    // Update basic metrics immediately
    this.analytics.totalEvents++;
    this.analytics.uniqueUsers.add(event.userId);
    
    if (event.type === 'purchase' && event.data.amount) {
      this.analytics.revenue += event.data.amount;
    }
  }

  private updateAnalytics(data: any): void {
    // Update from worker-processed data
    Object.assign(this.analytics, data);
  }

  private broadcastUpdate(): void {
    const data = JSON.stringify({
      totalEvents: this.analytics.totalEvents,
      eventsByType: this.analytics.eventsByType,
      uniqueUsers: this.analytics.uniqueUsers.size,
      revenue: this.analytics.revenue
    });
    
    // Send to all connected clients
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  getAnalytics() {
    return {
      ...this.analytics,
      uniqueUsers: this.analytics.uniqueUsers.size
    };
  }
}

// analytics-worker.ts
import { parentPort } from 'worker_threads';

const eventBuffer: any[] = [];
const BATCH_SIZE = 100;

parentPort?.on('message', (event) => {
  eventBuffer.push(event);
  
  // Process in batches for efficiency
  if (eventBuffer.length >= BATCH_SIZE) {
    const processed = processBatch(eventBuffer.splice(0, BATCH_SIZE));
    parentPort?.postMessage(processed);
  }
});

function processBatch(events: any[]) {
  const eventsByType: Record<string, number> = {};
  
  events.forEach(event => {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
  });
  
  return { eventsByType };
}

// Usage - API endpoint
import express from 'express';

const app = express();
const processor = new AnalyticsProcessor(8080);

app.use(express.json());

// Track event
app.post('/track', (req, res) => {
  const event: AnalyticsEvent = {
    type: req.body.type,
    userId: req.body.userId,
    timestamp: Date.now(),
    data: req.body.data
  };
  
  processor.processEvent(event);
  res.json({ success: true });
});

// Get current analytics
app.get('/analytics', (req, res) => {
  res.json(processor.getAnalytics());
});

app.listen


6. NODE.JS CLUSTERING
What is Clustering?
Clustering creates multiple processes (not threads) to handle incoming requests, utilizing all CPU cores.

text
┌─────────────────────────────────┐
│       Master Process            │
│   (Load Balancer)               │
└──────────┬──────────────────────┘
           │
     ┌─────┴──────┬──────┬──────┐
     │            │      │      │
┌────▼───┐  ┌────▼───┐ ┌▼────┐ ┌▼────┐
│Worker 1│  │Worker 2│ │W 3  │ │W 4  │
│(Port   │  │(Port   │ │Port │ │Port │
│ 3000)  │  │ 3000)  │ │3000)│ │3000)│
└────────┘  └────────┘ └─────┘ └─────┘
  CPU 1       CPU 2     CPU 3   CPU 4
SCENARIO 8: Basic Clustering
typescript
// server-cluster.ts
import cluster from 'cluster';
import * as os from 'os';
import express from 'express';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork(); // Restart dead worker
  });

  // Track worker status
  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

} else {
  // Worker processes
  const app = express();

  app.get('/', (req, res) => {
    res.json({
      message: 'Hello from cluster!',
      workerId: process.pid
    });
  });

  app.get('/heavy', (req, res) => {
    // Simulate CPU-intensive task
    let result = 0;
    for (let i = 0; i < 1e9; i++) {
      result += Math.sqrt(i);
    }
    
    res.json({
      workerId: process.pid,
      result: result
    });
  });

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });
}

// Output:
// Primary process 1234 is running
// Forking 8 workers...
// Worker 1235 is online
// Worker 1236 is online
// Worker 1237 is online
// ...
// Worker 1235 started on port 3000
// Worker 1236 started on port 3000