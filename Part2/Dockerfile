FROM node:latest

# Create app directory in container image, where your app will live its lifetime.
ENV APP_HOME /app
WORKDIR $APP_HOME

# Install app dependencies
# Only NPM packages to install are copied (to reduce build time when index.js is changed)
COPY package.json ./

# Installing the packages while the image is building
RUN npm install

# Bundle app source, i.e. copying all your required files for the app
# Note: files & folders inside .dockerignore will not be copied.
COPY . .

# The app binds to port 8080, so exposing port 8080 to be used by the docker network
EXPOSE 8080

# Runtime command to be executed when the container is launched
CMD ["node", "index.js"]