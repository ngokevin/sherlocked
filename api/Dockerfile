FROM    ubuntu:15.04
MAINTAINER    ngokevin

# Install Node.js and npm.
RUN     apt-get update && apt-get install -y nodejs-legacy \
    npm \
    git \
    git-core \
    sqlite3 \
    libsqlite3-dev

# Bundle.
COPY    . /src

# Install dependencies.
RUN     cd /src; npm install
RUN     cd /src; nodejs db.js

EXPOSE  1077
CMD     ["nodejs", "/src/index.js"]
