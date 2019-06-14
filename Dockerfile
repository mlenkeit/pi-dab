FROM node:12.4.0

# Docker
RUN apt-get update
RUN apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg2 \
    software-properties-common
RUN curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg | apt-key add -
RUN apt-key fingerprint 0EBFCD88
RUN add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/debian \
    $(lsb_release -cs) \
    stable"
RUN add-apt-repository \
    "deb [arch=armhf] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") \
    $(lsb_release -cs) \
    stable"
RUN apt-get update
RUN apt-get install -y docker-ce docker-ce-cli containerd.io

# Docker Compose
RUN curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
RUN chmod +x /usr/local/bin/docker-compose

# App
ENV PORT 3000

WORKDIR /usr/src/projects/mlenkeit/pi-dab

COPY package-lock.json /usr/src/projects/mlenkeit/pi-dab/package-lock.json
COPY package.json /usr/src/projects/mlenkeit/pi-dab/package.json
RUN npm install --production

COPY .git /usr/src/projects/mlenkeit/pi-dab/.git
COPY lib /usr/src/projects/mlenkeit/pi-dab/lib
COPY docker-compose.yml /usr/src/projects/mlenkeit/pi-dab/docker-compose.yml
COPY Dockerfile /usr/src/projects/mlenkeit/pi-dab/Dockerfile
COPY index.js /usr/src/projects/mlenkeit/pi-dab/index.js
COPY projects.json /usr/src/projects/mlenkeit/pi-dab/projects.json

EXPOSE 3000
CMD [ "node", "index.js" ]