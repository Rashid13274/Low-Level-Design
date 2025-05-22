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

module.exports = LibraryDatabase;