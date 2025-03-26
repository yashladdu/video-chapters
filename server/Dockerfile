# Use a Node.js base image with FFmpeg installed
FROM jrottenberg/ffmpeg:4.4-alpine AS ffmpeg

# Set up Node.js
FROM node:18

# Install FFmpeg
COPY --from=ffmpeg / /

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port your app runs on
EXPOSE 4000

# Start the application
CMD ["node", "index.js"]
