# Use an official Node.js image as a base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port 3000 for the frontend
EXPOSE 3000

# Start the Next.js app in development mode
CMD ["npm", "run", "dev"]
