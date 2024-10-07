FROM node:21

LABEL org.opencontainers.image.source=https://github.com/forattini-dev/fshortner
LABEL org.opencontainers.image.description="A lightweight URL shortner"
LABEL org.opencontainers.image.licenses=MIT

WORKDIR /app

COPY package.json /app
COPY yarn.lock /app

RUN yarn install

COPY . /app

ENTRYPOINT ["yarn"]
CMD ["start"]
