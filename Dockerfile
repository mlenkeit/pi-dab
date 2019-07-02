FROM mlenkeit/node-compose:latest

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

USER root

WORKDIR /usr/src/app

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
RUN npm install --no-optional && npm cache clean --force

COPY .git ./.git
COPY launcher ./launcher
COPY lib ./lib
COPY test ./test
COPY docker-compose.yml ./docker-compose.yml
COPY Dockerfile ./Dockerfile
COPY healthcheck.js ./healthcheck.js
COPY index.js ./index.js
COPY projects.json ./projects.json