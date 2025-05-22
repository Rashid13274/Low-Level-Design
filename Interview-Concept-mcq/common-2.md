### Understanding MPLS and Compression Formats

### 1. MPLS (Multiprotocol Label Switching)
- A networking technology for efficient packet forwarding
- **Important:** Not a compression format

### 2. Compression Formats
1. **Brotli**
    - Google's modern compression algorithm
    - High compression ratio and speed

2. **Zstd (Zstandard)**
    - Facebook's lossless compression
    - Balanced speed and compression ratio

3. **Gzip**
    - Uses DEFLATE algorithm
    - Common for web content and file compression

### 3. Data Formats and Architecture
#### Data Serialization Formats
- **JSON:** Lightweight API data format
- **ProtoBuf:** Google's binary serialization
- **XML:** Text-based data format

#### Architecture
- **REST (Representational State Transfer)**
  - Architectural style for networked apps
  - Not a serialization format

### 4. Database Types: SQL vs NoSQL
#### SQL Databases
- PostgreSQL: Open-source relational database
- ClickHouse: Columnar database for analytics
- DuckDB: In-process analytical database

#### NoSQL Database
- **Redis**
  - Key-value store
  - Used for caching
  - Real-time applications
  - **Note:** Not a SQL database
--------------------------------------------------------------------------------------

### Databases and Their Suitability for OLAP and OLTP Workloads

#### Explanation of OLAP and OLTP:
- **OLAP (Online Analytical Processing):** Optimized for analytical queries, aggregations, and reporting.
- **OLTP (Online Transaction Processing):** Optimized for transactional workloads, frequent inserts, updates, and quick lookups.

#### Analysis of Given Databases:
1. **PostgreSQL:**
    - Type: OLTP relational database.
    - Use Case: Designed for transactional workloads.
    - Verdict: **NOT an OLAP database.**

2. **ClickHouse:**
    - Type: OLAP database.
    - Use Case: Optimized for fast analytical queries.
    - Verdict: **OLAP database.**

3. **DuckDB:**
    - Type: Lightweight OLAP database.
    - Use Case: Local analytical processing.
    - Verdict: **OLAP database.**

4. **Redis:**
    - Type: Key-value store (NoSQL).
    - Use Case: Primarily used for caching, not typically for OLAP.
    - Verdict: **NOT an OLAP database.**

#### Answer:
- **NOT OLAP databases:** PostgreSQL and Redis.

---

### Choosing Databases for Large-Scale Analytical Workloads

#### Best OLAP Databases for Analytics:
- ✅ **ClickHouse and DuckDB:** Both are optimized for fast analytical processing.

#### Analysis of Other Options:
1. **MySQL and PostgreSQL:**
    - Type: Primarily OLTP databases.
    - Verdict: **Not ideal for large-scale analytics.**

2. **Cassandra and Elasticsearch:**
    - **Cassandra:** A NoSQL database optimized for write-heavy workloads, not complex analytics.
    - **Elasticsearch:** A search engine, not a traditional analytical database.
    - Verdict: **Not suitable for deep analytics.**

3. **Redis and MongoDB:**
    - **Redis:** An in-memory NoSQL database used for caching, not analytics.
    - **MongoDB:** A NoSQL document store, better for operational workloads than deep analytics.
    - Verdict: **Not suitable for large-scale analytics.**

#### Final Recommendation:
- ✅ **ClickHouse and DuckDB** are the best choices for handling large-scale analytical workloads.

-----------------------------------------------------------------------------------------------------

# SCP (Secure Copy) Command

The `scp` (Secure Copy) command is used to securely transfer files between a local and a remote system or between two remote systems using SSH (Secure Shell).

## Purpose of `scp`
- **Secure File Transfer**: Transfers files securely over an SSH connection.
- **Remote File Copy**: Copies files between a local and remote machine or between two remote machines.
- **Preserves Permissions**: Maintains file attributes like timestamps and permissions.

## Basic Syntax
```sh
scp [options] source destination
```

## Common Use Cases
### Copy a file from local to remote
```sh
scp file.txt user@remote_host:/path/to/destination/
```

### Copy a file from remote to local
```sh
scp user@remote_host:/path/to/file.txt /local/destination/
```

### Copy a directory recursively
```sh
scp -r my_folder user@remote_host:/path/to/destination/
```

### Copy between two remote servers
```sh
scp user1@remote1:/path/to/file user2@remote2:/path/to/destination/
```

## Key Options
- `-r`: Recursively copy directories.
- `-P`: Specify SSH port (default is 22).
- `-C`: Enable compression.
- `-i`: Use a specific SSH key for authentication.

## Alternative
For better performance and resume support, consider using `rsync` instead of `scp`.

---------------------------------------------------------------------------------------------

### The Correct Answer: Docker

#### Explanation:
- **Jenkins**: A widely used CI/CD automation tool.
- **CircleCI**: A CI/CD tool for automating builds, tests, and deployments.
- **GitHub Actions**: A CI/CD tool integrated with GitHub for automation workflows.
- **Docker**: **Not** a CI/CD tool; it is a containerization platform used to create, deploy, and run applications in isolated environments.

Thus, Docker is **not** a CI/CD pipeline tool.
