# Docker Compose: Overview & Usage

## What is Docker Compose?

Docker Compose is a tool for defining and running multi-container Docker applications using a single YAML file (`docker-compose.yml`).  
Instead of running `docker run` commands for each service, you describe your app’s setup—including services, networks, and volumes—in one file and run it with a single command.

---

## 📦 Why Use Docker Compose?

- **Manage multiple containers easily** (e.g., MongoDB + Mongo Express)
- **Centralized configuration:** Define ports, environment variables, and volumes in one file
- **Easy sharing & version control** of your container setup
- **Simple startup:** Run everything with one command:  
    ```sh
    docker-compose up
    ```

---

## 🧱 Key Components of `docker-compose.yml`

```yaml
version: '3.8'  # Docker Compose file format version

services:       # Define your containers (services)
    mongo:        # MongoDB service
        image: mongo
        ports:
            - 27017:27017
        environment:
            MONGO_INITDB_ROOT_USERNAME: admin
            MONGO_INITDB_ROOT_PASSWORD: qwerty

    mongo-express:  # Mongo Express (UI) service
        image: mongo-express
        ports:
            - 8081:8081
        environment:
            ME_CONFIG_MONGODB_ADMINUSERNAME: admin
            ME_CONFIG_MONGODB_ADMINPASSWORD: qwerty
            ME_CONFIG_MONGODB_URL: mongodb://admin:qwerty@mongo:27017

```

# 🚀 Common Docker Compose Commands
`docker compose -f mongodb.yaml up -d ` : to run mongodb yaml file in detached mode. 
    `docker compose -f mongodb.yaml down`:> This command stops and removes all containers and networks created by the `mongodb.yaml` file.
`docker-compose up`	Start all services
`docker-compose up -d`	Start in background (detached mode)
`docker-compose down`	Stop and remove all services
`docker-compose ps`	List running services
`docker-compose logs`	Show logs for all services
docker-compose exec mongo bash	Exec into a running container



# How Networking Works in Compose
All services in a docker-compose.yml are placed on the same default network. So containers can refer to each other by service name (e.g., mongo).

`ME_CONFIG_MONGODB_URL: mongodb://admin:qwerty@mongo:27017/`


##===============================================================================================##

###  Below is a complete and clean docker-compose.yml setup that runs all of the following services together:

✅ MongoDB
✅ Redis
✅ MySQL
✅ Elasticsearch
✅ mongo-express (UI for MongoDB)

This is a great foundation for full-stack app development or microservices work

# ✅ Full docker-compose.yml with MongoDB, Redis, MySQL, and Elasticsearch :-
```yaml
version: '3.8'

services:
  mongo:
    image: mongo
    container_name: mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: qwerty
    volumes:
      - mongo-data:/data/db

  mongo-express:
    image: mongo-express
    container_name: mongo-express
    depends_on:
      - mongo
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: qwerty
      ME_CONFIG_MONGODB_URL: mongodb://admin:qwerty@mongo:27017/

  redis:
    image: redis
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  mysql:
    image: mysql:8
    container_name: mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: mydb
      MYSQL_USER: user
      MYSQL_PASSWORD: userpass
    volumes:
      - mysql-data:/var/lib/mysql

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.4
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false  # disable auth for dev
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - esdata:/usr/share/elasticsearch/data

volumes:
  mongo-data:
  redis-data:
  mysql-data:
  esdata:
```

# How to Use
- Save this to a file named docker-compose.yml.

Run:=>  `docker-compose up -d`

# Access Each Service  :-
| Service           | URL / Port                                     | Notes                          |
| ----------------- | ---------------------------------------------- | ------------------------------ |
| **MongoDB**       | `localhost:27017`                              | Accessible via drivers or apps |
| **Mongo Express** | [http://localhost:8081](http://localhost:8081) | Web UI for MongoDB             |
| **Redis**         | `localhost:6379`                               | Used for caching               |
| **MySQL**         | `localhost:3306`                               | Connect with `user:userpass`   |
| **Elasticsearch** | [http://localhost:9200](http://localhost:9200) | API for search/indexing        |
