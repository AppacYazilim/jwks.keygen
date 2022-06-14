FROM node:16.14-alpine3.14  as builder

WORKDIR /app
COPY --chown=node:node package.json yarn.lock ./

RUN yarn install --pure-lockfile

COPY --chown=node:node src/ /app/src
COPY --chown=node:node webpack.config.js tsconfig.json ./

RUN yarn package

FROM node:16.14-alpine3.14 as runner

WORKDIR /app

EXPOSE 5000

COPY --chown=node:node package.json yarn.lock ./

RUN yarn install --pure-lockfile --production

RUN rm package.json yarn.lock

COPY --chown=node:node --from=builder /app/dist/server.js /app/server.js

EXPOSE 3000
CMD [ "node", "server.js" ]