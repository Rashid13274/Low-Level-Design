## Question

You wrote a snippet of code in JavaScript for the browser. Now you want to port that code to Node.js. However, the browser code uses the `window` object to store and access global variables, which is not available in Node.js.

How can you accommodate this?

### Options:
1. Use the `document` variable instead of the `window` variable.
2. Install the Gecko engine to run Node.js on, instead of V8.
3. Use Node.js's `global` object instead.

### Answer:
The correct answer is:

**Use Node.js's `global` object instead.**

### Explanation:
In browsers, the `window` object is the global object, and you can attach variables to it like `window.myVar = 123`.

In Node.js, there is no `window` object because it's not running in a browser. Instead, Node.js provides a similar global object called `global`.

#### Example:

**Browser code:**
```javascript
window.myVar = "Hello, world!";
console.log(window.myVar);
```

**Node.js equivalent:**
```javascript
global.myVar = "Hello, world!";
console.log(global.myVar);
```

So, to port your code, replace any `window` references with `global`.

--------------------------------------------------------------------------------------------------

# You are working as a developer on a project. You want to install some dependencies that will be useful to you while you are writing the code. However, you do not need these dependencies to be available when the application actually runs in production.

How should you specify that the dependency be available for developers but not in production?

- Switch from npm to yarn.
- Install the dependency using pip install.
- Use the --save-dev flag when installing the package: npm install.
- Delete the developer dependencies from the production environment manually.

**Correct Answer:**

Use the --save-dev flag when installing the package: `npm install --save-dev`.

**Explanation:**

When you're working on a Node.js project and want to install packages that are only needed during development (like testing libraries, linters, or build tools), you should install them as devDependencies using the `--save-dev` flag.

**Example:**

```bash
npm install eslint --save-dev
```

This ensures the package is added to the `devDependencies` section in your `package.json`, and it won’t be installed when running `npm install --production`.

**Why other options are incorrect:**

- `spm`, `yarn`, and `pip` are not related to this specific use case in Node.js.
- Deleting developer dependencies manually is error-prone and not a best practice.

==============================================================================================

# You have written an application that connects to a remote SSH server using Node.js. The name of the server is provided as a command-line argument. However, if the connection fails, you want the app to prompt the user for a different server name using the terminal's standard input.

**Question:**  
How would you acquire the name of the server via terminal input?  

**Options:**  
1. Use the `createInterface` method from the `readline` module to create a prompt.  
2. Open a raw socket and connect it to the file descriptor for standard input.  
3. Open the stdin file with `readFileSync` and read a single line.  
4. Use the built-in `input()` function to get a line of input as a single string.  

**Answer:**  
The correct answer is:  
**Use the `createInterface` method from the `readline` module to create a prompt.**

**Explanation:**  
In Node.js, the standard way to read user input from the terminal is to use the `readline` module. The `createInterface` method allows you to set up an input/output interface with the terminal.

**Example:**
```javascript
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter server name: ', (serverName) => {
    console.log(`You entered: ${serverName}`);
    rl.close();
});
```

**Why not the others?**  
- **Open a raw socket:** Unnecessarily complex and not suitable for basic input.  
- **`readFileSync` on stdin:** Not ideal for interactive input (better for scripting or piped input).  
- **`input()` function:** JavaScript/Node.js does not have a built-in `input()` like Python does.  

Thus, `readline.createInterface` is the correct and most appropriate approach.
================================================================================================


### Optimizing Your Node.js Module for Distribution

You have written a Node.js module that handles web requests **50% faster** than the next best alternative. To help other developers optimize their code, you decide to publish your work as a library. However, your code requires a certain version of Node.js or above to operate as expected.

#### Question:
How should you require a specific minimum version of Node.js for the package?

#### Options:
1. Specify a minimum version using the webpack configuration file.
2. Add a warning in the file `index.js` to prevent the requests from running on an invalid version of Node.js.
3. Add a lifecycle script to warn the user when using your package with a version of Node.js below the required minimum.
4. Use the `engines` attribute of `package.json` to specify the minimum required version of Node.js.

#### Correct Answer:
**Use the `engines` attribute of `package.json` to specify the minimum required version of Node.js.**

#### Explanation:
To define which versions of Node.js your package supports, you should specify it in your `package.json` using the `engines` field. This helps tools like npm or yarn warn users (or even prevent installation, depending on the setup) if they are using an unsupported version of Node.js.

##### Example:
```json
{
    "name": "fast-web-handler",
    "version": "1.0.0",
    "engines": {
        "node": ">=16.0.0"
    }
}
```

#### Why Not the Other Options?
- **Webpack configuration**: Not relevant for setting Node.js version requirements.
- **Warning in `index.js`**: Manual and not standard; can be bypassed.
- **Lifecycle script warning**: Less reliable and can be skipped or ignored by package managers.

#### Conclusion:
The best and most standard approach is to use the `engines` field in `package.json`.

====================================================================================================


### Serving a Template File with Node.js and Express

You are serving a template file with Node.js and Express that represents a user's account information. As such, you wish to pass in information from the backend like the username, description, signup date, and so on.

**Question:**  
How can you make this information available to the template?

**Options:**  
1. Return the filename with the template variables in the response body.  
2. Import the jinja2 templating property of the fs module.  
3. Load the file with `fs.readFileSync()` and change out the placeholder data with a regular expression.  
4. Use the `res.render()` method and pass data in via an object in the second argument.

**Answer:**  
The correct answer is:  
**Use the `res.render()` method and pass data in via an object in the second argument.**

**Explanation:**  
In Express, when using a templating engine (like EJS, Pug, Handlebars), you render a template file and pass data as an object so the template can dynamically display that data.

**Example:**
```javascript
app.get('/account', (req, res) => {
    res.render('account', {
        username: 'JohnDoe',
        description: 'A passionate developer',
        signupDate: '2024-05-15'
    });
});
```
Here, the template engine will replace placeholders in the template with these values.

**Why not the others?**  
- **Returning filename only:** Just sending the filename doesn’t pass data or render the template.  
- **jinja2 and fs module:** `jinja2` is a Python templating engine; Node.js doesn’t have it. The `fs` module is for file operations, not templating.  
- **Using `fs.readFileSync` with regex:** This is a manual, error-prone way and not the standard approach when templating engines exist.

**Conclusion:**  
The clean, standard way is to use `res.render()` with data passed as an object.
===============================================================================================


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

=========================================================================================================