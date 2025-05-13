FROM nodered/node-red:latest

# Set the UID and GID for the node-red user (optional, but good practice)
USER root

# Create a directory for our custom storage plugin within node_modules in the data directory
# Node-RED automatically loads modules from /data/node_modules
RUN mkdir -p /data/node_modules/node-red-contrib-cloudant-storage

# Copy the custom storage plugin code into the container
COPY ./node-red-cloudant-storage /data/node_modules/node-red-contrib-cloudant-storage/

# Install dependencies for the custom storage plugin
RUN cd /data/node_modules/node-red-contrib-cloudant-storage && npm install --unsafe-perm --no-update-notifier --no-fund --only=production

# Copy a custom settings.js file to configure Node-RED to use the plugin
COPY ./settings.js /data/settings.js

# Ensure the node-red user owns the files in /data
RUN chown -R node-red:node-red /data

# Switch back to the node-red user
USER node-red

# The CLOUDANT_CREDENTIALS environment variable will be set in Cloud Run
# ENV CLOUDANT_CREDENTIALS='{"url":"https://user:pass@host.cloudant.com","app_db":"mydb"}'

EXPOSE 1880

# The CMD is inherited from the base image, which starts Node-RED using /data/settings.js
