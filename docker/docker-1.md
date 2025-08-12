# Docker Overview

Docker is a platform that helps developers build, run, and share applications using containers.

---

## Key Concepts

- **Container:** A process that runs an application from an image. Containers are isolated and portable.
- **Docker Image:** A lightweight, standalone, executable package that includes everything needed to run a piece of software.
- **Docker Hub:** An online repository for sharing Docker images.
- **Docker Desktop:** A GUI tool to manage Docker containers and images.

---

## Basic Docker Commands

- **Pull an Image:**  
   
    `docker pull node`
    Downloads the base image of Node.js.

- **Run a Container:**  
    
    `docker run -it node /bin/bash`
   
    Runs a Node.js container interactively.

- **Run Ubuntu Container:**  
   
    `docker run -it ubuntu`
 
    Opens an interactive Ubuntu terminal inside a container.

---

## Exercise

1. Download the Node.js image from Docker Hub.
2. Create a container for Node.js.
3. Run the Node.js container.
4. Write Node.js code inside the container.

---

## Docker Container Features

- **Portable:** Can run anywhere Docker is supported.
- **Lightweight:** Uses fewer resources compared to virtual machines.
- **Multiple Containers:** One image can spawn multiple containers.
- **Image Sharing:** Images can be shared within organizations.
- **Memory Usage:** Images are small; containers use memory when running.

---

## Docker Image Layers

```
container
     |
Layer 2
     |
Layer 1
     |
Base Layer (small Linux image)
```
- When a new container is created, a writable layer (container layer) is added on top of the image layers.
- If you pull different versions of the same image, Docker reuses existing layers.

Example:
```sh
docker pull mysql:latest
docker pull mysql:8.0
```

---

## Port Binding

- **Syntax:**  
    `docker run -p <host_port>:<container_port> image_name`
    Maps a port on the host to a port in the container.

- **Example:**  
    `docker run -d -e MYSQL_ROOT_PASSWORD=secret --name mysql-latest -p 8080:3306 mysql`
    Binds host port 8080 to container port 3306.

- **Note:**  
    A host port can only be bound to one container at a time.

---

## Troubleshooting Commands

- **View Logs:**  
   ` docker logs <container_id>`

- **Access Container Shell:**  
    `docker exec -it <container_id> /bin/bash`

---

## Docker vs Virtual Machine (VM)

| Layer                | Docker         | VM                |
|----------------------|---------------|-------------------|
| Application Layer    | Virtualized   | Virtualized       |
| Host OS Kernel       | Shared        | Virtualized       |
| Hardware             | Shared        | Virtualized       |

- Docker virtualizes only the application layer, making it more lightweight than VMs.

---

## Docker Networking

- Docker can create isolated networks for containers to communicate internally.
- **List Networks:**  
    `docker network ls`
- **Create Network:**  
    `docker network create mongo-network`

---

## Example: Running MongoDB and mongo-express

### 1. Run MongoDB Container

```sh
docker run -d \
    -p 27017:27017 \
    --name mongo \
    --network mongo-network \
    -e MONGO_INITDB_ROOT_USERNAME=admin \
    -e MONGO_INITDB_ROOT_PASSWORD=qwerty \
    mongo
```

### Connection String in MongoDB compass:-
`mongodb://admin:qwerty@localhost:27017/?authSource=admin`

### 2. Run mongo-express Container

```sh
docker run -d \
    --name mongo-express \
    --network mongo-network \
    -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin \
    -e ME_CONFIG_MONGODB_ADMINPASSWORD=qwerty \
    -e ME_CONFIG_MONGODB_URL="mongodb://admin:qwerty@mongo:27017/" \
    -p 8081:8081 \
    mongo-express
```

- If the `mongo-express` image is not present, Docker will download it.
- Ensure the username and password match those set in MongoDB.

### 3. Access mongo-express

- Visit: [http://localhost:8081](http://localhost:8081)
- Username: `admin`
- Password: `qwerty`
- You will see a GUI to browse and manage your MongoDB database.

---

## Application Integration Example

In a real-world scenario, your application (e.g., `docker-testapp`) can connect to a Docker container to use the technology (like MongoDB) inside your existing application stack.


#  # Docker Command
 * docker pull image_name: version  -> to pull/ download the image
 * docker images  -> to check all  the downloaded images.
 * docker run -d image_name (-d => detachment means run this image in background).
 * docker run -it ununtu ->  ( -it interactive mode , means we can input and output anything in ubuntu env.).
 * docker run image_name -> to run docker container.
 * docker ps -a -> list out all the container in docker
 * docker ps  -> list out all the running container.
 * docker stop container_name or containerId -> we can stop the existing container.
 * docker start container_name or containerId -> we can restart the existing container.
 * docker rmi image_name -> to remove or destroy the image.
 * docker rm container_name -> to remove or destroy the container name.
 for eg.  
 => to remove the hello-world image, we need to delete the if existing container,
  1. docker rm container_id or container_namer,
  2. docker rmi image_name or image_id.


 # To run  MySQL container: 
docker run  -d -e MYSQL_ROOT_PASSWORD=secret-password  --name older_mysql  mysql:8.0  =>  ( --name older_mysql -> is custom name,  -e -> e stand for environment, this is command to run mysql container).
