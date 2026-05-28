FROM mhart/alpine-node:11 AS builder
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build
# RUN ls -lR

FROM nginx
COPY --from=builder /app/build /usr/share/nginx/html