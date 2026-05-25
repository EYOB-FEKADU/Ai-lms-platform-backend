FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Use npm install instead of npm ci (doesn't require lock file)
RUN npm install && npm install -D nodemon

COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

CMD ["node", "--max-old-space-size=256", "src/server.js"]