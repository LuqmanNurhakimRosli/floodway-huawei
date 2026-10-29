# Builds the React app, then serves it with Caddy, which also proxies api.<domain> to the backend.
FROM node:20-alpine AS build
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE VITE_VISION_MOCK=0
RUN npm run build

FROM caddy:2-alpine
COPY deploy/ecs/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist /srv
