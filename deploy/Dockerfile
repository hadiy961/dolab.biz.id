# Image self-contained: build di sini, dist + konfigurasi nginx ikut ke dalam.
# Tidak ada bind mount di prod — apa yang dites = apa yang jalan.
FROM node:22-alpine AS build
WORKDIR /app

# Layer dependensi dipisah: selama package-lock.json tidak berubah, npm ci
# tidak diulang walau source berubah.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# tsc -b && vite build. Type error menggagalkan build, jadi image yang lolos
# berarti lolos type-check.
RUN npm run build

FROM nginx:1.31-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
