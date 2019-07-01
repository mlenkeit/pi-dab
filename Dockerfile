FROM mlenkeit/node-compose:latest

# App
ENV PORT 3000

WORKDIR /usr/src/projects/mlenkeit/pi-dab

COPY package-lock.json /usr/src/projects/mlenkeit/pi-dab/package-lock.json
COPY package.json /usr/src/projects/mlenkeit/pi-dab/package.json
RUN npm install --production

COPY .git /usr/src/projects/mlenkeit/pi-dab/.git
COPY lib /usr/src/projects/mlenkeit/pi-dab/lib
COPY test /usr/src/projects/mlenkeit/pi-dab/test
COPY docker-compose.yml /usr/src/projects/mlenkeit/pi-dab/docker-compose.yml
COPY Dockerfile /usr/src/projects/mlenkeit/pi-dab/Dockerfile
COPY healthcheck.js /usr/src/projects/mlenkeit/pi-dab/healthcheck.js
COPY index.js /usr/src/projects/mlenkeit/pi-dab/index.js
COPY projects.json /usr/src/projects/mlenkeit/pi-dab/projects.json

HEALTHCHECK --interval=20s CMD node healthcheck.js

EXPOSE 3000
CMD [ "node", "index.js" ]