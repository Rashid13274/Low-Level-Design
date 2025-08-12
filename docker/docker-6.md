
## Why Do We Need a Dockerfile?

### **Purpose**

A Dockerfile tells Docker how to build your application image — it’s basically a recipe that includes:

* Which base image to use (`node:current-alpine3.22`)
* What dependencies to install
* Which code files to copy
* Which command to run when the container starts

### **Benefits**

* **Consistency**: Runs the same everywhere (dev, staging, prod)
* **Isolation**: No dependency conflicts with your local machine
* **Easy deployment**: Just ship the container image

---

## Docker Compose Service Configuration

```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
  container_name: express_app
  ports:
    - "3000:3000"
  environment:
    MONGO_URI: mongodb://admin:qwerty@mongo:27017
  depends_on:
    - mongo
```

---

### **build**

* **context:** `.` → The folder where Docker will look for your Dockerfile (here, current directory `.`).
* **dockerfile:** `Dockerfile` → The exact file name of your Dockerfile.

### **container\_name**

* Gives your container a readable name (`express_app`) instead of a random hash.

### **ports**

* `"3000:3000"` → Maps your local machine’s port `3000` to the container’s `3000` (so you can access it via `localhost:3000`).

### **environment**

* Sets environment variables for your app (here, `MONGO_URI` so the app knows where MongoDB is).
* Notice **`mongo`** in the URI → this works because of Docker’s internal network, meaning containers can talk to each other using service names instead of `localhost`.

### **depends\_on**

* Ensures `mongo` service starts before `app` service.




 # ######## `app` Service in Docker Compose  ###############

### **Service Name**

In Docker Compose, each service runs in its own container.
`app` is the name given to your Express application container.

---

### **`build` Section**

```yaml
build:
  context: .
  dockerfile: Dockerfile
  .....
  .....
```

* **`context: .`** → Tells Docker which folder to use for building (the `.` means the current directory).
* **`dockerfile: Dockerfile`** → Specifies the exact file to use for building the image (useful if you have more than one Dockerfile in the project).

---

### **Why It’s Needed**

Without this section:

* Docker wouldn’t know how to build your Express app image.
* Your source code would never be turned into a runnable container.



## ============================================================================  ##


## Understanding Key Dockerfile Instructions



### **1. WORKDIR /express-docker**

**Purpose:**
Sets the current working directory for all following commands (`RUN`, `COPY`, `CMD`, etc.).

**Behavior:**

* If `/express-docker` doesn’t exist in the container, Docker will create it automatically.
* This directory will be created inside the root (`/`) of the container’s filesystem.
* `/express-docker` is literally `/express-docker` **inside** the container.

---

### **2. COPY package*.json ./*\*

**Purpose:**
Copies `package.json` and `package-lock.json` from your host machine into the container.

**`./` meaning here:**

* Because of `WORKDIR /express-docker`, the `./` refers to `/express-docker` inside the container.

---

### **Why WORKDIR matters for paths**

When `WORKDIR /express-docker` is set, all **relative paths** (like `server-1.js`) are resolved inside `/express-docker`.

Example:

```dockerfile
CMD ["node", "server-1.js"]
```

is the same as:

```dockerfile
CMD ["node", "/express-docker/server-1.js"]
```

but cleaner.

---

### **How it works in your case:**

1. `COPY . .` → This puts your local project files into `/express-docker` inside the container.
2. `WORKDIR /express-docker` → Sets the container’s default working directory to `/express-docker`.
3. `CMD ["node", "server-1.js"]` → Executes:

```bash
node /express-docker/server-1.js
```

automatically, without you typing the full path.

---

**If you didn’t set `WORKDIR`**, you’d have to write:

```dockerfile
CMD ["node", "/express-docker/server-1.js"]
```

every time — making the Dockerfile less clean.


## ========================================================================================= ## 

## Running a Container

```bash
docker run -it <docker_name>:<version> bash
# Example:
docker run -it testapp:1.0 bash
```

---

## Building & Running with Docker Compose

```bash
docker-compose up --build
```

Builds and runs the application.

---

## `docker compose up` vs `docker compose up --build`

### 1. `docker compose up`

* Uses the most recent built image for each service.
* **Note:** If the app’s code has changed but you haven’t rebuilt the image, those changes won’t appear.
* Docker only rebuilds automatically if:

  * The `Dockerfile` itself changes.
  * Build context files change **and** the image has never been built before.

---

### 2. `docker compose up --build`

* Forces Docker to rebuild the app service image **from scratch** before starting.
* Internally runs `docker compose build` before starting.
* Ensures any code changes in your `context: .` directory are included in the new container.

---

## When to Use Which

* **During development:**
  Use `docker compose up --build` to include every code change.

* **When starting unchanged services:**
  Use `docker compose up` — faster since it skips rebuilding.
