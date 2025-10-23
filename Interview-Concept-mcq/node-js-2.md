
# 🔹 Node.js MCQs (File System, Streams, EventEmitter, I/O)

---

### **File System (fs)**

**Q1.** Which method is used to read a file asynchronously in Node.js?
a) `fs.readFile()`
b) `fs.readFileSync()`
c) `fs.openFile()`
d) `fs.getFile()`

✅ **Answer: a**
📘 Example:

```js
const fs = require('fs');
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

---

**Q2.** What is the difference between `fs.writeFile()` and `fs.appendFile()`?
a) Both overwrite the file.
b) `writeFile` overwrites, `appendFile` adds to existing content.
c) Both append data.
d) Both delete existing content first.

✅ **Answer: b**
📘 Example:

```js
fs.writeFile('test.txt', 'Hello', ()=>{});  // overwrites
fs.appendFile('test.txt', ' World', ()=>{}); // appends
```

---

**Q3.** What will `fs.existsSync()` return if a file doesn’t exist?
a) `null`
b) `false`
c) `undefined`
d) Error

✅ **Answer: b**

---

---

### **Streams**

**Q4.** In Node.js streams, which type is **not** correct?
a) Readable
b) Writable
c) Duplex
d) Static

✅ **Answer: d**
📘 Types: **Readable**, **Writable**, **Duplex** (both), **Transform** (modify data).

---

**Q5.** Which method is used to read data from a readable stream?
a) `read()`
b) `on('data')`
c) `pipe()`
d) All of the above

✅ **Answer: d**
📘 Example:

```js
const fs = require('fs');
const readStream = fs.createReadStream('file.txt');
readStream.on('data', chunk => console.log(chunk.toString())); // Method 1
readStream.pipe(process.stdout); // Method 2
```

---

**Q6.** What happens if you don’t handle the `'error'` event in a stream?
a) Stream continues normally.
b) Node.js throws an unhandled exception and may crash.
c) Error is ignored.
d) Nothing happens.

✅ **Answer: b**

---

---

### **EventEmitter**

**Q7.** Which module provides `EventEmitter` in Node.js?
a) `fs`
b) `events`
c) `stream`
d) `util`

✅ **Answer: b**
📘 Example:

```js
const EventEmitter = require('events');
const emitter = new EventEmitter();

emitter.on('greet', name => console.log(`Hello ${name}`));
emitter.emit('greet', 'Rashid');
```

---

**Q8.** Which method removes all listeners for an event in EventEmitter?
a) `removeAllListeners(event)`
b) `clearListeners(event)`
c) `off(event)`
d) `deleteListeners(event)`

✅ **Answer: a**

---

**Q9.** If you add more than 10 listeners to the same event, what happens by default?
a) Node.js throws an error.
b) Node.js shows a memory leak warning.
c) Only 10 listeners work.
d) Node.js ignores new listeners.

✅ **Answer: b**
📘 Limit can be changed:

```js
emitter.setMaxListeners(20);
```

---

---

### **Input / Output**

**Q10.** Which of the following is used to read input from console in Node.js?
a) `process.stdin`
b) `console.read()`
c) `fs.readFileSync()`
d) `readline.read()`

✅ **Answer: a**
📘 Example:

```js
process.stdin.on('data', (input) => {
  console.log(`You typed: ${input.toString()}`);
});
```

---

**Q11.** What does `process.stdout.write()` do?
a) Writes to a file
b) Writes to console without newline
c) Writes to buffer only
d) Logs an object

✅ **Answer: b**
📘 Example:

```js
process.stdout.write("Hello "); 
process.stdout.write("World");  // Output: Hello World (same line)
```

---

**Q12.** What is the correct way to create an interface for input/output in Node.js?
a) Using `fs.createInterface()`
b) Using `console.createInterface()`
c) Using `readline.createInterface()`
d) Using `process.createInterface()`

✅ **Answer: c**
📘 Example:

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.question('Enter your name: ', (name) => {
  console.log(`Hello, ${name}`);
  rl.close();
});
```

---

--- -------------------------------------------------------------------------------

🔥 **Quick Revision Points**

* **fs**: `readFile` (async), `readFileSync` (sync), `writeFile`, `appendFile`.
* **Streams**: Efficient for large data (Readable, Writable, Duplex, Transform).
* **EventEmitter**: Core of Node.js async events.
* **I/O**: `process.stdin`, `process.stdout`, `readline` for user input.

--- ---------------------------------------------------------------------------------

## **1. Pass as Command Line Arguments (process.argv)**

`process.argv` gives an array of arguments passed to the script.

```js
// file: app.js
const args = process.argv.slice(2); // remove 'node' and file path
// args are strings → convert to numbers
const numbers = args.map(Number);

// Example: double each number
const doubled = numbers.map(n => n * 2);

console.log("Input:", numbers);
console.log("Doubled:", doubled);
```

### Run in terminal:

```bash
node app.js 1 2 3 4 5
```

✅ Output:

```
Input: [1, 2, 3, 4, 5]
Doubled: [2, 4, 6, 8, 10]
```

---

## **2. Pass JSON Array as Argument**

Sometimes you want to pass a whole array directly.

```js
// file: app.js
const arr = JSON.parse(process.argv[2]);

const squared = arr.map(x => x * x);
console.log("Squared Array:", squared);
```

### Run in terminal:

```bash
node app.js "[1,2,3,4]"
```

✅ Output:

```
Squared Array: [1, 4, 9, 16]
```

---

## **3. Input from Console (process.stdin)**

If you don’t want to pass as arguments, take input while running:

```js
// file: app.js
process.stdin.on("data", (data) => {
  const arr = JSON.parse(data.toString().trim());
  const result = arr.filter(n => n % 2 === 0); // keep even numbers
  console.log("Even numbers:", result);
  process.exit();
});
```

### Run in terminal:

```bash
node app.js
```

(Then type/paste and press Enter)

```
[10, 15, 20, 25, 30]
```

✅ Output:

```
Even numbers: [10, 20, 30]
```

--- -------------------------------------------------------------------------------------------

⚡ So, you can use:

* `process.argv` → for passing inline arguments
* `stdin` → for interactive input
* Wrap array in quotes and `JSON.parse` when passing as a single argument

--- ----------------------------------------------------------------------------------------------

