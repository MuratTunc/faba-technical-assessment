# api-gateway.Dockerfile

# Use Node base image
FROM node:18

# Set workdir
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all other files
COPY . .

# Build TypeScript
RUN npm run build

# Expose port (match your API port, e.g., 3000)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]