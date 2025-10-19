Let's break down your questions step by step:

---

### 1. **What does the Dockerfile do?**

The Dockerfile:
```dockerfile
FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server-2.js"]
```
**creates a Docker image** for your Node.js application. This image contains everything needed to run your app (Node.js, dependencies, your code).

---

### 2. **If you run the container (e.g., via Docker Desktop), can you make HTTP requests and perform all operations?**

**Yes!**  
Once the container is running (and port 3000 is published), you can make HTTP requests to your app (e.g., `http://localhost:3000`).  
You do **not** need to run the app on your host machine; the container is self-contained.

---

### 3. **Do you need to run the application on the host machine as well?**

**No.**  
If your app is running in a Docker container, you do **not** need to run it on your host machine. The container is your running app.

---

### 4. **What if you make changes to your code and run the old container again?**

- If you **only restart the existing container**, you will **not** see your code changes.  
  The container uses the code that was present when the image was built.
- To see your changes:
  1. **Rebuild the image** (`docker build ...`)
  2. **Restart the container** with the new image.

---

### 5. **Explanation of each Dockerfile line**

```dockerfile
FROM node:18
```
- Uses the official Node.js version 18 image as the base.

```dockerfile
WORKDIR /usr/src/app
```
- Sets the working directory inside the container to `/usr/src/app`.

```dockerfile
COPY package*.json ./
```
- Copies `package.json` and `package-lock.json` (if present) to the container.

```dockerfile
RUN npm install
```
- Installs Node.js dependencies inside the container.

```dockerfile
COPY . .
```
- Copies all your application code into the container.

```dockerfile
EXPOSE 3000
```
- Informs Docker that the app will listen on port 3000.

```dockerfile
CMD ["node", "server-2.js"]
```
- Sets the default command to run your app using Node.js.

---

**Summary:**  
- Build the image after code changes to update the container.
- You only need to run the app in Docker, not on your host.
- The Dockerfile ensures your app runs the same everywhere.