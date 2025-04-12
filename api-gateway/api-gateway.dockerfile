# Use Node base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Install TypeScript and ts-node globally
RUN npm install -g typescript ts-node

# Copy the rest of the application code
COPY . .

# Expose the port for the app
EXPOSE 3000

# Start the app using ts-node
CMD ["ts-node", "src/index.ts"]
