// throtteling: 

const express = require('express');
const app = express();

const rateLimitStore = {}; // In-memory store for throttling data
const MAX_REQUESTS = 5; // Max requests allowed
const TIME_WINDOW = 10000; // Time window in milliseconds (10 seconds)
const DELAY_TIME = 2000; // Delay subsequent requests by 2 seconds

// Throttling Middleware
const throttlingMiddleware = (req, res, next) => {
  const ip = req.ip; // Get client's IP address
  const currentTime = Date.now();

  if (!rateLimitStore[ip]) {
    // Initialize client record
    rateLimitStore[ip] = {
      requests: 1,
      startTime: currentTime,
      isDelayed: false,
    };
    return next();
  }

  const timeElapsed = currentTime - rateLimitStore[ip].startTime;
  console.log(timeElapsed)

  if (timeElapsed > TIME_WINDOW) {
    // Reset the counter after time window
    rateLimitStore[ip].requests = 1;
    rateLimitStore[ip].startTime = currentTime;
    rateLimitStore[ip].isDelayed = false;
    return next();
  }

  // If within time window
  if (rateLimitStore[ip].requests >= MAX_REQUESTS) {
    console.log(rateLimitStore[ip].requests, ' ', MAX_REQUESTS);
    if (!rateLimitStore[ip].isDelayed) {
      rateLimitStore[ip].isDelayed = true;
      console.log(`Delaying requests for IP: ${ip}`);
      setTimeout(() => {
        rateLimitStore[ip].isDelayed = false;
      }, DELAY_TIME);
    }
    return res.status(429).json({ message: 'Too many requests. Please wait.' });
  }

  // Increment the request count
  rateLimitStore[ip].requests += 1;
  next();
};

// Apply the middleware
app.use(throttlingMiddleware);

// Example Route
app.get('/', (req, res) => {
  res.send('Welcome to the throttled server!');
});

// Start server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
