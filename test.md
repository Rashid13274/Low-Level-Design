### Enabling Cross-Origin Resource Sharing (CORS) in a Node.js App Using Express

You want to enable Cross-Origin Resource Sharing (CORS) on your Node.js app using Express so that you can authorize your clients' domains to access certain API endpoints. CORS is disabled completely by default, so you will have to turn it on using Express.

**Question:**  
How can you authorize the clients' domains on your server?

**Options:**  
1. Whitelist the domain with the `cors` middleware for Express.  
2. Disable CORS errors by turning off the Same Origin Policy when browsers connect from an origin owned by a client's domain.  
3. Add the `Access-Control-Allow-Origin` HTTP response header with the clients' domains as the origin.  
4. Check the `User-Agent` header to determine if the request comes from an authorized origin.

---

### Correct Answer:  
**Whitelist the domain with the `cors` middleware for Express.**

**Explanation:**  
In Express, the easiest and standard way to enable and configure CORS is by using the `cors` middleware. You can specify which client domains (origins) are allowed to access your API by whitelisting them in the middleware options.

**Example:**
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

const whitelist = ['https://client1.com', 'https://client2.com'];

const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));
```

---

### Why Not the Other Options?

1. **Disable Same Origin Policy:**  
     This is a browser security feature and cannot be turned off from the server.

2. **Manually Add `Access-Control-Allow-Origin` Header:**  
     While you can manually add the header, the correct header is `Access-Control-Allow-Origin`. Managing CORS manually is error-prone; using middleware like `cors` is a more reliable approach.

3. **Check `User-Agent` Header:**  
     The `User-Agent` header does not indicate the origin. CORS is based on the `Origin` header, not the `User-Agent`.

---

### Conclusion:  
The proper way to authorize client domains is to whitelist them using the Express `cors` middleware.