// Step 2: Singleton Database
// Why Singleton?
// A single database instance ensures consistent data across the application.


class Database {
    static instance;
    
    constructor() {
      if (Database.instance) return Database.instance;
      this.urlMap = new Map();      // shortCode → longURL
      this.idCounter = 1000;        // Simulated auto-increment ID
      Database.instance = this;
    }
  
    // Simulate atomic ID generation (avoid race conditions)
    getNextId() {
      return this.idCounter++;
    }
  }

module.exports = Database;