
# =========================================== var let const ==================================================== #

In JavaScript, `var`, `let`, and `const` are used for variable declaration, but they differ in scope, hoisting, reassignment, and redeclaration. Here's a concise breakdown:
### 1. Scope
- **var**: Function-scoped or global-scoped.
    - Visible within the function (or globally) regardless of block boundaries.
    ```javascript
    function example() {
        if (true) {
            var x = 10; // Accessible outside the block
        }
        console.log(x); // 10 (function-scoped)
    }
    ```
- **let** and **const**: Block-scoped.
    - Confined to the block `{}` where they are declared.
    ```javascript
    if (true) {
        let y = 20;
        const z = 30;
    }
    console.log(y); // Error: y is not defined
    console.log(z); // Error: z is not defined
    ```

### 2. Hoisting
- **var**: Hoisted and initialized with `undefined`.
    - Can be accessed before declaration (returns `undefined`).
    ```javascript
    console.log(a); // undefined (hoisted)
    var a = 5;
    ```
- **let** and **const**: Hoisted but not initialized.
    - Accessing them before declaration causes a `ReferenceError` (Temporal Dead Zone).
    ```javascript
    console.log(b); // Error: Cannot access 'b' before initialization
    let b = 10;
    ```

### 3. Reassignment and Redeclaration
- **var**:
    - Can be reassigned and redeclared in the same scope.
    ```javascript
    var c = 1;
    var c = 2; // Allowed
    c = 3;     // Allowed
    ```
- **let**:
    - Can be reassigned but not redeclared in the same scope.
    ```javascript
    let d = 1;
    d = 2;     // Allowed
    let d = 3; // Error: Identifier 'd' already declared
    ```
- **const**:
    - Cannot be reassigned or redeclared.
    - Exception: Object/array properties can be modified (immutable binding, not value).
    ```javascript
    const e = 1;
    e = 2;     // Error: Assignment to constant variable

    const obj = { prop: 1 };
    obj.prop = 2; // Allowed (mutating properties is okay)
    ```

### 4. Global Scope Behavior
- **var**: Becomes a property of the `window` object in browsers.
    ```javascript
    var globalVar = "hello";
    console.log(window.globalVar); // "hello"
    ```
- **let** and **const**: Not added to the `window` object.
    ```javascript
    let globalLet = "world";
    console.log(window.globalLet); // undefined
    ```

### 5. Use Cases
- **const**: Default choice for variables that shouldn’t be reassigned.
- **let**: Use when reassignment is needed (e.g., loops, counters).
- **var**: Avoid in modern code; legacy use only.

### Summary Table
| Feature       | var                | let                | const              |
|---------------|--------------------|--------------------|--------------------|
| Scope         | Function/Global    | Block              | Block              |
| Hoisting      | Yes (undefined)    | Yes (TDZ error)    | Yes (TDZ error)    |
| Reassignment  | Allowed            | Allowed            | Not allowed        |
| Redeclaration | Allowed            | Not allowed        | Not allowed        |
| Global window | Yes                | No                 | No                 |

### Key Concepts

# =========================================== terms ==================================================== #

#### 1. Declaration
- **Definition**: Creating a variable or function (reserving memory) without assigning a value.
- **Example**:
    ```javascript
    let x; // Variable declaration (uninitialized)
    function greet() {} // Function declaration
    ```

#### 2. Initialization
- **Definition**: Assigning an initial value to a variable during declaration.
- **Example**:
    ```javascript
    let age = 25; // Declaration + initialization
    const PI = 3.14; // Must be initialized
    ```

#### 3. Reassignment
- **Definition**: Changing the value of a variable after it’s declared.
- **Example**:
    ```javascript
    let count = 1;
    count = 2; // Reassignment allowed for `let`

    const MAX = 100;
    MAX = 200; // Error: Reassignment not allowed for `const`
    ```

#### 4. Redeclaration
- **Definition**: Declaring the same variable again in the same scope.
- **Example**:
    ```javascript
    var a = 1;
    var a = 2; // Allowed (no error)

    let b = 3;
    let b = 4; // Error: Identifier 'b' already declared
    ```

#### 5. Parameter
- **Definition**: Variables listed in a function’s definition (placeholders for inputs).
- **Example**:
    ```javascript
    function sum(a, b) { // `a` and `b` are parameters
      return a + b;
    }
    ```

#### 6. Argument
- **Definition**: Actual values passed to a function when it’s called.
- **Example**:
    ```javascript
    sum(2, 3); // `2` and `3` are arguments
    ```

#### 7. Function Declaration
- **Definition**: Defining a function with the function keyword (hoisted).
- **Example**:
    ```javascript
    function greet() { // Hoisted to the top
      console.log("Hello!");
    }
    greet(); // Works even if called before declaration
    ```

#### 8. Function Expression
- **Definition**: Assigning a function to a variable (not hoisted).
- **Example**:
    ```javascript
    const greet = function() { // Not hoisted
      console.log("Hello!");
    };
    greet(); // Must be called after assignment
    ```

#### 9. Define
- **Definition**: A general term for declaring or initializing a variable/function.
- **Example**:
    ```javascript
    const user = { name: "Alice" }; // Define an object
    function sayHi() {} // Define a function
    ```

#### 10. Invoke/Call
- **Definition**: Executing a function using `()`.
- **Example**:
    ```javascript
    function sayHello() {
      console.log("Hi!");
    }
    sayHello(); // Invoke/call the function

    // Using `call()` to set the `this` context:
    const person = { name: "Bob" };
    function greet() {
      console.log(`Hello, ${this.name}!`);
    }
    greet.call(person); // Output: "Hello, Bob!"
    ```

### Key Differences Table

| Term             | Meaning                                               |
|------------------|-------------------------------------------------------|
| Declaration      | Create a variable/function (no value assigned).       |
| Initialization   | Assign an initial value during declaration.           |
| Reassignment     | Change a variable’s value after declaration.          |
| Redeclaration    | Re-declare the same variable in the same scope (var allows it). |
| Parameter        | Placeholder in a function definition (function(a, b)).|
| Argument         | Actual value passed to a function when called (sum(2, 3)). |
| Function Decl.   | Hoisted function defined with function.               |
| Invoke/Call      | Execute a function using `()` or methods like `call()`/`apply()`. |

### Example Combining Terms

```javascript
// Function declaration with parameters
function calculate(a, b) {
  return a * b;
}

// Invoke with arguments
const result = calculate(5, 4); // Arguments: 5 and 4

// Reassignment
let total = 0;
total = 10; // Reassigned

// Redeclaration (var only)
var score = 100;
var score = 200; // Allowed
```
# =========================================== Hoisting ======================================================= #

### Explain Hoisting in JavaScript

Hoisting is the default behavior in JavaScript where all variable and function declarations are moved to the top of their scope before code execution. This means that variables and functions can be used before they are declared.

#### Key Points:
- Only declarations are hoisted, not initializations.
- Hoisting occurs in both local and global scopes.

#### Examples:

**Example 1: Variable Hoisting**
```javascript
hoistedVariable = 3;
console.log(hoistedVariable); // Outputs: 3
var hoistedVariable;
```

**Example 2: Function Hoisting**
```javascript
hoistedFunction(); // Outputs: "Hello world!"

function hoistedFunction() {
    console.log("Hello world!");
}
```

**Example 3: Local Scope Hoisting**
```javascript
function doSomething() {
    x = 33;
    console.log(x); // Outputs: 33
    var x;
}
doSomething();
```

#### Important Notes:
- Variable initializations are not hoisted, only declarations.
    ```javascript
    console.log(x); // Outputs: undefined
    var x = 23;
    ```

- To avoid hoisting issues, use `"use strict";` at the beginning of your code.
    ```javascript
    "use strict";
    x = 23; // Error: x is not defined
    var x;
    ```


#### Declaration vs. Initialization

JavaScript only hoists declarations (e.g., `var x;`), not initializations (e.g., `x = 5;`).

**Example:**
```javascript
console.log(name); // undefined (not an error!)
var name = "Alice";
```
Behind the scenes, JavaScript "rewrites" this as:
```javascript
var name;          // Declaration is hoisted to the top
console.log(name); // undefined
name = "Alice";    // Initialization stays here
```

#### Variables: `var`, `let`, and `const`

- **`var`**: Hoisted and initialized with `undefined`.
    ```javascript
    console.log(age); // undefined (hoisted)
    var age = 25;
    ```

- **`let`/`const`**: Hoisted but not initialized (you’ll get an error if used before declaration).
    ```javascript
    console.log(age); // Error: Cannot access 'age' before initialization
    let age = 25;
    ```

#### Functions

- **Function declarations** are fully hoisted (you can call them before declaring):
    ```javascript
    greet(); // "Hello!" (works!)
    function greet() {
      console.log("Hello!");
    }
    ```

- **Function expressions** (e.g., `const greet = function() {}`) behave like variables:
    ```javascript
    greet(); // Error: greet is not a function (if using `var`, it would be `undefined`)
    var greet = function() { console.log("Hi!"); };
    ```

### Key Points

- Hoisting can lead to unexpected bugs if you don’t declare variables properly.
- Always declare variables at the top of their scope.
- Prefer `let` and `const` over `var` to avoid accidental hoisting issues.

# ==================================================================================================== #

### Is JavaScript a Statically Typed or a Dynamically Typed Language?

JavaScript is a **dynamically typed language**. This means that the type of a variable is checked during run-time, unlike statically typed languages where the type is checked during compile-time.

#### Example:
A variable that is initially assigned a number type can later be reassigned to a string type:
```javascript
var a = 23;          // Initially a number
a = "Hello World!";  // Reassigned to a string
```
# ==================================================================================================== #

### Function Scope vs. Block Scope

#### Function Scope:
- Created when a function is defined.
- Variables declared with `var` are function-scoped.
- Accessible anywhere within the function, regardless of blocks.

```javascript
function showFunctionScope() {
    var counter = 1;
    
    if (true) {
        var counter = 2;   // Same variable, redefined
        console.log(counter);  // Outputs: 2
    }
    
    console.log(counter);  // Outputs: 2
    // 'counter' is accessible throughout the function
}
```

#### Block Scope:
- Created by any code block (if statements, loops, etc.).
- Variables declared with `let` and `const` are block-scoped.
- Only accessible within their declaring block.

```javascript
function showBlockScope() {
    let counter = 1;
    
    if (true) {
        let counter = 2;   // Different variable, new scope
        console.log(counter);  // Outputs: 2
    }
    
    console.log(counter);  // Outputs: 1
    // The 'counter' inside if block is different from outside
}
```

#### Comprehensive Example:
```javascript
function scopeExample() {
    var functionScoped = 'I am function scoped';
    let blockScoped = 'I am block scoped';

    if (true) {
        var anotherFunctionScoped = 'Also function scoped';
        let anotherBlockScoped = 'Block scoped only';
        
        console.log(functionScoped);        // Works
        console.log(blockScoped);           // Works
        console.log(anotherFunctionScoped); // Works
        console.log(anotherBlockScoped);    // Works
    }

    console.log(functionScoped);        // Works
    console.log(blockScoped);           // Works
    console.log(anotherFunctionScoped); // Works
    console.log(anotherBlockScoped);    // ReferenceError - out of scope
}

// None of the variables are accessible here
```

#### Key Differences:
- `var` declarations are hoisted to the top of their function scope.
- `let` and `const` are not hoisted and create a "temporal dead zone".
- `var` can be redeclared in the same scope, `let` and `const` cannot.
- Block scope provides better encapsulation and prevents variable leaks.

#### Example Showing Hoisting:
```javascript
function hoistingExample() {
    console.log(functionScoped);  // undefined (hoisted)
    console.log(blockScoped);     // ReferenceError (temporal dead zone)

    var functionScoped = 'I am function scoped';
    let blockScoped = 'I am block scoped';
}
```

### Lexical Scope

Inner functions can access variables from their outer scope. This is also called "closure". The scope is determined by where the function is defined, not where it's called.

```javascript
function outer() {
    let message = 'Hello';
    
    function inner() {
        let name = 'John';
        console.log(message + ' ' + name); // Can access 'message' from outer scope
    }
    
    inner();
    // console.log(name); // Cannot access 'name' from inner scope
}
```

#### Example of Closure

```javascript
function createCounter() {
    let count = 0;  // This variable is "enclosed" in the returned function
    
    return function() {
        return ++count;
    }
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
```

### Key Points about Scope

- Inner scopes can access outer variables.
- Outer scopes cannot access inner variables.
- Variables with the same name in different scopes don't conflict (shadowing).
- Lexical scope is determined at write time, not run time.
# ==================================================================================================== #

### Understanding `new`, `constructor`, `instanceof`, and `Instances` in JavaScript

#### 1. Instances
An instance is an object created from a class or constructor function.

**Example:**
```javascript
class Car {}
const myCar = new Car(); // myCar is an instance of Car
```

#### 2. `new` Keyword
Creates an instance of a class/constructor function. It does 4 things:
1. Creates a new empty object.
2. Sets the object’s prototype to the constructor’s prototype.
3. Binds `this` to the new object inside the constructor.
4. Returns the new object (unless the constructor returns another object).

**Example:**
```javascript
function Person(name) {
    this.name = name; // 'this' refers to the new instance
}

const alice = new Person("Alice");
console.log(alice.name); // "Alice"
```

**What if you forget `new`?**
`this` refers to the global object (or `undefined` in strict mode), causing bugs:
```javascript
const bob = Person("Bob"); // ❌ No 'new'
console.log(bob); // undefined (global object modified!)
```

#### 3. `constructor` Property
Every function/class has a prototype object with a `constructor` property pointing back to the function itself.

**Example:**
```javascript
class Car {}
console.log(Car.prototype.constructor === Car); // true

const myCar = new Car();
console.log(myCar.constructor === Car); // true (inherited from prototype)
```

**Overriding the constructor (rarely done):**
```javascript
class Car {
    constructor() {
        this.make = "Tesla";
    }
}

// Override (not recommended!)
Car.prototype.constructor = function FakeCar() {}; 

const myCar = new Car();
console.log(myCar.constructor); // FakeCar (confusing!)
```

#### 4. `instanceof` Operator
Checks if an object is an instance of a class/constructor (via prototype chain).

**Example:**
```javascript
class Vehicle {}
class Car extends Vehicle {}

const myCar = new Car();
console.log(myCar instanceof Car); // true
console.log(myCar instanceof Vehicle); // true (inheritance)
console.log(myCar instanceof Object); // true (all objects inherit from Object)
```

**How it works:**
`instanceof` checks if the constructor’s prototype exists in the object’s prototype chain.

#### 5. Key Concepts Summary
| Concept       | Description                                                |
|---------------|------------------------------------------------------------|
| `new`         | Creates an instance and binds `this` to it.                |
| `constructor` | A method in a class (or property on the prototype) that initializes the object. |
| `instanceof`  | Checks if an object was created by a specific constructor (via prototypes). |
| `instance`      | An object created from a class/constructor.                |

#### Examples

**Class with constructor:**
```javascript
class User {
    constructor(name) {
        this.name = name;
    }
}

const user = new User("Alice");
console.log(user instanceof User); // true
```

**Constructor Function:**
```javascript
function Dog(name) {
    this.name = name;
}

const dog = new Dog("Buddy");
console.log(dog.constructor === Dog); // true
console.log(dog instanceof Dog); // true
```

#### Common Pitfalls

**Forgetting `new`:**
```javascript
const obj = MyClass(); // ❌ 'this' is undefined/global
```

**Overwriting `constructor`:**
Modifying `prototype.constructor` can break `instanceof` checks.

**`instanceof` vs. `typeof`:**
`typeof` checks the primitive type, while `instanceof` checks object inheritance.

#### When to Use
- `new`: To create instances from classes/constructor functions.
- `instanceof`: To verify an object’s type in inheritance hierarchies.
- `constructor`: Rarely used directly, but helpful for reflection.

Understanding these concepts is key to mastering object-oriented JavaScript! 🚀

# ============================================================================================================ #
### Important JavaScript Concepts

#### Pure Functions
- Always returns the same output for the same inputs.
- No side effects.
- Doesn't modify external state.

```javascript
// Pure Function
function add(a, b) {
    return a + b;
}

// Impure Function (has side effect)
let total = 0;
function addToTotal(num) {
    total += num;  // Modifies external state
    return total;
}
```

#### Side Effects
Any operation that affects something outside the function:
- Modifying external variables.
- API calls.
- DOM manipulation.
- Console logging.
- File I/O.

```javascript
// Examples of Side Effects
function withSideEffects(arr) {
    arr.push(1);                  // Modifies input array
    localStorage.setItem('key', 'value');  // External API
    document.title = 'New Title'; // DOM modification
    console.log('logging');       // Console output
}
```

#### State Mutation
Modifying existing data structures vs creating new copies.

```javascript
// Mutation (avoid this)
function addItem(arr, item) {
    arr.push(item);
    return arr;
}

// Immutable approach (preferred)
function addItem(arr, item) {
    return [...arr, item]; // Creates new array
}

// Object mutation vs immutable update
const user = { name: 'John' };

// Mutation
user.name = 'Jane';  // Modifies original

// Immutable
const newUser = { ...user, name: 'Jane' }; // Creates new object
```

#### Event Propagation
How events travel through the DOM tree in three phases:

```html
<!-- HTML Structure -->
<div id="outer">
    <div id="inner">
        <button id="button">Click</button>
    </div>
</div>
```

```javascript
// JavaScript
document.addEventListener('click', (e) => {
    // Capturing Phase (top to bottom)
    // Target Phase (element itself)
    // Bubbling Phase (bottom to top)

    // Stop propagation if needed
    e.stopPropagation();
});
```

**Three Phases:**

1. **Capturing Phase (top → bottom):**

```javascript
element.addEventListener('click', handler, true); // Third parameter true for capture

document.getElementById('outer').addEventListener('click', (e) => {
    console.log('Capture: Outer');
}, true);
```

2. **Target Phase:**

```javascript
button.addEventListener('click', (e) => {
    console.log('Target phase');
    e.stopPropagation(); // Stops bubbling
});
```

3. **Bubbling Phase (bottom → top):**

```javascript
// Default behavior (bubbling)
document.getElementById('inner').addEventListener('click', (e) => {
    console.log('Bubble: Inner');
});

// Practical example
document.getElementById('outer').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        console.log('Button clicked!');
    }
});
```

**Event Delegation Example:**

```javascript
// Instead of adding listeners to each button
document.getElementById('menu').addEventListener('click', (e) => {
    if (e.target.matches('.menu-item')) {
        handleMenuClick(e.target);
    }
});
```
# =========================================================================================================== #

## Debouncing and Throttling in JavaScript

Debouncing and throttling are techniques used to optimize performance by controlling the frequency of function execution, especially for events that trigger repeatedly (e.g., scrolling, resizing, typing).

### Debouncing

Delays function execution until a specified period of inactivity. If the event re-triggers within this period, the timer resets.

**Use Cases:** Search bars (wait for typing to stop), window resize handlers.

**Example:**

```javascript
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId); // Reset timer on each call
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Usage: Call `search()` after 300ms of inactivity
const searchInput = document.getElementById("search");
searchInput.addEventListener("input", debounce(search, 300));
```

### Throttling

Limits function execution to once per specified time interval. Ensures the function runs at regular intervals, even if events fire continuously.

**Use Cases:** Scroll handlers, mouse movement tracking.

**Example:**

```javascript
function throttle(func, limit) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
            func.apply(this, args);
            lastCall = now; // Update last call time
        }
    };
}

// Usage: Track scroll position at most every 200ms
window.addEventListener("scroll", throttle(handleScroll, 200));
```

### Key Differences

| Feature      | Debouncing                   | Throttling                   |
|--------------|------------------------------|------------------------------|
| Execution    | After inactivity             | At fixed intervals           |
| Use Case     | Group rapid calls into one   | Limit calls to regular intervals |
| Example      | Search input (wait for pause)| Scroll events (limit frequency) |

### Advanced Implementations

Libraries like Lodash offer enhanced versions:

- **Leading vs. Trailing Edge:**
    - `debounce` can trigger immediately on the first call (leading) or after the delay (trailing).
    - `throttle` can ensure the final call is executed after the delay.

### Summary

- **Debouncing:** "Wait until you’re done."
- **Throttling:** "Take it slow, but keep it steady."

Both techniques reduce unnecessary computations, improving performance in event-heavy applications.

# ============================================================================================================= #

### Implementing Deep Cloning of an Object Without Using Libraries

#### Using JSON Methods (with limitations)
```javascript
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
```
**Limitations:** Doesn't handle functions, `undefined`, `Date` objects, `RegExp`, etc.

#### Custom Recursive Deep Clone Implementation
```javascript
function deepClone(obj) {
    // Handle primitive types and null
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    // Handle Array
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }

    // Handle RegExp
    if (obj instanceof RegExp) {
        return new RegExp(obj);
    }

    // Handle Object
    const clonedObj = {};
    Object.entries(obj).forEach(([key, value]) => {
        clonedObj[key] = deepClone(value);
    });

    return clonedObj;
}
```
**Usage Examples:**
```javascript
const originalObj = {
    string: 'Hello',
    number: 123,
    boolean: true,
    null: null,
    date: new Date(),
    regexp: /foo/,
    array: [1, 2, 3],
    nested: {
        a: 1,
        b: {
            c: 2
        }
    },
    func: function() { return 'Hello'; }
};

const clonedObj = deepClone(originalObj);

console.log(clonedObj !== originalObj);           // true
console.log(clonedObj.nested !== originalObj.nested); // true
console.log(clonedObj.array !== originalObj.array);   // true

clonedObj.nested.b.c = 5;
console.log(originalObj.nested.b.c);  // Still 2
console.log(clonedObj.nested.b.c);    // 5
```

#### Handling Circular References
```javascript
function deepCloneWithCircular(obj, hash = new WeakMap()) {
    // Handle primitive types and null
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Check for circular references
    if (hash.has(obj)) {
        return hash.get(obj);
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    // Handle RegExp
    if (obj instanceof RegExp) {
        return new RegExp(obj);
    }

    // Handle Array
    if (Array.isArray(obj)) {
        const cloneArr = [];
        hash.set(obj, cloneArr);
        obj.forEach((item, index) => {
            cloneArr[index] = deepCloneWithCircular(item, hash);
        });
        return cloneArr;
    }

    // Handle Object
    const cloneObj = {};
    hash.set(obj, cloneObj);
    Object.entries(obj).forEach(([key, value]) => {
        cloneObj[key] = deepCloneWithCircular(value, hash);
    });

    return cloneObj;
}

// Test with circular reference
const circularObj = {
    a: 1,
    b: {
        c: 2
    }
};
circularObj.circular = circularObj;
const clonedCircular = deepCloneWithCircular(circularObj);
```

### Key Points About These Implementations
- The JSON method is fastest but limited.
- The recursive method handles most cases but not circular references.
- The WeakMap version handles circular references but is more complex.
- All versions preserve the object's structure and nested relationships.

### Difference Between Deep Clone and Shallow Clone

#### Shallow Clone
- Creates a new object but keeps references to nested objects.
- Only clones the first level.
- Nested objects still point to original memory locations.

**Shallow Clone Methods:**
```javascript
// 1. Object.assign()
const original = { 
    name: 'John',
    details: { age: 30 }
};
const shallowClone1 = Object.assign({}, original);

// 2. Spread operator
const shallowClone2 = { ...original };

// 3. Array.slice() for arrays
const arr = [1, { x: 1 }];
const shallowArrClone = arr.slice();
```
**Demonstration of Shallow Clone:**
```javascript
original.details.age = 31;
console.log(shallowClone1.details.age); // 31 - reference is shared
```

#### Deep Clone
- Creates a completely independent copy.
- Clones all nested objects recursively.
- No shared references with the original object.

**Deep Clone Methods:**
```javascript
// Custom recursive function
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    // Handle objects
    const cloned = {};
    Object.keys(obj).forEach(key => {
        cloned[key] = deepClone(obj[key]);
    });
    
    return cloned;
}
```
**Demonstration:**
```javascript
const original = {
    name: 'John',
    details: { 
        age: 30,
        address: {
            city: 'New York'
        }
    },
    hobbies: ['reading', { sport: 'tennis' }]
};

// Shallow Clone
const shallow = { ...original };
original.details.age = 31;
original.hobbies[1].sport = 'football';

console.log(shallow.details.age);        // 31 (changed)
console.log(shallow.hobbies[1].sport);   // 'football' (changed)

// Deep Clone
const deep = deepClone(original);
original.details.age = 32;
original.hobbies[1].sport = 'basketball';

console.log(deep.details.age);           // 31 (unchanged)
console.log(deep.hobbies[1].sport);      // 'football' (unchanged)
```

**Visual Representation:**
```javascript
// Original Object
const user = {
    id: 1,
    info: { name: 'John' }
};

// Memory representation for Shallow Clone:
// user1 → { id: 1, info: → { name: 'John' } }
// user2 → { id: 1, info: ↗ }  // Points to same info object

// Memory representation for Deep Clone:
// user1 → { id: 1, info: → { name: 'John' } }
// user2 → { id: 1, info: → { name: 'John' } }  // Independent copy
```
# ============================================================================================================= #

In JavaScript, collections and generators are powerful features for managing data and controlling iteration. Let’s break them down with examples and use cases:

## 1. Collections
Collections are data structures used to store groups of values. JavaScript has several types:

### a. Arrays
The most common ordered collection.
```javascript
const arr = [1, 2, 3];
```

### b. Objects
Key-value pairs (keys are strings or Symbols).
```javascript
const obj = { name: "Alice", age: 30 };
```

### c. Set
Stores unique values of any type.
```javascript
const set = new Set();
set.add(1).add(2).add(1); // Set { 1, 2 }
```

### d. Map
Key-value pairs with any type as keys (objects, functions, etc.).
```javascript
const map = new Map();
map.set("key1", "value1");
map.set({ id: 1 }, "value2");
```

### e. WeakSet and WeakMap
- **WeakSet**: Stores objects only (weakly held; avoids memory leaks).
- **WeakMap**: Keys are objects only (values can be any type).
```javascript
const weakMap = new WeakMap();
const keyObj = {};
weakMap.set(keyObj, "private data");
```

### Key Differences
| Collection | Unique Keys? | Key Types       | Iterable? | Weak References? |
|------------|---------------|-----------------|-----------|------------------|
| Array      | No            | Index (number)  | Yes       | No               |
| Object     | Yes           | String/Symbol   | No        | No               |
| Set        | Yes           | Any (values)    | Yes       | No               |
| Map        | Yes           | Any (keys)      | Yes       | No               |
| WeakSet    | Yes           | Objects (values)| No        | Yes              |
| WeakMap    | Yes           | Objects (keys)  | No        | Yes              |

## 2. Generators
Generators are functions that can be paused and resumed, producing a sequence of values lazily. They use `function*` and `yield`.

### Basic Generator
```javascript
function* numberGenerator() {
    yield 1;
    yield 2;
    yield 3;
}

const gen = numberGenerator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2
```

### Use Cases
- **Lazy Evaluation**: Generate values on demand (e.g., infinite sequences).
    ```javascript
    function* infiniteNumbers() {
        let i = 0;
        while (true) yield i++;
    }
    ```

- **Async Iteration**: Simplify async code (before async/await).
    ```javascript
    function* fetchData() {
        const data = yield fetch("https://api.example.com");
        console.log(data);
    }
    ```

- **Stateful Iteration**: Maintain state between iterations.
    ```javascript
    function* idGenerator() {
        let id = 1;
        while (true) yield id++;
    }
    const userId = idGenerator();
    console.log(userId.next().value); // 1
    ```

### Generator Methods
- `next()`: Resume execution and return the next value.
- `return()`: Terminate the generator.
- `throw()`: Throw an error into the generator.

## 3. Combining Collections and Generators
Generators work seamlessly with collections via iterators (e.g., `for...of` loops).

### Iterate a Map with a Generator
```javascript
function* iterateMap(map) {
    for (const [key, value] of map) {
        yield { key, value };
    }
}

const myMap = new Map([[1, "a"], [2, "b"]]);
const mapGen = iterateMap(myMap);
console.log(mapGen.next().value); // { key: 1, value: "a" }
```

### Convert a Set to an Array via Generator
```javascript
function* setToArray(set) {
    for (const item of set) yield item;
}

const mySet = new Set([1, 2, 3]);
const arr = [...setToArray(mySet)]; // [1, 2, 3]
```

## Key Takeaways
- Collections like Set, Map, WeakSet, and WeakMap optimize data storage and access.
- Generators provide fine-grained control over iteration and memory efficiency.
- Use Set/Map for uniqueness or structured key-value pairs.
- Use generators for lazy evaluation, async flows, or custom iteration logic.
- Combine them to build efficient, scalable data processing pipelines! 🚀

# ============================================================================================================= #

What is the DOM?
The Document Object Model (DOM) is a programming interface for web documents. It represents the structure of a web page as a tree of objects, where each object corresponds to a part of the page (e.g., elements, attributes, text). This allows programming languages like JavaScript to dynamically interact with and modify the content, structure, and style of a webpage.

Key Concepts:
Tree Structure: The DOM is organized hierarchically, with the document as the root node. Elements like <html>, <body>, <div>, and <p> are nodes in this tree.

Example:

Copy
document (root)
└── html
    ├── head
    │   └── title
    └── body
        ├── h1
        └── div
Dynamic Updates: Changes to the DOM (e.g., adding/removing elements) are immediately reflected in the browser.

Access and Manipulation: JavaScript uses the DOM API to select elements, modify properties, or handle events (e.g., clicks).