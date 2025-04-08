# Use an official Node.js image
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the entire frontend source code
COPY . .

# Build the React app
RUN npm run build

# Use a lightweight web server to serve the built frontend
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve

# Copy the built app from the previous step
COPY --from=builder /app/build /app/build

# Serve the app
CMD ["serve", "-s", "build", "-l", "3000"]

# Expose the frontend port
EXPOSE 3000