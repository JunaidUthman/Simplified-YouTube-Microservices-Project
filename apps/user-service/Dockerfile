FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --frozen-lockfile || npm install

# Copy application source
COPY . .

# Build application
RUN npm run build || true

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
