# Use official Node.js LTS version as base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the project files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Make sure you have one of these commands based on your entry point:
CMD ["node", "index.js"]
# Or if using a different entry file:
# CMD ["node", "app.js"]
# Or if you want to use npm start (make sure "start" script is in package.json):
# CMD ["npm", "start"]
