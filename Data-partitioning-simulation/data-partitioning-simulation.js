// =============================================
// Partitioning Strategies
// =============================================

// 1. Range-Based Partitioning: Split data by a range (e.g., user IDs A-M in Partition 1, N-Z in Partition 2)
class RangePartition {
    constructor(partitions) {
      this.partitions = partitions; // Array of partition objects
    }
  
    // Assign data to a partition based on alphabetical range
    assignPartition(user) {
      const firstLetter = user.name[0].toUpperCase();
      // Find the partition where the first letter falls in the range
      const partition = this.partitions.find(p => 
        firstLetter >= p.rangeStart && firstLetter <= p.rangeEnd
      );
      return partition ? partition.id : null;
    }
  }
  
  // 2. Hash-Based Partitioning: Distribute data using a hash function
  class HashPartition {
    constructor(numPartitions) {
      this.numPartitions = numPartitions; // Total partitions (e.g., 3)
    }
  
    // Simple hash function to convert a string to a number
    hash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
      }
      return Math.abs(hash) % this.numPartitions; // Modulo to get partition ID
    }
  
    assignPartition(user) {
      return this.hash(user.id); // e.g., user.id = "user123"
    }
  }
  
  // 3. Directory-Based Partitioning: Use a lookup table to map data to partitions
  class DirectoryPartition {
    constructor() {
      this.directory = new Map(); // Map<userId, partitionId>
    }
  
    // Manually or programmatically assign users to partitions
    assignPartition(user, partitionId) {
      this.directory.set(user.id, partitionId);
    }
  
    getPartition(user) {
      return this.directory.get(user.id);
    }
  }
  
  // =============================================
  // Test Data and Partitions
  // =============================================
  
  // Create sample users
  const users = [
    { id: "user1", name: "Alice" },
    { id: "user2", name: "Bob" },
    { id: "user3", name: "Charlie" },
    { id: "user4", name: "Zara" },
  ];
  
  // Initialize partitions
  const rangePartitions = [
    { id: 0, rangeStart: "A", rangeEnd: "M" }, // Partition 0: A-M
    { id: 1, rangeStart: "N", rangeEnd: "Z" }, // Partition 1: N-Z
  ];
  
  // =============================================
  // Testing the Partitioning Strategies
  // =============================================
  
  // --- Range-Based Partitioning ---
  const rangeStrategy = new RangePartition(rangePartitions);
  console.log("Range-Based Partitioning:");
  users.forEach(user => {
    const partitionId = rangeStrategy.assignPartition(user);
    console.log(`${user.name} → Partition ${partitionId}`);
  });
  // Output:
  // Alice → Partition 0 (A-M)
  // Bob → Partition 0 (A-M)
  // Charlie → Partition 0 (A-M)
  // Zara → Partition 1 (N-Z)
  
  // --- Hash-Based Partitioning ---
  const hashStrategy = new HashPartition(2); // 2 partitions
  console.log("\nHash-Based Partitioning:");
  users.forEach(user => {
    const partitionId = hashStrategy.assignPartition(user);
    console.log(`${user.id} → Partition ${partitionId}`);
  });
  // Output (depends on hash):
  // user1 → Partition 0
  // user2 → Partition 1
  // user3 → Partition 0
  // user4 → Partition 1
  
  // --- Directory-Based Partitioning ---
  const directoryStrategy = new DirectoryPartition();
  // Manually assign users to partitions
  directoryStrategy.assignPartition(users[0], 0); // Alice → Partition 0
  directoryStrategy.assignPartition(users[3], 1); // Zara → Partition 1
  console.log("\nDirectory-Based Partitioning:");
  users.forEach(user => {
    const partitionId = directoryStrategy.getPartition(user);
    console.log(`${user.name} → Partition ${partitionId || "Not assigned"}`);
  });
  // Output:
  // Alice → Partition 0
  // Bob → Partition Not assigned
  // Charlie → Partition Not assigned
  // Zara → Partition 1

  