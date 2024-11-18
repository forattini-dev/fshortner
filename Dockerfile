FROM node:21-bullseye-slim AS build

WORKDIR /app

RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    ln -s /usr/bin/python3 /usr/bin/python

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

RUN yarn run build

COPY . .

FROM node:21-bullseye-slim

LABEL org.opencontainers.image.source="https://github.com/forattini-dev/fshortner"
LABEL org.opencontainers.image.description="A lightweight URL shortener"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY --from=build /app /app

EXPOSE 8000

ENTRYPOINT ["yarn"]
CMD ["start"]