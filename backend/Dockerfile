# Use official Node.js LTS version as base image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose the port your app runs on (change if not 3000)
EXPOSE 3000

# Command to run your app
CMD ["npm", "start"]
