#### Section 4: Child Process (10 Questions)
### Q31: child_process.exec vs spawn
```javascript 
javascriptconst { exec, spawn } = require('child_process');

// Version A
function processFileExec(filename) {
  exec(`cat ${filename} | grep error`, (err, stdout) => {
    console.log(stdout);
  });
}

// Version B
function processFileSpawn(filename) {
  const cat = spawn('cat', [filename]);
  const grep = spawn('grep', ['error']);
  
  cat.stdout.pipe(grep.stdin);
  grep.stdout.on('data', (data) => {
    console.log(data.toString());
  });
}
Which is safer and why?
A) Both are equally safe
B) exec is safer - simpler code
C) spawn is safer - prevents command injection
D) exec is safer - better error handling
Answer: C) spawn is safer - prevents command injection
Explanation:
exec uses shell interpretation, making it vulnerable to injection:
javascript// Vulnerable!
const filename = "file.txt; rm -rf /";
exec(`cat ${filename}`); // Executes: cat file.txt; rm -rf /

// Safe
const filename = "file.txt; rm -rf /";
const cat = spawn('cat', [filename]); // Treats as literal filename
Key Differences:
javascriptconst { exec, execFile, spawn } = require('child_process');

// exec: Shell interpretation, buffer output
exec('ls -la', (err, stdout, stderr) => {
  // Pros: Simple for shell commands
  // Cons: Command injection, maxBuffer limit (1MB default)
});

// execFile: No shell, buffer output
execFile('ls', ['-la'], (err, stdout, stderr) => {
  // Pros: Safe from injection
  // Cons: Still has maxBuffer limit
});

// spawn: No shell, stream output
const ls = spawn('ls', ['-la']);
ls.stdout.on('data', (data) => {
  // Pros: Streams (no buffer limit), safe from injection
  // Cons: More verbose
});

// Safe exec with sanitization
const { promisify } = require('util');
const execPromise = promisify(exec);

async function safeExec(filename) {
  // Whitelist validation
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }
  
  const { stdout } = await execPromise(`cat ${filename}`);
  return stdout;
}

```

### Q32: Child Process Memory Limits

```javascript 
javascriptconst { spawn } = require('child_process');
const express = require('express');
const app = express();

app.get('/process/:file', (req, res) => {
  const child = spawn('node', ['process-file.js', req.params.file]);
  
  let output = '';
  
  child.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  child.on('close', (code) => {
    res.send(output);
  });
});

app.listen(3000);
What happens if many concurrent requests spawn child processes?
A) Requests are queued automatically
B) System may run out of memory/processes
C) Child processes share memory efficiently
D) Node.js limits concurrent spawns
Answer: B) System may run out of memory/processes
Explanation:
Each spawn() creates a new OS process. Unlimited concurrent requests can:

Exhaust system process limit (ulimit)
Consume all available memory
Crash the server

Solution: Process Pool Pattern:
javascriptconst { spawn } = require('child_process');
const Queue = require('better-queue');

class ProcessPool {
  constructor(maxConcurrent = 5) {
    this.queue = new Queue(this.processTask.bind(this), {
      concurrent: maxConcurrent,
      maxRetries: 2
    });
  }
  
  async processTask(task, callback) {
    const child = spawn('node', ['process-file.js', task.file], {
      timeout: 30000, // Kill after 30s
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer limit
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      
      // Prevent memory overflow
      if (output.length > 10 * 1024 * 1024) {
        child.kill();
        callback(new Error('Output too large'));
      }
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        callback(new Error(`Process exited with code ${code}: ${errorOutput}`));
      } else {
        callback(null, output);
      }
    });
    
    child.on('error', (err) => {
      callback(err);
    });
  }
  
  process(file) {
    return new Promise((resolve, reject) => {
      this.queue.push({ file }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

const pool = new ProcessPool(5); // Max 5 concurrent processes

app.get('/process/:file', async (req, res) => {
  try {
    const output = await pool.process(req.params.file);
    res.send(output);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


```
## Q33: Child Process Zombie Processes

```javascript 
javascriptconst { spawn } = require('child_process');

setInterval(() => {
  const child = spawn('sleep', ['5']);
  
  // Forgot to handle 'close' or 'exit' events
  console.log('Started child:', child.pid);
}, 1000);
What happens after running this for several minutes?
A) Old processes are cleaned up automatically
B) Zombie processes accumulate
C) Memory leak but no zombie processes
D) Nothing, child processes are garbage collected
Answer: B) Zombie processes accumulate
Explanation:
Without listening to 'exit' or 'close' events, child processes become zombies - they've finished but their process table entries remain because the parent hasn't acknowledged their termination.
Check zombie processes:
bashps aux | grep defunct
# or
ps aux | grep Z
Correct Implementation:
javascriptconst { spawn } = require('child_process');

setInterval(() => {
  const child = spawn('sleep', ['5']);
  
  // Critical: Always handle exit/close
  child.on('exit', (code, signal) => {
    console.log(`Child ${child.pid} exited with code ${code}`);
  });
  
  // Or use 'close' which fires after stdio streams close
  child.on('close', (code, signal) => {
    console.log(`Child ${child.pid} closed`);
  });
  
  // Handle errors
  child.on('error', (err) => {
    console.error('Failed to start child:', err);
  });
  
  console.log('Started child:', child.pid);
}, 1000);

// Better: Track and cleanup all children on exit
const children = new Set();

function spawnChild(command, args) {
  const child = spawn(command, args);
  children.add(child);
  
  child.on('close', () => {
    children.delete(child);
  });
  
  return child;
}

process.on('exit', () => {
  children.forEach(child => {
    child.kill('SIGTERM');
  });
});

process.on('SIGTERM', () => {
  children.forEach(child => {
    child.kill('SIGTERM');
  });
  process.exit(0);
});


```


### Q34: Child Process IPC Performance

```javascript 
javascriptconst { fork } = require('child_process');

// parent.js
const child = fork('child.js');

for (let i = 0; i < 100000; i++) {
  child.send({ id: i, data: 'x'.repeat(1000) });
}

// child.js
process.on('message', (msg) => {
  // Process message
  const result = msg.data.toUpperCase();
  process.send({ id: msg.id, result });
});
What performance issue exists?
A) Messages may be lost
B) IPC channel buffer overflow
C) No backpressure handling
D) Both B and C
Answer: D) Both B and C
Explanation:
Sending 100,000 messages instantly:

Fills IPC buffer (typically 1MB)
Causes backpressure but code ignores it
May drop messages or cause the process to hang

Correct Implementation with Backpressure:
javascript// parent.js
const { fork } = require('child_process');
const child = fork('child.js');

let pendingMessages = 0;
const MAX_PENDING = 100;

function sendMessage(msg) {
  return new Promise((resolve) => {
    function attemptSend() {
      pendingMessages++;
      
      const sent = child.send(msg, (err) => {
        pendingMessages--;
        if (err) {
          console.error('Send error:', err);
        }
        resolve();
      });
      
      if (!sent && pendingMessages >= MAX_PENDING) {
        // IPC channel is full, wait before retrying
        setTimeout(attemptSend, 10);
      }
    }
    
    attemptSend();
  });
}

async function sendBatch() {
  for (let i = 0; i < 100000; i++) {
    await sendMessage({ id: i, data: 'x'.repeat(1000) });
    
    // Optional: batch messages to reduce overhead
    if (i % 100 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}

sendBatch();

// Better: Batch messages
const BATCH_SIZE = 100;
const messages = [];

for (let i = 0; i < 100000; i++) {
  messages.push({ id: i, data: 'x'.repeat(1000) });
  
  if (messages.length >= BATCH_SIZE) {
    child.send({ batch: messages });
    messages.length = 0;
  }
}

if (messages.length > 0) {
  child.send({ batch: messages });
}

// child.js
process.on('message', (msg) => {
  if (msg.batch) {
    const results = msg.batch.map(item => ({
      id: item.id,
      result: item.data.toUpperCase()
    }));
    process.send({ batch: results });
  }
});


```

### Q35: Child Process Timeout and Kill

```javascript 
javascriptconst { spawn } = require('child_process');

function runCommand(command, args, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      resolve(output);
    });
    
    setTimeout(() => {
      child.kill();
      reject(new Error('Timeout'));
    }, timeout);
  });
}
What's wrong with this timeout implementation?
A) Nothing, it works correctly
B) Race condition between 'close' and timeout
C) SIGKILL might be needed if SIGTERM doesn't work
D) Both B and C
Answer: D) Both B and C
Explanation:

If process finishes just as timeout fires, both resolve() and reject() may be called
kill() sends SIGTERM by default, which can be ignored by the child process

Correct Implementation:
javascriptfunction runCommand(command, args, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    
    let output = '';
    let finished = false;
    let timeoutId;
    let killTimeoutId;
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      if (!finished) {
        finished = true;
        clearTimeout(timeoutId);
        clearTimeout(killTimeoutId);
        
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      }
    });
    
    child.on('error', (err) => {
      if (!finished) {
        finished = true;
        clearTimeout(timeoutId);
        clearTimeout(killTimeoutId);
        reject(err);
      }
    });
    
    // Graceful termination attempt
    timeoutId = setTimeout(() => {
      if (!finished) {
        console.log('Sending SIGTERM to', child.pid);
        child.kill('SIGTERM');
        
        // Force kill if SIGTERM doesn't work
        killTimeoutId = setTimeout(() => {
          if (!finished) {
            console.log('Sending SIGKILL to', child.pid);
            child.kill('SIGKILL');
            finished = true;
            reject(new Error('Process killed after timeout'));
          }
        }, 2000);
      }
    }, timeout);
  });
}

// Even better: Use AbortController (Node.js 15+)
const { spawn } = require('child_process');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

async function runCommandWithAbort(command, args, timeout = 5000) {
  const controller = new AbortController();
  const { signal } = controller;
  
  const child = spawn(command, args, { signal });
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  let output = '';
  
  for await (const data of child.stdout) {
    output += data.toString();
  }
  
  clearTimeout(timeoutId);
  return output;
}


```


### Q36: Child Process Detached Mode

```javascript 
javascriptconst { spawn } = require('child_process');
const express = require('express');
const app = express();

app.post('/start-job', (req, res) => {
  const child = spawn('node', ['long-job.js'], {
    detached: true,
    stdio: 'ignore'
  });
  
  child.unref();
  
  res.json({ jobId: child.pid });
});

app.listen(3000);
What's the purpose of detached: true and unref()?
A) Child runs faster
B) Child survives parent process exit
C) Child uses less memory
D) Child has elevated privileges
Answer: B) Child survives parent process exit
Explanation:

detached: true: Creates a new process group, allowing the child to continue after parent exits
unref(): Allows parent to exit without waiting for child
stdio: 'ignore': Prevents parent from holding child's stdio

Use Cases:
javascript// Use Case 1: Background jobs that outlive the server
app.post('/start-backup', (req, res) => {
  const child = spawn('node', ['backup.js'], {
    detached: true,
    stdio: 'ignore'
  });
  
  child.unref();
  
  res.json({ message: 'Backup started', pid: child.pid });
});

// Use Case 2: Daemon processes
function startDaemon() {
  const child = spawn('node', ['daemon.js'], {
    detached: true,
    stdio: ['ignore', 
            fs.openSync('daemon.log', 'a'),
            fs.openSync('daemon-error.log', 'a')]
  });
  
  child.unref();
  
  // Save PID for later management
  fs.writeFileSync('daemon.pid', child.pid.toString());
}

// Use Case 3: Non-detached (normal) - parent waits for child
app.post('/process-file', async (req, res) => {
  const child = spawn('node', ['process.js']);
  // detached: false (default), child tied to parent
  
  let output = '';
  child.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  child.on('close', (code) => {
    res.send(output);
  });
  
  // If server crashes, this child is killed automatically
});


```

### Q37: Child Process Environment Variables

```javascript 
javascriptconst { spawn } = require('child_process');

function runScript(apiKey) {
  const child = spawn('node', ['script.js'], {
    env: { API_KEY: apiKey }
  });
  
  return child;
}
What security issue exists?
A) No security issue
B) API key visible in process list
C) API key logged to console
D) Inherits parent environment including secrets
Answer: B) API key visible in process list
Explanation:
Command-line arguments and environment variables are visible in ps aux or process monitoring tools.
Secure Approaches:
javascript// Approach 1: Pass via stdin (most secure)
const { spawn } = require('child_process');

function runScript(apiKey) {
  const child = spawn('node', ['script.js'], {
    stdio: ['pipe', 'inherit', 'inherit']
  });
  
  // Send API key via stdin
  child.stdin.write(JSON.stringify({ API_KEY: apiKey }));
  child.stdin.end();
  
  return child;
}

// script.js
let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  const config = JSON.parse(input);
  const apiKey = config.API_KEY;
  // Use apiKey
});

// Approach 2: Temp config file with restricted permissions
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

async function runScriptSecure(apiKey) {
  const configPath = path.join('/tmp', `config-${crypto.randomBytes(16).toString('hex')}.json`);
  
  // Write config with restricted permissions
  await fs.writeFile(configPath, JSON.stringify({ API_KEY: apiKey }), {
    mode: 0o600 // Only owner can read/write
  });
  
  const child = spawn('node', ['script.js', configPath]);
  
  // Cleanup after child exits
  child.on('close', async () => {
    await fs.unlink(configPath).catch(console.error);
  });
  
  return child;
}

// Approach 3: Inherit parent env but exclude sensitive vars
function runScript(apiKey) {
  const env = { ...process.env };
  delete env.DATABASE_PASSWORD; // Remove sensitive vars
  env.API_KEY = apiKey;
  
  const child = spawn('node', ['script.js'], { env });
  return child;
}
```

### Q38: Child Process stdio Pipes

```javascript 
javascriptconst { spawn } = require('child_process');

const child1 = spawn('find', ['/var/log', '-name', '*.log']);
const child2 = spawn('grep', ['error']);
const child3 = spawn('wc', ['-l']);

child1.stdout.pipe(child2.stdin);
child2.stdout.pipe(child3.stdin);

child3.stdout.on('data', (data) => {
  console.log(`Error count: ${data}`);
});
What happens if child1 produces output faster than child2 can consume?
A) Data is lost
B) child1 is automatically paused (backpressure)
C) Buffer overflow crashes the process
D) child1 continues but child2 lags
Answer: B) child1 is automatically paused (backpressure)
Explanation:
Streams handle backpressure automatically. When child2.stdin buffer is full, it signals child1.stdout to pause until the buffer drains.
However, errors need manual handling:
javascriptconst { spawn } = require('child_process');
const { pipeline } = require('stream');

const child1 = spawn('find', ['/var/log', '-name', '*.log']);
const child2 = spawn('grep', ['error']);
const child3 = spawn('wc', ['-l']);

// Better: Use pipeline for automatic error propagation
pipeline(
  child1.stdout,
  child2.stdin,
  (err) => {
    if (err) {
      console.error('Pipeline 1-2 error:', err);
      child1.kill();
      child2.kill();
    }
  }
);

pipeline(
  child2.stdout,
  child3.stdin,
  (err) => {
    if (err) {
      console.error('Pipeline 2-3 error:', err);
      child2.kill();
      child3.kill();
    }
  }
);

let output = '';
child3.stdout.on('data', (data) => {
  output += data.toString();
});

child3.on('close', (code) => {
  if (code === 0) {
    console.log(`Error count: ${output.trim()}`);
  } else {
    console.error('Command failed');
  }
});

// Handle individual process errors
[child1, child2, child3].forEach((child, index) => {
  child.on('error', (err) => {
    console.error(`Child ${index + 1} error:`, err);
  });
  
  child.stderr.on('data', (data) => {
    console.error(`Child ${index + 1} stderr:`, data.toString());
  });
});


```

### Q39: Child Process Working Directory

```javascript 
javascriptconst { spawn } = require('child_process');
const express = require('express');
const app = express();

app.post('/run-script', (req, res) => {
  const projectPath = req.body.projectPath;
  
  const child = spawn('npm', ['install'], {
    cwd: projectPath
  });
  
  child.on('close', (code) => {
    res.json({ success: code === 0 });
  });
});
What security vulnerability exists?
A) Command injection
B) Path traversal
C) Environment pollution
D) No vulnerability
Answer: B) Path traversal
Explanation:
User can provide any path (e.g., /etc, /), potentially causing npm to run in sensitive directories or accessing files outside intended scope.
Secure Implementation:
javascriptconst { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

const ALLOWED_BASE = path.join(__dirname, 'projects');

async function isPathSafe(userPath) {
  try {
    // Resolve to absolute path
    const absolutePath = path.resolve(ALLOWED_BASE, userPath);
    
    // Check if it's within allowed directory
    if (!absolutePath.startsWith(ALLOWED_BASE)) {
      return false;
    }
    
    // Verify it exists and is a directory
    const stats = await fs.stat(absolutePath);
    if (!stats.isDirectory()) {
      return false;
    }
    
    // Verify it contains package.json
    await fs.access(path.join(absolutePath, 'package.json'));
    
    return absolutePath;
  } catch (err) {
    return false;
  }
}

app.post('/run-script', async (req, res) => {
  const safePath = await isPathSafe(req.body.projectPath);
  
  if (!safePath) {
    return res.status(400).json({ error: 'Invalid project path' });
  }
  
  const child = spawn('npm', ['install'], {
    cwd: safePath,
    timeout: 300000, // 5 minute timeout
    env: {
      ...process.env,
      NODE_ENV: 'production',
      // Remove sensitive env vars
      DATABASE_PASSWORD: undefined,
      API_SECRET: undefined
    }
  });
  
  let output = '';
  child.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  child.stderr.on('data', (data) => {
    output += data.toString();
  });
  
  child.on('close', (code) => {
    res.json({ 
      success: code === 0,
      output: output.slice(0, 10000) // Limit output size
    });
  });
  
  child.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});

```


### Q40: Child Process Resource Cleanup

```javascript 
javascriptconst { fork } = require('child_process');

class WorkerPool {
  constructor(scriptPath, poolSize = 4) {
    this.workers = [];
    this.scriptPath = scriptPath;
    
    for (let i = 0; i < poolSize; i++) {
      this.workers.push(fork(scriptPath));
    }
  }
  
  getWorker() {
    return this.workers[Math.floor(Math.random() * this.workers.length)];
  }
  
  async execute(task) {
    const worker = this.getWorker();
    
    return new Promise((resolve, reject) => {
      worker.send(task);
      
      worker.once('message', (result) => {
        resolve(result);
      });
    });
  }
}

const pool = new WorkerPool('./worker.js', 4);
What happens when the application shuts down?
A) Workers are automatically cleaned up
B) Workers become zombie processes
C) Workers keep running as detached processes
D) Workers exit gracefully
Answer: B) Workers become zombie processes
Explanation:
Without explicit cleanup, forked child processes aren't terminated when the parent exits, potentially becoming zombies or orphaned processes.
Correct Implementation:
javascriptconst { fork } = require('child_process');
const EventEmitter = require('events');

class WorkerPool extends EventEmitter {
  constructor(scriptPath, poolSize = 4) {
    super();
    this.workers = [];
    this.scriptPath = scriptPath;
    this.shuttingDown = false;
    
    for (let i = 0; i < poolSize; i++) {
      this.createWorker();
    }
    
    // Register cleanup handlers
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
    process.on('exit', () => this.forceShutdown());
  }
  
  createWorker() {
    const worker = fork(this.scriptPath);
    
    worker.on('exit', (code, signal) => {
      console.log(`Worker ${worker.pid} exited with code ${code}`);
      
      // Remove from pool
      const index = this.workers.indexOf(worker);
      if (index !== -1) {
        this.workers.splice(index, 1);
      }
      
      // Replace worker if not shutting down
      if (!this.shuttingDown && code !== 0) {
        console.log('Replacing crashed worker');
        setTimeout(() => this.createWorker(), 1000);
      }
    });
    
    worker.on('error', (err) => {
      console.error(`Worker ${worker.pid} error:`, err);
    });
    
    this.workers.push(worker);
    this.emit('worker-created', worker.pid);
  }
  
  getWorker() {
    if (this.workers.length === 0) {
      throw new Error('No workers available');
    }
    return this.workers[Math.floor(Math.random() * this.workers.length)];
  }
  
  async execute(task, timeout = 30000) {
    const worker = this.getWorker();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Task timeout'));
      }, timeout);
      
      const messageHandler = (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      };
      
      const errorHandler = (err) => {
        clearTimeout(timeoutId);
        reject(err);
      };
      
      worker.once('message', messageHandler);
      worker.once('error', errorHandler);
      
      worker.send(task);
    });
  }
  
  async shutdown() {
    if (this.shuttingDown) return;
    
    console.log('Shutting down worker pool gracefully...');
    this.shuttingDown = true;
    
    const shutdownPromises = this.workers.map(worker => {
      return new Promise((resolve) => {
        worker.send({ type: 'shutdown' });
        
        const timeout = setTimeout(() => {
          console.log(`Force killing worker ${worker.pid}`);
          worker.kill('SIGKILL');
          resolve();
        }, 5000);
        
        worker.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    });
    
    await Promise.all(shutdownPromises);
    console.log('All workers shut down');
    process.exit(0);
  }
  
  forceShutdown() {
    console.log('Force shutting down workers...');
    this.workers.forEach(worker => {
      try {
        worker.kill('SIGKILL');
      } catch (err) {
        // Worker might already be dead
      }
    });
  }
}

// worker.js
process.on('message', (task) => {
  if (task.type === 'shutdown') {
    console.log('Worker received shutdown signal');
    // Clean up resources
    process.exit(0);
  }
  
  // Process task
  const result = processTask(task);
  process.send(result);
});

// Usage
const pool = new WorkerPool('./worker.js', 4);

app.post('/task', async (req, res) => {
  try {
    const result = await pool.execute(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

```