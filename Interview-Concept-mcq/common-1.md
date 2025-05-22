## HTTP Content Types

## HTTP Content Types

The `Content-Type` HTTP header specifies the media type of the resource being sent in an HTTP request or response. Below is a categorized list of common content types:

### 1. Text-Based Content Types
- **`text/plain`**: Plain text
- **`text/html`**: HTML documents
- **`text/css`**: CSS stylesheets
- **`text/javascript`**: JavaScript files

### 2. Application-Based Content Types
- **`application/json`**: JSON data
- **`application/xml`**: XML data
- **`application/pdf`**: PDF files
- **`application/octet-stream`**: Binary data (generic)
- **`application/x-www-form-urlencoded`**: Form data in URL-encoded format

### 3. Multipart Content Types
- **`multipart/form-data`**: Used for file uploads in forms
- **`multipart/alternative`**: Multiple versions of content (e.g., HTML and plain text emails)

### 4. Image Content Types
- **`image/jpeg`**: JPEG images
- **`image/png`**: PNG images
- **`image/gif`**: GIF images
- **`image/svg+xml`**: SVG images

### 5. Audio and Video Content Types
#### Audio:
- **`audio/mpeg`**: MP3 audio
- **`audio/wav`**: WAV audio

#### Video:
- **`video/mp4`**: MP4 video
- **`video/webm`**: WebM video

### 6. Other Content Types
- **`application/zip`**: ZIP files
- **`application/gzip`**: GZIP compressed files

---------------------------------------------------------------------------------------------

## Object-Oriented Programming (OOP)

Object-Oriented Programming (OOP) is a programming paradigm based on the concept of objects, which are instances of classes. It organizes code in a modular, reusable, and scalable way by grouping related properties (attributes) and behaviors (methods) into objects.

### Key Concepts of OOP

#### 1. Class
A class is a blueprint for creating objects.

```javascript
class Car {
    constructor(brand, model) {
        this.brand = brand;
        this.model = model;
    }

    displayInfo() {
        console.log(`Car: ${this.brand} ${this.model}`);
    }
}
```

#### 2. Object
An object is an instance of a class.

```javascript
const myCar = new Car("Toyota", "Camry");
myCar.displayInfo(); // Output: Car: Toyota Camry
```

#### 3. Encapsulation
Encapsulation restricts direct access to certain object properties.

```javascript
class Person {
    constructor(name, age) {
        this.name = name;
        let _age = age; // Private variable

        this.getAge = function() {
            return _age;
        };
    }
}
const john = new Person("John", 30);
console.log(john.getAge()); // Output: 30
```

#### 4. Inheritance
Inheritance allows one class to inherit properties and methods from another.

```javascript
class ElectricCar extends Car {
    constructor(brand, model, batteryLife) {
        super(brand, model);
        this.batteryLife = batteryLife;
    }
}
const tesla = new ElectricCar("Tesla", "Model S", "400 miles");
console.log(tesla);
```

#### 5. Polymorphism
Polymorphism allows a child class to override a parent class's method.

```javascript
class Animal {
    speak() {
        console.log("Animal makes a sound");
    }
}

class Dog extends Animal {
    speak() {
        console.log("Dog barks");
    }
}
const pet = new Dog();
pet.speak(); // Output: Dog barks
```

#### 6. Abstraction
Abstraction hides complex implementation details and exposes only the necessary parts.

##### Example 1: Basic Abstraction
```javascript
class Car {
    constructor(brand, model) {
        this.brand = brand;
        this.model = model;
    }

    startEngine() {
        console.log("Engine started!");
    }

    drive() {
        this.startEngine(); // Internal method (implementation hidden)
        console.log(`Driving the ${this.brand} ${this.model}`);
    }
}

const myCar = new Car("Toyota", "Corolla");
myCar.drive(); 
// Output: 
// Engine started!
// Driving the Toyota Corolla
```

##### Example 2: Using Private Fields (ES6+)
```javascript
class BankAccount {
    #balance; // Private property (not accessible from outside)

    constructor(initialBalance) {
        this.#balance = initialBalance;
    }

    deposit(amount) {
        this.#balance += amount;
        console.log(`Deposited: $${amount}`);
    }

    getBalance() {
        return `Current Balance: $${this.#balance}`;
    }
}

const account = new BankAccount(1000);
account.deposit(500);
console.log(account.getBalance()); // Output: Current Balance: $1500

// console.log(account.#balance); // ❌ Error: Private field is not accessible
```

### Benefits of Abstraction
- **Hides Complexity**: Users interact with high-level methods without worrying about internal logic.
- **Improves Code Readability**: Keeps code clean by exposing only essential details.
- **Enhances Security**: Prevents direct access to sensitive data.
- **Encourages Code Reusability**: Abstraction allows creating reusable components.


---------------------------------------------------------------------------------------------


## `npm run build` Command

The `npm run build` command is used to execute the `build` script defined in the `package.json` file of a Node.js project. It is commonly utilized in both frontend frameworks (e.g., React, Angular, Vue) and backend frameworks (e.g., Nest.js) to compile, bundle, and optimize code for production.

---

### How It Works
1. **Script Lookup**: Checks the `scripts` section in `package.json` for a script named `build`.
2. **Execution**: Runs the associated command (e.g., compiling TypeScript, bundling JavaScript, or optimizing assets).
3. **Output**: Generates a production-ready version of the application, typically in a `dist/` or `build/` directory.

---

### Example: `package.json` with a `build` Script

```json
{
    "scripts": {
        "start": "node index.js",
        "dev": "nodemon index.js",
        "build": "tsc",
        "test": "jest"
    }
}
```

- **Command**: Running `npm run build` executes `tsc` (TypeScript Compiler).
- **Result**: TypeScript files are compiled into JavaScript.

---

### Example: `build` Script in a Nest.js Project

```json
{
    "scripts": {
        "build": "nest build"
    }
}
```

- **Command**: Running `npm run build` compiles the Nest.js project.
- **Result**: A production-ready `dist/` directory is created.

---

### What Happens After Running `npm run build`?
1. **Code Transpilation**: Converts code (e.g., TypeScript to JavaScript).
2. **Asset Optimization**: Minifies and optimizes assets.
3. **Production Output**: Creates a `dist/` or `build/` directory containing the production-ready application.

---

This command is essential for preparing applications for deployment, ensuring optimized and production-ready code.

---------------------------------------------------------------------------------------------


## Key Differences Between Primary Key and Unique Key

| Feature                | Primary Key          | Unique Key           |
|------------------------|----------------------|----------------------|
| **Uniqueness**         | ✅ Yes               | ✅ Yes               |
| **NULL Allowed?**      | ❌ No                | ✅ Yes               |
| **Multiple per Table?**| ❌ No (Only one)     | ✅ Yes (Multiple)    |
| **Automatically Indexed?** | ✅ Yes           | ❌ No (Manually indexed) |

### When to Use Each Key
- **Primary Key**: Use when you need a unique identifier for each row (e.g., `id`).
- **Unique Key**: Use when you need a unique constraint but allow `NULL` values (e.g., `email`).

---

## Uses of a Primary Key in a Database

A **Primary Key (PK)** is essential in relational databases to uniquely identify each record in a table. Below are its main uses:

### 1. Ensures Uniqueness
- Guarantees that no two rows in a table have the same value for the primary key column.

**Example**:
```sql
CREATE TABLE Students (
    student_id INT PRIMARY KEY,  -- Each student must have a unique ID
    name VARCHAR(50)
);
```

### 2. Prevents NULL Values
- A primary key cannot have `NULL` values, ensuring every row has a unique identifier.

**Incorrect Usage**:
```sql
INSERT INTO Students (student_id, name) VALUES (NULL, 'John');  -- ❌ Error
```

### 3. Enables Efficient Indexing & Fast Lookups
- Most databases automatically create an index on the primary key, improving search performance.

**Example**:
```sql
SELECT * FROM Students WHERE student_id = 101;
```

### 4. Establishes Relationships (Foreign Key)
- A primary key in one table can be referenced as a foreign key in another table to establish relationships.

**Example**:
```sql
CREATE TABLE Courses (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(100)
);

CREATE TABLE Enrollments (
    enrollment_id INT PRIMARY KEY,
    student_id INT,
    course_id INT,
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);
```

### 5. Prevents Duplicate Records
- Ensures that duplicate records cannot exist in the table.

**Example**:
```sql
INSERT INTO Students (student_id, name) VALUES (101, 'Alice');
INSERT INTO Students (student_id, name) VALUES (101, 'Bob');  -- ❌ Error: Duplicate entry for 'student_id'
```

### 6. Used in Auto-Increment Fields
- Often used with `AUTO_INCREMENT` to generate unique IDs automatically.

**Example**:
```sql
CREATE TABLE Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    order_date DATE
);
```

### 7. Helps in Data Integrity & Normalization
- Enforces data integrity by ensuring each row is unique and valid.
- Supports database normalization by reducing redundancy.

---

### Summary
- **Primary Key**: Essential for uniquely identifying records, establishing relationships, optimizing queries, and enforcing data integrity.
- **Unique Key**: Useful for enforcing uniqueness with the flexibility of allowing `NULL` values.
- Use the appropriate key based on your database design requirements.

---------------------------------------------------------------------------------------------

## Can We Use Sessions Without Login?

Yes, sessions can be used without login! Sessions are not strictly tied to authentication and can store temporary user-related data for unauthenticated users (guest users).

---

### How Sessions Work Without Login
1. **Session ID Generation**: When a user visits a website, a session ID is generated and stored in a cookie on their browser.
2. **Server-Side Session Object**: The server maintains a session object associated with the session ID.
3. **Data Storage**: Temporary data like user preferences, cart items, or selections can be stored in the session.
4. **Session Retrieval**: When the user returns, the server retrieves the session data using the session ID.

---

### Use Cases of Sessions Without Login
- **Shopping Cart**: Store cart items before checkout (even before the user logs in).
- **Page Preferences**: Save theme settings, language selection, etc.
- **Temporary Forms**: Store form data before submission.
- **Guest User Tracking**: Track anonymous users for analytics.

---

### Example: Using Express Session Without Login

Below is an example of how to use sessions in an Express.js application without requiring user login:

```javascript
const express = require("express");
const session = require("express-session");

const app = express();

// Configure session middleware
app.use(session({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true if using HTTPS
}));

// Store data in session
app.get("/set-session", (req, res) => {
    req.session.visitor = "Guest User";
    req.session.cart = ["Item1", "Item2"];
    res.send("Session data set!");
});

// Retrieve session data
app.get("/get-session", (req, res) => {
    res.send(req.session);
});

// Destroy session
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.send("Session destroyed!");
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

---

### Key Points from the Example
1. **Session Initialization**: The session middleware is configured with a secret key and options.
2. **Storing Data**: Data like cart items and visitor status are stored in the session.
3. **Retrieving Data**: Session data can be retrieved using `req.session`.
4. **Destroying Session**: Sessions can be destroyed to clear stored data.

---

### Conclusion
- ✅ **Yes**, sessions can be used without login.
- ✅ They are useful for storing temporary user data like cart items, preferences, and tracking guest users.
- ✅ If authentication is needed, user login details can also be stored inside the session.
