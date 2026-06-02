FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    tcpdump \
    dnsmasq \
    hostapd \
    iptables \
    iproute2 \
    iw \
    rfkill \
    && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
