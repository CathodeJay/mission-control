FROM node:22-slim

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Build Next.js
RUN npm run build

ENV NODE_ENV=production
ENV MISSION_CONTROL_PORT=3100

EXPOSE 3100

CMD ["npm", "run", "start"]
