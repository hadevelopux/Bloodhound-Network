#!/bin/bash

# Configuración del Laboratorio desde variables de entorno (.env)
C_IFACE="$C_IFACE"
W_IFACE="$W_IFACE"           
LAB_IP="$LAB_IP"       
LAB_RANGE="$LAB_RANGE"
SSID="$WIFI_SSID"
PASS="$WIFI_PASSWORD"
DNS_LAB="$DNS_LAB"
PIPE_PATH="/tmp_pipes/wifi_pipe"
ROUTER_CASA="$ROUTER_CASA"

echo "[+] Limpiando sistema y procesos..."
killall hostapd dnsmasq tcpdump wpa_supplicant 2>/dev/null || true
ip addr flush dev $W_IFACE 2>/dev/null || true
rfkill unblock wifi 2>/dev/null || true

echo "[+] Preparando hardware inalámbrico ($W_IFACE)..."
ip link set $W_IFACE up
ip addr add $LAB_IP/24 dev $W_IFACE

echo "[+] Configurando enrutamiento y NAT..."
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -o $C_IFACE -j MASQUERADE

# 1. Aislamiento Estricto de LAN (Bloquear escaneos de víctimas hacia redes RFC1918)
iptables -I FORWARD -s 192.168.100.0/24 -d 192.168.0.0/16 -j DROP
iptables -I FORWARD -s 192.168.100.0/24 -d 10.0.0.0/8 -j DROP
iptables -I FORWARD -s 192.168.100.0/24 -d 172.16.0.0/12 -j DROP

# Bloqueos explícitos de puertas de enlace reales (definidos en .env)
# Permite pasar múltiples IPs separadas por coma, ej: 192.168.1.1,192.168.0.1
IFS=',' read -ra ROUTERS <<< "$ROUTER_CASA"
for IP in "${ROUTERS[@]}"; do
    IP=$(echo "$IP" | xargs) # Limpiar espacios en blanco si los hubiera
    if [ ! -z "$IP" ]; then
        iptables -I FORWARD -s 192.168.100.0/24 -d "$IP" -j DROP
    fi
done

# 2. Protección del SENSOR (Permitir solo DNS y DHCP a las víctimas, bloquear el resto)
iptables -I INPUT -i $W_IFACE -j DROP
iptables -I INPUT -i $W_IFACE -p udp --dport 53 -j ACCEPT
iptables -I INPUT -i $W_IFACE -p udp --dport 67:68 -j ACCEPT

echo "[+] Iniciando servidor DHCP (dnsmasq)..."
cat <<EOF > /tmp/dnsmasq_lab.conf
interface=$W_IFACE
port=0
listen-address=$LAB_IP
bind-dynamic
dhcp-range=$LAB_RANGE,12h
dhcp-option=3,$LAB_IP
dhcp-option=6,$DNS_LAB
dhcp-leasefile=/tmp/dnsmasq.leases
EOF
dnsmasq -C /tmp/dnsmasq_lab.conf

echo "[+] Levantando Punto de Acceso Rogue AP (hostapd)..."
cat <<EOF > /tmp/hostapd_lab.conf
interface=$W_IFACE
driver=nl80211
ssid=$SSID
hw_mode=g
channel=6
wpa=2
wpa_passphrase=$PASS
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
EOF

# Iniciar hostapd en background
hostapd -B /tmp/hostapd_lab.conf
sleep 2

# Esperar a que la FIFO sea creada por el auditor, o crearla si no existe
if [ ! -p "$PIPE_PATH" ]; then
    echo "[!] La tubería FIFO no existe, creándola..."
    mkfifo "$PIPE_PATH"
    chmod 600 "$PIPE_PATH"
fi

echo "[+] Iniciando captura tcpdump hacia FIFO..."
# Evitamos que tcpdump se bloquee si no hay lector abriendo un fd
exec 3<> "$PIPE_PATH"
exec tcpdump -l -i $W_IFACE -U -s 0 -w - > "$PIPE_PATH"
