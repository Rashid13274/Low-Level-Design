### Docker Publish

#### 📤 What is Docker Publish?

Publishing (pushing) a Docker image means uploading your built image to a remote registry like Docker Hub, so it can be shared and used elsewhere.

---

#### 🚀 How to Publish (Push) a Docker Image to Docker Hub

##### ✅ Steps to Publish Your Docker Image

1. **Build the Docker Image**
     `docker build -t yourusername/your-app-name:tag . `
     _Example:_
     `docker build -t mdrashid/my-node-api:1.0 .`

2. **Login to Docker Hub**

     ` docker login `
     Enter your Docker Hub username and password when prompted.

3. **Push the Image**

     `docker push yourusername/your-app-name:tag`
     _Example:_
     `docker push mdrashid/my-node-api:1.0 `
     This uploads the image to Docker Hub.

4. **Check on Docker Hub**

     Visit [Docker Hub Repositories](https://hub.docker.com/repositories) to see your image listed.

---

#### ✅ To Use the Image on Another Machine

Anyone can pull and run your image:

`docker pull mdrashid/my-node-api:1.0`

`docker run -p 3000:3000 mdrashid/my-node-api:1.0`


_Example Repository:_
`rashid345/docker-testappp`

