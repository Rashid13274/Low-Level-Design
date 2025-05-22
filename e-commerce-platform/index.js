const express = require('express');
const mysql = require('mysql2/promise');
const redis = require('redis');
const app = express();
const port = 3000;

// ------------------------------------------
// MySQL Connection (Persistent Storage)
// ------------------------------------------
const mysqlPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_mysql_password',
  database: 'inventory_db',
  waitForConnections: true,
});

// ------------------------------------------
// Redis Client (Cache)
// ------------------------------------------
const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
(async () => { await redisClient.connect(); })();

// ------------------------------------------
// API Endpoints
// ------------------------------------------

// Get Product Stock (Cache First)
app.get('/products/:id/stock', async (req, res) => {
  const productId = req.params.id;

  // 1. Check Redis Cache
  const cachedStock = await redisClient.get(`product:${productId}:stock`);
  if (cachedStock) {
    console.log('Cache hit!');
    return res.send({ stock: cachedStock, source: 'Redis Cache' });
  }

  // 2. If not in cache, query MySQL
  console.log('Cache miss! Querying MySQL...');
  const [rows] = await mysqlPool.query(
    'SELECT stock FROM products WHERE id = ?',
    [productId]
  );

  if (rows.length === 0) {
    return res.status(404).send('Product not found');
  }

  const stock = rows[0].stock;

  // 3. Update Redis Cache (expire after 60 seconds)
  await redisClient.set(`product:${productId}:stock`, stock, { EX: 60 });
  res.send({ stock: stock, source: 'MySQL Database' });
});

// Admin: Update Stock (Update MySQL + Invalidate Redis)
app.post('/products/:id/stock', async (req, res) => {
  const productId = req.params.id;
  const newStock = req.query.stock; // In real apps, use a proper body parser

  // 1. Update MySQL
  await mysqlPool.query(
    'UPDATE products SET stock = ? WHERE id = ?',
    [newStock, productId]
  );

  // 2. Delete cached stock in Redis
  await redisClient.del(`product:${productId}:stock`);
  res.send('Stock updated and cache invalidated!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});