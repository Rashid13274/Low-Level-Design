// Product Service (Port 3001)
// The Product Service is a simple Express.js app that provides a list of products.
// It will be consumed by the API Gateway to fetch product information.
// product-service/server.js
const express = require('express');
const app = express();

const products = [
  { id: 1, name: 'Laptop', price: 999 },
  { id: 2, name: 'Phone', price: 699 }
];

app.get('/products', (req, res) => {
  res.json(products);
});

app.listen(3001, () => console.log('Product Service running on 3001'));