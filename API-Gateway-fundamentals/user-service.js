// User Service (Port 3002)
// The User Service is a simple Express.js app that provides a list of users.

const express = require('express');
const app = express();

// Sample user data
const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
];

// Route to get the list of users
app.get('/users', (req, res) => {
    res.json(users);
});

// Start the server
app.listen(3002, () => {
    console.log('User Service running on port 3002');
});