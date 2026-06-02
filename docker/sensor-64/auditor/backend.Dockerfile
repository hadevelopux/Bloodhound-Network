FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y \
    tshark \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "server.js"]
