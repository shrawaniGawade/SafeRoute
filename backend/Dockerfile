FROM node:20-alpine

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["npx", "tsx", "src/server.ts"]
