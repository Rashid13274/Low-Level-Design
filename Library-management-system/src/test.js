const { library, notifier } = require('./index');

// Test Case 1: Add and Borrow Book
console.log('\n--- Test Case 1: Add and Borrow Book ---');
try {
    const userId = "user456";
    notifier.subscribe(userId, (message) => {
        console.log(`Notification for ${userId}: ${message}`);
    });

    library.addBook("002", "1984", "George Orwell");
    library.registerUser(userId, "Bob");
    library.borrowBook(userId, "002");
    console.log("Test Case 1: Passed ✅");
} catch (error) {
    console.error("Test Case 1 Failed ❌:", error.message);
}

// Test Case 2: Try to borrow unavailable book
console.log('\n--- Test Case 2: Borrow Unavailable Book ---');
try {
    const userId2 = "user789";
    library.registerUser(userId2, "Charlie");
    library.borrowBook(userId2, "002"); // Should throw error as book is already borrowed
    console.log("Test Case 2: Failed ❌ (Should have thrown error)");
} catch (error) {
    console.log("Test Case 2: Passed ✅ - Correctly caught error:", error.message);
}

// Test Case 3: Return Book
console.log('\n--- Test Case 3: Return Book ---');
try {
    library.returnBook("user456", "002");
    console.log("Test Case 3: Passed ✅");
} catch (error) {
    console.error("Test Case 3 Failed ❌:", error.message);
}

/* 
--- Test Case 1: Add and Borrow Book ---
Test Case 1: Passed ✅

--- Test Case 2: Borrow Unavailable Book ---
Test Case 2: Passed ✅ - Correctly caught error: Book not available

--- Test Case 3: Return Book ---
Test Case 3: Passed ✅

Notification for user456: Return overdue for book 002
*/

// npm install -g nodemon
// nodemon test.js