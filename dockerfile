# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to /app
COPY *  ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code to /app
COPY . .

# Expose port 3000 for the server to listen on
EXPOSE 3000

# Run the server using CMD
CMD ["npm", "start"]
