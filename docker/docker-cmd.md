# Docker Commands

## Image Management

| Command                                         | Description                                      |
|-------------------------------------------------|--------------------------------------------------|
| `docker pull image_name:version`                | Pull/download an image                           |
| `docker images`                                 | List all downloaded images                       |
| `docker rmi image_name`                         | Remove/destroy an image                          |

---

## Container Management

| Command                                         | Description                                 |
|-------------------------------------------------|---------------------------------------------|
| `docker run -d image_name`                      | Run image in background (detached mode)     |
| `docker run -it ubuntu`                         | Run Ubuntu in interactive mode              |
| `docker run image_name`                         | Run a container from image                  |
| `docker ps -a`                                  | List all containers                         |
| `docker ps`                                     | List running containers                     |
| `docker stop container_name` or `containerId`   | Stop a running container                    |
| `docker start container_name` or `containerId`  | Start a stopped container                   |
| `docker rm container_name`                      | Remove/destroy a container                  |


## Example: Remove an Image

1. Remove the container:
    ``` docker rm container_id```
2. Remove the image:
    ```docker rmi image_name ```

---

## Run MySQL Container

```sh
docker run -d -e MYSQL_ROOT_PASSWORD=secret-password --name older_mysql mysql:8.0
```
- `--name older_mysql`: Custom container name  
- `-e`: Set environment variable  
- Runs MySQL 8.0 in detached mode

# remove docker network:
- `docker network rm network_id`
# list 

