# Base Image — Node 20 LTS on Debian "bookworm" (buster was EOL'd off the mirrors).
FROM node:20-bookworm-slim

# Create App Directory
WORKDIR /usr/src/app

# Install FFmpeg (+ ca-certificates so FFmpeg can validate TLS for RTMPS egress).
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install App Dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "node", "src/index.js" ]
