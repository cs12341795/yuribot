FROM node:10-alpine
COPY package.json yarn.lock /tmp/
RUN cd /tmp && \
  yarn install --pure-lockfile --production --cache-folder /tmp/yarn-cache && \
  mkdir /src && \
  mv /tmp/node_modules /src/node_modules && \
  rm -rf /tmp/* /var/cache/apk/*
COPY . /src
WORKDIR /src
RUN npm run build

ENV NODE_ENV production
ENV SERVER_PORT 4000
EXPOSE $SERVER_PORT
CMD ["npm", "run", "boot"]