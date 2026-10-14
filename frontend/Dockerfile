FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json tsconfig*.json vite.config.ts index.html ./
RUN npm ci

COPY src ./src
COPY public ./public

# Production bundle compilation
RUN npm run build

# Stage 2: High-performance Nginx production web server
FROM nginx:alpine

# Copy custom Nginx configuration supporting SPA routing and backend proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
