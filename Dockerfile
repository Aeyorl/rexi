# Build and Run Container for Rexi Production
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build frontend
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV NETWORK_MODE=mainnet

COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend and backend code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/services/deployments.js ./src/services/deployments.js

EXPOSE 4000

CMD ["node", "server/index.mjs"]
