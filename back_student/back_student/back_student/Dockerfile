FROM node:18-alpine

RUN addgroup -S service-web && adduser -S -s /sbin/nologin -G service-web service-web

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --ignore-scripts

COPY . .
RUN chown -R service-web:service-web /usr/src/app

USER service-web

EXPOSE 3001
CMD ["yarn", "start"]
