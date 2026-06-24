FROM debian:trixie-slim

RUN apt-get update && apt-get install -y \
    tshark \
    iproute2 \
    procps \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY sniffer.sh /app/sniffer.sh
RUN chmod +x /app/sniffer.sh

ENTRYPOINT ["/app/sniffer.sh"]
