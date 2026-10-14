FROM node:20-alpine

WORKDIR /app

# Install curl for reliable container health checking
RUN apk add --no-cache curl

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:5000/health || exit 1

CMD ["npx", "tsx", "src/server.ts"]
