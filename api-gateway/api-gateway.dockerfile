# api-gateway.dockerfile
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app source
COPY . .

# Expose the port the gateway listens on
EXPOSE 3000

# Start the gateway
CMD [ "npm", "start" ]