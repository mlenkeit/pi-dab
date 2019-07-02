FROM mlenkeit/node-compose:latest

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

USER root

WORKDIR /usr/src/app

COPY package-lock.json /usr/src/app/package-lock.json
COPY package.json /usr/src/app/package.json
RUN npm install --no-optional && npm cache clean --force

COPY .git /usr/src/app/.git
COPY launcher /usr/src/app/launcher
COPY lib /usr/src/app/lib
COPY test /usr/src/app/test
COPY docker-compose.yml /usr/src/app/docker-compose.yml
COPY Dockerfile /usr/src/app/Dockerfile
COPY healthcheck.js /usr/src/app/healthcheck.js
COPY index.js /usr/src/app/index.js
COPY projects.json /usr/src/app/projects.json