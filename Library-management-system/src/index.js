const LibraryDatabase = require('./database');
const Notifier = require('./notifier');
const LibraryService = require('./libraryService');

// Initialize the system
const database = new LibraryDatabase();
const notifier = new Notifier();
const library = new LibraryService(database, notifier);

// Example usage
const userId = "user123";
notifier.subscribe(userId, (message) => {
    console.log(`Notification for ${userId}: ${message}`);
});

// Test the system
library.addBook("001", "The Great Gatsby", "F. Scott Fitzgerald");
library.registerUser(userId, "Alice");
library.borrowBook(userId, "001");

module.exports = {
    library,
    database,
    notifier
};