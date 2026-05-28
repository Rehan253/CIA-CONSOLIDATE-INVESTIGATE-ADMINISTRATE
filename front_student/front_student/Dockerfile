FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .

ARG REACT_APP_API_URL=localhost:3001
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN yarn build

FROM nginxinc/nginx-unprivileged:alpine

USER root
RUN addgroup -S service-web && adduser -S -s /sbin/nologin -G service-web service-web \
    && chown -R service-web:service-web /usr/share/nginx/html /var/cache/nginx

COPY --from=builder /app/build /usr/share/nginx/html
RUN chown -R service-web:service-web /usr/share/nginx/html

USER service-web
EXPOSE 8080
