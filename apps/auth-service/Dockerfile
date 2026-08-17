FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --frozen-lockfile || npm install

COPY . .

RUN npm run build || true

EXPOSE 3002

CMD ["npm", "run", "start:dev"]
