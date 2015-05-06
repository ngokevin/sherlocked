FROM    ubuntu:15.04
MAINTAINER    ngokevin

# Install Node.js and npm.
RUN     apt-get update && apt-get install -y \
    nodejs \
    npm \
    git \
    git-core

# Bundle.
VOLUME  ["/var/www/"]
COPY    . /var/www/

# Install dependencies.
RUN     cd /var/www/; npm install
RUN     ln -s /usr/bin/nodejs /usr/bin/node

# Build.
RUN     cd /var/www/; NODE_ENV=production ./node_modules/.bin/gulp build
