const express = require('express');
const app = express();
const PORT = 3000;

// route files

const register = require('./otp-based-project/route/user');

app.use(express.json());

// mount route files
app.use('/v1/api', register);

app.listen(3000, () => console.log(`server is running on ${PORT} `));

