# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Install TypeScript globally
RUN npm install -g typescript

# Copy the rest of the application code
COPY . .

# Compile TypeScript
RUN tsc

# Expose the port your app runs on
EXPOSE 8082

# Start the app using compiled JavaScript
CMD ["node", "dist/index.js"]