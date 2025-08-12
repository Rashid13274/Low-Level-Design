FROM node:current-alpine3.22

# Set working directory
WORKDIR /express-docker

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node" , "server-1.js"]