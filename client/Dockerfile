FROM    ubuntu:15.04
MAINTAINER    ngokevin

# Install Node.js and npm.
RUN     apt-get update && apt-get install -y nodejs npm git git-core

# Bundle.
COPY    . /src

# Install dependencies.
RUN     cd /src; npm install
RUN     ln -s /usr/bin/nodejs /usr/bin/node

# Build.
RUN     cd /src; NODE_ENV=production ./node_modules/.bin/gulp build
