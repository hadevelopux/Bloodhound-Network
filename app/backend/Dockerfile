FROM node:20-trixie-slim

RUN apt-get update && apt-get install -y \
    tshark \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

COPY . .

COPY start_auditor.sh /start_auditor.sh
RUN chmod +x /start_auditor.sh

CMD ["/start_auditor.sh"]
