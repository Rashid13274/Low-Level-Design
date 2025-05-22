## Project Structure
```
Library-management-system/
│
├── src/
│   ├── database.js      # Singleton pattern for database operations
│   ├── notifier.js      # Observer pattern for notifications
│   ├── libraryService.js # Core business logic with DI
│   └── index.js         # System initialization and example usage
│
└── README.md
```

We’ll build a simplified Library Management System step by step, introducing new concepts only after explaining them.

### Step 1: Dependency Injection (DI) Refresher

**What is DI?**

A design pattern where an object receives its dependencies (e.g., services, databases) from an external source instead of creating them internally. This improves testability and decouples components.

**Example:**

```javascript
class UserService {
    constructor(database) { 
        this.database = database; // Database is "injected" here
    }
}
```

### Step 2: Introducing the Singleton Pattern

**What is Singleton?**

A pattern that ensures a class has only one instance and provides a global access point to it.

**Why Use It?**

For shared resources like databases or logging services where multiple instances would cause conflicts.

**JavaScript Implementation:**

```javascript
class LibraryDatabase {
    static instance; // Holds the singleton instance

    constructor() {
        if (LibraryDatabase.instance) {
            return LibraryDatabase.instance;
        }
        this.books = new Map(); // Simulated database
        LibraryDatabase.instance = this;
    }
}

// Usage: Only one instance exists globally
const db1 = new LibraryDatabase();
const db2 = new LibraryDatabase();
console.log(db1 === db2); // true
```

### Step 3: Observer Pattern

**What is Observer?**

A pattern where objects (observers) subscribe to events and get notified when the event occurs.

**Why Use It?**

To notify users when their borrowed books are overdue.

**JavaScript Implementation:**

```javascript
class Notifier {
    constructor() {
        this.subscribers = new Map(); // userID → callback
    }

    subscribe(userId, callback) {
        this.subscribers.set(userId, callback);
    }

    notify(userId, message) {
        if (this.subscribers.has(userId)) {
            this.subscribers.get(userId)(message);
        }
    }
}
```

### Step 4: Library System Implementation

We’ll combine DI, Singleton, and Observer into a practical example.

**1. Define Core Classes**

```javascript
// ---------- Singleton Database ----------
class LibraryDatabase {
    static instance;

    constructor() {
        if (LibraryDatabase.instance) {
            return LibraryDatabase.instance;
        }
        this.books = new Map(); // ISBN → { title, author, isAvailable }
        this.users = new Map(); // userID → { name, borrowedBooks }
        LibraryDatabase.instance = this;
    }
}

// ---------- Observer (Notifier) ----------
class Notifier {
    constructor() {
        this.subscribers = new Map();
    }

    subscribe(userId, callback) {
        this.subscribers.set(userId, callback);
    }

    notify(userId, message) {
        const callback = this.subscribers.get(userId);
        if (callback) callback(message);
    }
}

// ---------- Library Service (DI) ----------
class LibraryService {
    constructor(database, notifier) {
        this.database = database; // Injected singleton DB
        this.notifier = notifier; // Injected notifier
    }

    addBook(isbn, title, author) {
        this.database.books.set(isbn, { title, author, isAvailable: true });
    }

    registerUser(userId, name) {
        this.database.users.set(userId, { name, borrowedBooks: [] });
    }

    borrowBook(userId, isbn) {
        const user = this.database.users.get(userId);
        const book = this.database.books.get(isbn);

        if (!user || !book) throw new Error("User/book not found");
        if (!book.isAvailable) throw new Error("Book not available");
        if (user.borrowedBooks.length >= 5) throw new Error("Borrow limit reached");

        // Update state
        user.borrowedBooks.push(isbn);
        book.isAvailable = false;

        // Schedule overdue notification (simulate 2-week loan)
        setTimeout(() => {
            this.notifier.notify(userId, `Return overdue for book ${isbn}`);
        }, 2000); // 2 seconds for testing
    }
}
```

**2. Initialize and Use the System**

```javascript
// ---------- Setup Dependencies ----------
const database = new LibraryDatabase(); // Singleton
const notifier = new Notifier(); // Observer
const library = new LibraryService(database, notifier); // DI

// ---------- Subscribe a User to Notifications ----------
const userId = "user123";
notifier.subscribe(userId, (message) => {
    console.log(`Notification for ${userId}: ${message}`);
});

// ---------- Test the System ----------
library.addBook("001", "The Great Gatsby", "F. Scott Fitzgerald");
library.registerUser(userId, "Alice");

library.borrowBook(userId, "001");
// After 2 seconds: Notification for user123: Return overdue for book 001
```

### Key Concepts Explained in Code

**Dependency Injection:**

LibraryService receives database and notifier as external dependencies.

**Singleton:**

LibraryDatabase ensures only one instance exists.

**Observer:**

Users subscribe to the Notifier and receive overdue alerts.

### How to Extend This System

**Add Return Book Logic:**

```javascript
returnBook(userId, isbn) {
    const user = this.database.users.get(userId);
    const book = this.database.books.get(isbn);
    if (!user || !book) throw new Error("Invalid return");

    const index = user.borrowedBooks.indexOf(isbn);
    user.borrowedBooks.splice(index, 1);
    book.isAvailable = true;
}
```

**Add Reservations:**

Use the Observer pattern to notify users when a book becomes available.

**Add Logging:**

Inject a Logger service via DI to track borrow/return activity.

This approach introduces new patterns one at a time while keeping JavaScript at the core. Let me know if you want to explore another concept!

*/
based on above file structure arrange the the code and comments 
