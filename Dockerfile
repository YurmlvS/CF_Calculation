FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM deps AS builder

COPY . .
RUN npm run build && npm run api:build

FROM node:20-bookworm-slim AS api

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=7056

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist-server ./dist-server

USER node

EXPOSE 7056

CMD ["node", "dist-server/server/index.js"]

FROM nginxinc/nginx-unprivileged:stable-alpine AS frontend

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 7055

CMD ["nginx", "-g", "daemon off;"]
