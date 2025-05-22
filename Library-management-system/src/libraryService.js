class LibraryService {
    constructor(database, notifier) {
        this.database = database;
        this.notifier = notifier;
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

    returnBook(userId, isbn) {
        const user = this.database.users.get(userId);
        const book = this.database.books.get(isbn);
        if (!user || !book) throw new Error("Invalid return");

        const index = user.borrowedBooks.indexOf(isbn);
        user.borrowedBooks.splice(index, 1);
        book.isAvailable = true;
    }
}

module.exports = LibraryService;