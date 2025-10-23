# Node.js Advanced Performance & Deep Dive MCQs

## Section 1: Event Loop & Async Operations (10 Questions)

### Q1: Event Loop Phase Ordering with Mixed Async Operations

```javascript
const fs = require('fs');

console.log('1: Start');

setTimeout(() => console.log('2: setTimeout 0ms'), 0);

setImmediate(() => console.log('3: setImmediate'));

fs.readFile(__filename, () => {
  console.log('4: readFile callback');
  
  setTimeout(() => console.log('5: setTimeout in I/O'), 0);
  setImmediate(() => console.log('6: setImmediate in I/O'));
  process.nextTick(() => console.log('7: nextTick in I/O'));
});

Promise.resolve().then(() => console.log('8: Promise'));

process.nextTick(() => console.log('9: nextTick'));

console.log('10: End');
```

**What is the guaranteed output order for the first 4 logs?**

A) 1, 10, 9, 8  
B) 1, 9, 10, 8  
C) 1, 10, 8, 9  
D) 1, 9, 8, 10

**Answer: A) 1, 10, 9, 8**

**Explanation:**
- **1, 10**: Synchronous code executes first in order
- **9**: `process.nextTick()` callbacks execute after current operation completes but before event loop continues (nextTick queue)
- **8**: Promise callbacks are microtasks, executed after nextTick queue but before event loop phases
- **2 vs 3**: Order depends on system timing for the first iteration
- **4, 7, 6, 5**: After I/O callback (poll phase), nextTick runs first, then check phase (setImmediate), then timers phase

**Key Concept:** Queue priority: Synchronous → nextTick queue → Microtasks (Promises) → Event Loop Phases (timers → poll → check → close)

---

### Q2: Event Loop Starvation

```javascript
const express = require('express');
const app = express();

app.get('/block', (req, res) => {
  const start = Date.now();
  while (Date.now() - start < 5000) {
    // Blocking operation
  }
  res.send('Done');
});

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(3000);
```

**If a client hits `/block`, what happens to subsequent requests to `/health`?**

A) They are queued and respond immediately after `/block` completes  
B) They fail with ETIMEDOUT  
C) They are handled in parallel  
D) They are blocked for 5 seconds

**Answer: D) They are blocked for 5 seconds**

**Explanation:**
Node.js is single-threaded. The `while` loop blocks the event loop completely, preventing it from processing any other requests, including `/health`. All incoming requests queue up and wait.

**Solutions:**
```javascript
// Solution 1: Break work into chunks
app.get('/block', (req, res) => {
  let iterations = 0;
  const maxIterations = 1000000;
  
  function doWork() {
    const batchSize = 10000;
    for (let i = 0; i < batchSize && iterations < maxIterations; i++) {
      // work here
      iterations++;
    }
    
    if (iterations < maxIterations) {
      setImmediate(doWork); // Let event loop process other events
    } else {
      res.send('Done');
    }
  }
  
  doWork();
});

// Solution 2: Worker threads
const { Worker } = require('worker_threads');

app.get('/block', (req, res) => {
  const worker = new Worker('./heavy-work.js');
  worker.on('message', (result) => {
    res.send(result);
  });
});
```

---

### Q3: nextTick vs setImmediate Recursion

```javascript
let count = 0;

function recursiveNextTick() {
  if (count < 1000) {
    count++;
    process.nextTick(recursiveNextTick);
  }
}

function recursiveImmediate() {
  if (count < 1000) {
    count++;
    setImmediate(recursiveImmediate);
  }
}
```

**What's the critical difference in behavior?**

A) Both behave identically  
B) `nextTick` will block the event loop, `setImmediate` won't  
C) `setImmediate` is faster  
D) `nextTick` is more memory efficient

**Answer: B) `nextTick` will block the event loop, `setImmediate` won't**

**Explanation:**
- **`process.nextTick()`**: Recursion runs the entire nextTick queue before moving to the event loop. 1000 iterations run immediately, blocking I/O operations.
- **`setImmediate()`**: Each callback runs in the check phase, allowing the event loop to process other phases (I/O, timers) between iterations.

**Production Impact:**
```javascript
// BAD - Event loop starvation
function processQueue() {
  const item = queue.shift();
  if (item) {
    process.nextTick(processQueue); // Blocks everything!
  }
}

// GOOD - Allows I/O processing
function processQueue() {
  const item = queue.shift();
  if (item) {
    setImmediate(processQueue); // Event loop stays responsive
  }
}
```

---

### Q4: Async Hooks and Performance

```javascript
const async_hooks = require('async_hooks');
const fs = require('fs');

const hook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    fs.writeFileSync('log.txt', `${type}: ${asyncId}\n`, { flag: 'a' });
  }
});

hook.enable();

const express = require('express');
const app = express();

app.get('/test', async (req, res) => {
  const data = await fs.promises.readFile('data.json');
  res.json(JSON.parse(data));
});

app.listen(3000);
```

**What's the critical problem with this code?**

A) `fs.writeFileSync` is slow  
B) Infinite recursion - writeFileSync triggers init hook  
C) Memory leak in async_hooks  
D) Race condition in file writes

**Answer: B) Infinite recursion - writeFileSync triggers init hook**

**Explanation:**
The `fs.writeFileSync()` inside the `init` hook creates a new async resource, which triggers the `init` hook again, creating infinite recursion. The process will crash.

**Correct Implementation:**
```javascript
const hook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    // Use process.stdout or store in memory
    process.stdout.write(`${type}: ${asyncId}\n`);
    // Or check if we're already in a hook
    if (!this.inHook) {
      this.inHook = true;
      fs.writeFileSync('log.txt', `${type}: ${asyncId}\n`, { flag: 'a' });
      this.inHook = false;
    }
  }
});
```

---

### Q5: Promise vs Callback in Event Loop

```javascript
const fs = require('fs');

// Version A
fs.readFile('file.txt', (err, data) => {
  console.log('A');
});

// Version B  
fs.promises.readFile('file.txt').then(data => {
  console.log('B');
});

process.nextTick(() => console.log('C'));
```

**Which executes first?**

A) A always executes before B  
B) B always executes before A  
C) C executes before both A and B  
D) The order of A and B is unpredictable

**Answer: C) C executes before both A and B**

**Explanation:**
- **C**: `process.nextTick()` runs before any I/O callbacks
- **A vs B**: Both file reads happen in the same poll phase. The order between callback and promise versions depends on internal implementation but both happen after C
- Practically, they're in the same event loop phase, so timing is similar

**Key Insight:** Don't mix callbacks and promises unnecessarily:
```javascript
// Consistent - use promises
const data1 = await fs.promises.readFile('file1.txt');
const data2 = await fs.promises.readFile('file2.txt');

// Or promisify callbacks
const util = require('util');
const readFile = util.promisify(fs.readFile);
```

---

### Q6: setTimeout vs setImmediate Context

```javascript
// Context 1: Main module
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

// Context 2: Inside I/O callback
const fs = require('fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout-io'), 0);
  setImmediate(() => console.log('immediate-io'));
});
```

**Which statements are true?**

A) In Context 1, order is guaranteed: immediate → timeout  
B) In Context 1, order is unpredictable  
C) In Context 2, order is guaranteed: immediate-io → timeout-io  
D) Both B and C

**Answer: D) Both B and C**

**Explanation:**
- **Context 1 (Main)**: Order depends on system performance. If event loop starts quickly, setTimeout runs first (timer phase before check phase). If it starts slower, setImmediate runs first.
- **Context 2 (I/O callback)**: Guaranteed order. We're already in poll phase, so check phase (setImmediate) comes before next timer phase (setTimeout).

**Production Pattern:**
```javascript
// If you need guaranteed immediate execution after I/O
fs.readFile('file.txt', (err, data) => {
  setImmediate(() => {
    // This ALWAYS runs before setTimeout(0)
    processData(data);
  });
});
```

---

### Q7: Event Loop with Streams

```javascript
const fs = require('fs');
const stream = fs.createReadStream('large-file.txt', { highWaterMark: 16 });

let chunks = 0;

stream.on('data', (chunk) => {
  chunks++;
  console.log('Data event:', chunks);
});

stream.on('end', () => {
  console.log('End event, total chunks:', chunks);
});

console.log('Stream created');
```

**When do the 'data' events fire relative to "Stream created"?**

A) Immediately after "Stream created"  
B) In the same tick after "Stream created"  
C) In the next tick after "Stream created"  
D) Unpredictable timing

**Answer: C) In the next tick after "Stream created"**

**Explanation:**
Streams defer their start to the next tick to allow you to attach all event listeners before data flows. This happens via `process.nextTick()` internally.

**Proof:**
```javascript
const stream = fs.createReadStream('file.txt');

console.log('1: Created');

stream.on('data', () => console.log('3: Data'));

console.log('2: Listener attached');

// Output: 1 → 2 → 3
```

This is why you can attach listeners after creation without missing events:
```javascript
const stream = createStream();
// Safe to do other work here
stream.on('data', handler); // Won't miss any data
```

---

### Q8: Multiple Process.nextTick in Same Tick

```javascript
process.nextTick(() => {
  console.log('A');
  process.nextTick(() => console.log('B'));
});

process.nextTick(() => {
  console.log('C');
  process.nextTick(() => console.log('D'));
});

Promise.resolve().then(() => console.log('E'));
```

**What's the output order?**

A) A, C, E, B, D  
B) A, B, C, D, E  
C) A, C, B, D, E  
D) E, A, B, C, D

**Answer: C) A, C, B, D, E**

**Explanation:**
1. **A, C**: First-level nextTick callbacks execute in order
2. **B, D**: nextTick callbacks added during nextTick execution are appended to the same queue
3. **E**: Only after nextTick queue is completely empty do microtasks (Promises) run

**Complete Queue Processing:**
```
Start: nextTick queue = [A-callback, C-callback], microtask queue = [E]
Execute A → queue = [C-callback, B-callback], microtask = [E]
Execute C → queue = [B-callback, D-callback], microtask = [E]
Execute B → queue = [D-callback], microtask = [E]
Execute D → queue = [], microtask = [E]
Execute E → done
```

---

### Q9: Async/Await and Event Loop

```javascript
async function test() {
  console.log('1');
  
  await Promise.resolve();
  console.log('2');
  
  await Promise.resolve();
  console.log('3');
}

test();
console.log('4');
```

**What's the output?**

A) 1, 4, 2, 3  
B) 1, 2, 3, 4  
C) 1, 2, 4, 3  
D) 4, 1, 2, 3

**Answer: A) 1, 4, 2, 3**

**Explanation:**
- **1**: Synchronous, executes immediately
- **await** suspends function, returns control to caller
- **4**: Continues main execution
- **2**: Microtask queue processes, first await resolves
- **3**: Second await resolves in next microtask

**Each `await` creates a microtask:**
```javascript
// This code:
async function test() {
  console.log('1');
  await Promise.resolve();
  console.log('2');
}

// Roughly equals:
function test() {
  console.log('1');
  Promise.resolve().then(() => {
    console.log('2');
  });
}
```

---

### Q10: Event Loop with Timers and I/O

```javascript
const fs = require('fs');

setTimeout(() => console.log('Timer 1'), 0);

fs.readFile(__filename, () => {
  console.log('I/O 1');
  setTimeout(() => console.log('Timer 2'), 0);
});

setTimeout(() => console.log('Timer 3'), 0);

fs.readFile(__filename, () => {
  console.log('I/O 2');
});
```

**Which execution order is possible?**

A) Timer 1 → Timer 3 → I/O 1 → I/O 2 → Timer 2  
B) I/O 1 → Timer 1 → Timer 3 → I/O 2 → Timer 2  
C) Timer 1 → Timer 3 → I/O 2 → I/O 1 → Timer 2  
D) All of the above

**Answer: A) Timer 1 → Timer 3 → I/O 1 → I/O 2 → Timer 2**

**Explanation:**
Event loop phases:
1. **Timers phase**: Timer 1 and Timer 3 execute (registered in same tick)
2. **Poll phase**: I/O callbacks execute in registration order (I/O 1, then I/O 2)
3. **Timers phase (next iteration)**: Timer 2 executes

**Key Point:** Timers registered in the same tick execute in that tick's timer phase. Timers registered during I/O callbacks wait for the next event loop iteration.

---

## Section 2: Filesystem Operations (10 Questions)

### Q11: Atomic Write Operations

```javascript
const fs = require('fs').promises;
const express = require('express');
const app = express();

app.post('/update-config', async (req, res) => {
  await fs.writeFile('config.json', JSON.stringify(req.body));
  res.json({ success: true });
});
```

**What happens if the server crashes during writeFile?**

A) The file remains unchanged  
B) The file is partially written (corrupted)  
C) An error is thrown  
D) The operation is automatically retried

**Answer: B) The file is partially written (corrupted)**

**Explanation:**
`fs.writeFile()` is not atomic. On crash, the file may contain partial data. This is critical for configuration files.

**Atomic Write Pattern:**
```javascript
const fs = require('fs').promises;
const path = require('path');

async function atomicWrite(filePath, data) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  
  try {
    // Write to temp file
    await fs.writeFile(tempPath, data);
    
    // Atomic rename (POSIX systems)
    await fs.rename(tempPath, filePath);
  } catch (err) {
    // Cleanup temp file
    try {
      await fs.unlink(tempPath);
    } catch (e) {}
    throw err;
  }
}

app.post('/update-config', async (req, res) => {
  try {
    await atomicWrite('config.json', JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### Q12: File Descriptor Leaks

```javascript
const fs = require('fs');
const express = require('express');
const app = express();

app.get('/read/:file', (req, res) => {
  const fd = fs.openSync(`data/${req.params.file}`, 'r');
  const buffer = Buffer.alloc(1024);
  const bytesRead = fs.readSync(fd, buffer, 0, 1024, 0);
  
  res.send(buffer.slice(0, bytesRead));
});

app.listen(3000);
```

**What's wrong with this code?**

A) Buffer is too small  
B) File descriptor leak  
C) Synchronous operation blocks event loop  
D) Both B and C

**Answer: D) Both B and C**

**Explanation:**
- **File descriptor leak**: `fs.closeSync(fd)` is never called. Each request leaks one fd. Eventually hits OS limit (usually 1024) and crashes with EMFILE error.
- **Blocking**: Synchronous fs operations block the event loop.

**Correct Implementation:**
```javascript
const fs = require('fs').promises;

app.get('/read/:file', async (req, res) => {
  let fileHandle;
  try {
    fileHandle = await fs.open(`data/${req.params.file}`, 'r');
    const buffer = Buffer.alloc(1024);
    const { bytesRead } = await fileHandle.read(buffer, 0, 1024, 0);
    res.send(buffer.slice(0, bytesRead));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    // Critical: Always close
    if (fileHandle) {
      await fileHandle.close();
    }
  }
});

// Or use the simpler readFile for small files
app.get('/read/:file', async (req, res) => {
  try {
    const data = await fs.readFile(`data/${req.params.file}`);
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### Q13: Watch File Performance

```javascript
const fs = require('fs');
const express = require('express');
const app = express();

app.get('/watch/:file', (req, res) => {
  const watcher = fs.watch(`data/${req.params.file}`, (eventType) => {
    res.write(`Event: ${eventType}\n`);
  });
  
  req.on('close', () => {
    watcher.close();
  });
});

app.listen(3000);
```

**What happens if multiple clients watch the same file?**

A) They share the same watcher  
B) Each client creates a separate watcher  
C) An error is thrown  
D) Only the first client receives events

**Answer: B) Each client creates a separate watcher**

**Explanation:**
Each `fs.watch()` creates a separate OS-level watch. With 1000 clients watching the same file, you have 1000 watchers—massive resource waste.

**Optimized Pattern:**
```javascript
const EventEmitter = require('events');

class FileWatchManager extends EventEmitter {
  constructor() {
    super();
    this.watchers = new Map();
    this.listeners = new Map();
  }
  
  watch(filePath) {
    if (!this.watchers.has(filePath)) {
      const watcher = fs.watch(filePath, (eventType) => {
        this.emit(`change:${filePath}`, eventType);
      });
      
      this.watchers.set(filePath, watcher);
      this.listeners.set(filePath, 0);
    }
    
    const count = this.listeners.get(filePath);
    this.listeners.set(filePath, count + 1);
    
    return filePath;
  }
  
  unwatch(filePath) {
    const count = this.listeners.get(filePath) - 1;
    this.listeners.set(filePath, count);
    
    if (count === 0) {
      const watcher = this.watchers.get(filePath);
      watcher.close();
      this.watchers.delete(filePath);
      this.listeners.delete(filePath);
    }
  }
}

const watchManager = new FileWatchManager();

app.get('/watch/:file', (req, res) => {
  const filePath = `data/${req.params.file}`;
  watchManager.watch(filePath);
  
  const handler = (eventType) => {
    res.write(`Event: ${eventType}\n`);
  };
  
  watchManager.on(`change:${filePath}`, handler);
  
  req.on('close', () => {
    watchManager.off(`change:${filePath}`, handler);
    watchManager.unwatch(filePath);
  });
});
```

---

### Q14: Directory Traversal Security

```javascript
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const app = express();

app.get('/files/:filename', async (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  const data = await fs.readFile(filePath);
  res.send(data);
});
```

**What security vulnerability exists?**

A) No authentication  
B) Path traversal attack  
C) Race condition  
D) Memory leak

**Answer: B) Path traversal attack**

**Explanation:**
An attacker can use `../../etc/passwd` as filename to read any file on the system.

**Attack:**
```bash
curl http://localhost:3000/files/..%2F..%2Fetc%2Fpasswd
# Reads /etc/passwd
```

**Secure Implementation:**
```javascript
const fs = require('fs').promises;
const path = require('path');

app.get('/files/:filename', async (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const filePath = path.join(uploadsDir, req.params.filename);
  
  // Critical: Verify path is within uploads directory
  const realPath = await fs.realpath(filePath).catch(() => null);
  
  if (!realPath || !realPath.startsWith(uploadsDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const data = await fs.readFile(realPath);
    res.send(data);
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Additional: Whitelist allowed characters
function isValidFilename(filename) {
  return /^[a-zA-Z0-9_.-]+$/.test(filename);
}

app.get('/files/:filename', async (req, res) => {
  if (!isValidFilename(req.params.filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  // ... rest of code
});
```

---

### Q15: Concurrent File Reads

```javascript
const fs = require('fs').promises;
const express = require('express');
const app = express();

let cache = null;

app.get('/data', async (req, res) => {
  if (!cache) {
    cache = await fs.readFile('large-data.json', 'utf8');
  }
  res.json(JSON.parse(cache));
});
```

**What happens with concurrent requests before cache is populated?**

A) One request reads, others wait  
B) All requests read the file simultaneously  
C) An error is thrown  
D) The cache becomes corrupted

**Answer: B) All requests read the file simultaneously**

**Explanation:**
Multiple requests check `!cache` before any completes. All trigger `fs.readFile()` simultaneously, wasting resources.

**Correct Caching with Lock:**
```javascript
let cache = null;
let cachePromise = null;

app.get('/data', async (req, res) => {
  if (!cache) {
    if (!cachePromise) {
      // Only one request initiates the read
      cachePromise = fs.readFile('large-data.json', 'utf8')
        .then(data => {
          cache = data;
          cachePromise = null;
          return data;
        })
        .catch(err => {
          cachePromise = null;
          throw err;
        });
    }
    // Other requests wait for the same promise
    await cachePromise;
  }
  
  res.json(JSON.parse(cache));
});

// Or use a proper caching library
const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 600 });

app.get('/data', async (req, res) => {
  let data = myCache.get('data');
  
  if (!data) {
    data = await fs.readFile('large-data.json', 'utf8');
    myCache.set('data', data);
  }
  
  res.json(JSON.parse(data));
});
```

---

### Q16: File Stats Caching

```javascript
const fs = require('fs').promises;

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function processFiles(files) {
  const results = [];
  
  for (const file of files) {
    if (await fileExists(file)) {
      const data = await fs.readFile(file);
      results.push(data);
    }
  }
  
  return results;
}
```

**What's inefficient about this code?**

A) Sequential processing  
B) Two filesystem operations per file  
C) No error handling  
D) All of the above

**Answer: D) All of the above**

**Explanation:**
- **Sequential**: Processes files one by one
- **Double I/O**: Checks existence, then reads (two syscalls)
- **No error handling**: `readFile` can still fail

**Optimized Version:**
```javascript
async function processFiles(files) {
  // Parallel processing
  const promises = files.map(async (file) => {
    try {
      // Single I/O operation
      return await fs.readFile(file);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw err; // Other errors
    }
  });
  
  const results = await Promise.all(promises);
  return results.filter(data => data !== null);
}

// Even better: Use Promise.allSettled for partial failures
async function processFilesRobust(files) {
  const promises = files.map(file => fs.readFile(file));
  const results = await Promise.allSettled(promises);
  
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}
```

---

### Q17: Temp File Cleanup

```javascript
const fs = require('fs').promises;
const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();

app.post('/process', upload.single('file'), async (req, res) => {
  const data = await fs.readFile(req.file.path, 'utf8');
  const processed = data.toUpperCase();
  
  res.send(processed);
});
```

**What's wrong with this implementation?**

A) Temp files are never deleted  
B) Race condition in file reading  
C) No error handling  
D) Both A and C

**Answer: D) Both A and C**

**Explanation:**
Multer stores uploaded files in `uploads/` but this code never deletes them. Disk fills up over time.

**Correct Implementation:**
```javascript
app.post('/process', upload.single('file'), async (req, res) => {
  try {
    const data = await fs.readFile(req.file.path, 'utf8');
    const processed = data.toUpperCase();
    res.send(processed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    // Always cleanup temp file
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.error('Failed to delete temp file:', err);
    }
  }
});

// Better: Use middleware for automatic cleanup
app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.file) {
      fs.unlink(req.file.path).catch(console.error);
    }
  });
  next();
});
```

---

### Q18: Symbolic Link Handling

```javascript
const fs = require('fs').promises;
const path = require('path');

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
```

**What happens if src contains symbolic links?**

A) They're copied as regular files  
B) They're followed and content is copied  
C) An error is thrown  
D) They're ignored

**Answer: B) They're followed and content is copied**

**Explanation:**
`entry.isDirectory()` and `fs.copyFile()` follow symlinks by default. This can cause:
1. Copying huge directories unexpectedly
2. Infinite loops if symlink points to parent
3. Security issues (copying system files)

----
### Q19: File Locking for Database-like Operations

```javascript
javascriptconst fs = require('fs').promises;
const express = require('express');
const app = express();

let transactionLog = [];

app.post('/transaction', async (req, res) => {
  transactionLog.push(req.body);
  
  await fs.writeFile('transactions.json', JSON.stringify(transactionLog));
  
  res.json({ success: true, id: transactionLog.length - 1 });
});
What happens under high concurrent load?
A) Transactions are processed sequentially
B) Some transactions may be lost
C) File becomes corrupted
D) Both B and C
Answer: D) Both B and C
Explanation:
Multiple concurrent requests read transactionLog, add their transaction, and write to file. Race conditions cause:

Lost transactions (overwritten by concurrent writes)
Corrupted JSON (interleaved writes)

Correct Implementation with Locking:
javascriptconst fs = require('fs').promises;
const lockfile = require('proper-lockfile');

class TransactionManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.cache = null;
  }
  
  async addTransaction(transaction) {
    const release = await lockfile.lock(this.filePath, {
      retries: {
        retries: 5,
        minTimeout: 100
      }
    });
    
    try {
      // Read current state
      let transactions = [];
      try {
        const data = await fs.readFile(this.filePath, 'utf8');
        transactions = JSON.parse(data);
      } catch (err) {
        // File doesn't exist yet
      }
      
      // Add new transaction
      transactions.push({
        ...transaction,
        timestamp: Date.now()
      });
      
      // Write atomically
      const tempPath = `${this.filePath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(transactions, null, 2));
      await fs.rename(tempPath, this.filePath);
      
      return transactions.length - 1;
    } finally {
      await release();
    }
  }
}

const txManager = new TransactionManager('transactions.json');

app.post('/transaction', async (req, res) => {
  try {
    const id = await txManager.addTransaction(req.body);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```
-----------
### Q20: Large File Memory Management

```javascript
javascriptconst fs = require('fs').promises;
const express = require('express');
const app = express();

app.get('/download/:file', async (req, res) => {
  const data = await fs.readFile(`files/${req.params.file}`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(data);
});
What happens when downloading a 2GB file?
A) Works fine
B) Out of memory error
C) Process crashes
D) Both B and C
Answer: D) Both B and C
Explanation:
fs.readFile() loads entire file into memory. For large files:

Exceeds V8's memory limit (default ~2GB for 64-bit)
Multiple concurrent downloads multiply the problem
Process crashes with FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed

Correct Implementation with Streams:
javascriptconst fs = require('fs');
const path = require('path');

app.get('/download/:file', async (req, res) => {
  const filePath = path.join('files', req.params.file);
  
  try {
    // Get file stats for Content-Length
    const stats = await fs.promises.stat(filePath);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.file}"`);
    
    // Stream the file
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', (err) => {
      if (!res.headersSent) {
        res.status(404).json({ error: 'File not found' });
      }
    });
    
    stream.pipe(res);
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
});

// For even better performance: range requests (partial downloads)
app.get('/download/:file', async (req, res) => {
  const filePath = path.join('files', req.params.file);
  const stats = await fs.promises.stat(filePath);
  const range = req.headers.range;
  
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
    const chunkSize = end - start + 1;
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stats.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'application/octet-stream',
    });
    
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

----------