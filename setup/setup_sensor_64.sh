#!/bin/bash

# ==============================================================================
# SCRIPT DE APROVISIONAMIENTO AUTOMÁTICO BARE-METAL - MODO SENSOR (ROGUE AP)
# AUTO-PROVISIONING BARE-METAL SCRIPT - SENSOR MODE (ROGUE AP)
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ------------------------------------------------------------------------------
# MÓDULO DE INTERNACIONALIZACIÓN Y RUTAS
# ------------------------------------------------------------------------------
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOCALES_DIR="$DIR/lang"
ENV_FILE="$DIR/../.env"

# ------------------------------------------------------------------------------
# AUDITORÍA DE INSTALACIÓN (LOGGING)
# ------------------------------------------------------------------------------
exec > >(tee -a /var/log/bloodhound_setup.log) 2>&1
echo "[$(date)] Iniciando Setup..."

# ------------------------------------------------------------------------------
# BLOQUEO DE SISTEMA OPERATIVO
# ------------------------------------------------------------------------------
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" != "debian" && "$ID" != "ubuntu" && "$ID" != "kali" && "$ID" != "parrot" ]]; then
        echo -e "${RED}[ERROR CRÍTICO] Este sistema fue diseñado estrictamente para arquitecturas Debian/Ubuntu.${NC}"
        echo -e "${RED}El uso de 'apt', 'systemd' y 'ufw' romperá sistemas como $NAME. Abortando instalación.${NC}"
        exit 1
    fi
else
    echo -e "${RED}[ERROR] No se pudo verificar el sistema operativo. Abortando.${NC}"
    exit 1
fi

if [ ! -d "$LOCALES_DIR" ]; then
    echo -e "${RED}[ERROR] Directorio de idiomas ($LOCALES_DIR) no encontrado.${NC}"
    exit 1
fi

if [ -n "$1" ] && [ -f "$1" ]; then
    SELECTED_FILE="$1"
else
    clear
    echo -e "${BLUE}================================================================${NC}"
    echo " Available Languages / Idiomas Disponibles:"
    echo -e "${BLUE}================================================================${NC}"

    locale_files=("$LOCALES_DIR"/*.txt)
    if [ ${#locale_files[@]} -eq 0 ] || [ ! -f "${locale_files[0]}" ]; then
        echo -e "${RED}[ERROR] No .txt files found in $LOCALES_DIR.${NC}"
        exit 1
    fi

    for i in "${!locale_files[@]}"; do
        filename=$(basename "${locale_files[$i]}" .txt)
        echo " $((i+1))) $filename"
    done

    echo -e "${BLUE}================================================================${NC}"
    read -p " Option: " LANG_OPT

    if [[ "$LANG_OPT" =~ ^[0-9]+$ ]] && [ "$LANG_OPT" -gt 0 ] && [ "$LANG_OPT" -le "${#locale_files[@]}" ]; then
        SELECTED_FILE="${locale_files[$((LANG_OPT-1))]}"
    else
        echo " Invalid option, defaulting to the first available language."
        SELECTED_FILE="${locale_files[0]}"
    fi
fi

source "$SELECTED_FILE"

clear
echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}      ${SETUP_SENSOR_TITLE}         ${NC}"
echo -e "${BLUE}================================================================${NC}"

# 1. VERIFICACIÓN DE PRIVILEGIOS
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}${SETUP_SENSOR_ROOT_ERR}${NC}"
  exit 1
fi

echo -e "${GREEN}${SETUP_SENSOR_ROOT_OK}${NC}"

# 2. ACTUALIZACIÓN E INSTALACIÓN DE DEPENDENCIAS Y AUTO-PARCHEO
echo -e "${GREEN}${SETUP_SENSOR_DEPS}${NC}"
apt-get update -y
apt-get install -y ufw docker.io docker-compose-v2 git curl rfkill tcpdump tshark unattended-upgrades apt-config-auto-update

echo -e "${GREEN}[+] Configurando actualizaciones de seguridad automáticas...${NC}"
cat <<EOF > /etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable unattended-upgrades >/dev/null 2>&1
systemctl start unattended-upgrades >/dev/null 2>&1

systemctl enable docker
systemctl start docker

# Añadir al usuario actual al grupo docker para evitar el uso constante de sudo
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
fi

# 3. DETECCIÓN DE INTERFACES
echo -e "${BLUE}================================================================${NC}"
echo -e "${YELLOW}${SETUP_SENSOR_NET_TITLE}${NC}"
echo "${SETUP_SENSOR_NET_INFO}"
echo "${SETUP_SENSOR_NET_DETECT}"
ip -br link show | awk '{print $1}' | grep -v "lo"
echo ""

read -p "${SETUP_SENSOR_PROMPT_CABLE}" C_IFACE
C_IFACE=${C_IFACE:-enp0s10}

read -p "${SETUP_SENSOR_PROMPT_WIFI}" W_IFACE
W_IFACE=${W_IFACE:-wlp3s0b1}

# 4. CONFIGURACIÓN DEL SISTEMA (SYSCTL, RFKILL, NETWORKMANAGER)
echo -e "${BLUE}================================================================${NC}"
echo -e "${YELLOW}${SETUP_SENSOR_SYS_TITLE}${NC}"

echo -e "${GREEN}${SETUP_SENSOR_RFKILL}${NC}"
rfkill unblock wifi
rfkill unblock all

echo -e "${GREEN}[+] Activando IP Forwarding en sysctl...${NC}"
# Permite que el núcleo de Linux envíe paquetes de una interfaz a otra (Ruteo Layer 3)
sed -i 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
grep -q -F 'net.ipv4.ip_forward=1' /etc/sysctl.conf || echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
sysctl -p >/dev/null

echo -e "${GREEN}${SETUP_SENSOR_NWMGR}${NC}"
# Evita que NetworkManager tome control de la interfaz WiFi, permitiendo que hostapd en Docker funcione sin colisiones.
mkdir -p /etc/NetworkManager/conf.d
cat <<EOF > /etc/NetworkManager/conf.d/10-ignore-wifi.conf
[keyfile]
unmanaged-devices=interface-name:$W_IFACE
EOF
# Reiniciamos NetworkManager si existe
systemctl restart NetworkManager 2>/dev/null || true

# 5. SINCRONIZACIÓN AUTOMÁTICA DEL .ENV
echo -e "${GREEN}${SETUP_SENSOR_ENV_SYNC}${NC}"
if [ -f "$ENV_FILE" ]; then
    # Reemplazamos los valores antiguos por los ingresados por el usuario
    sed -i "s/^C_IFACE=.*/C_IFACE=$C_IFACE/" "$ENV_FILE"
    sed -i "s/^W_IFACE=.*/W_IFACE=$W_IFACE/" "$ENV_FILE"
    echo -e "${GREEN}[+] Archivo .env actualizado exitosamente.${NC}"
else
    echo -e "${RED}[!] Archivo .env no encontrado en $DIR${NC}"
fi

# 6. CONFIGURACIÓN DEL FIREWALL Y ENRUTAMIENTO (UFW)
echo -e "${BLUE}================================================================${NC}"
echo -e "${YELLOW}${SETUP_SENSOR_FW_TITLE}${NC}"

ufw --force reset >/dev/null

ufw default deny incoming
ufw default allow outgoing

# CRÍTICO PARA EL MODO SENSOR:
# UFW bloquea el tráfico FORWARD por defecto. Si no lo cambiamos a ACCEPT, 
# las víctimas conectadas a la antena WiFi no tendrán salida a internet, 
# incluso si IPTABLES hace NAT.
sed -i 's/DEFAULT_FORWARD_POLICY="DROP"/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw

ufw allow 22/tcp comment "SSH Administrativo"
ufw allow 80/tcp comment "Dashboard Forense HTTP"
ufw allow 443/tcp comment "Dashboard Forense HTTPS"

ufw --force enable

echo -e "${GREEN}${SETUP_SENSOR_FW_OK}${NC}"

# 7. INYECCIÓN DEL DEMONIO (AUTO-ARRANQUE)
echo -e "${GREEN}[+] Generando demonio Systemd para auto-arranque...${NC}"
cat <<EOF > /etc/systemd/system/bloodhound-sensor.service
[Unit]
Description=Bloodhound Network - Sensor Rogue AP
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DIR/..
ExecStart=/bin/bash $DIR/start_sensor_64.sh
ExecStop=/usr/bin/docker compose -f $DIR/../docker/sensor-64/docker-compose.yml stop

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable bloodhound-sensor.service >/dev/null 2>&1

# 8. FINALIZACIÓN Y REINICIO
echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}${SETUP_SENSOR_DONE_TITLE}${NC}"
echo "${SETUP_SENSOR_DONE_1}"
echo -e "${RED}${SETUP_SENSOR_DONE_2}${NC}"
echo -e "${BLUE}================================================================${NC}"

read -p "${SETUP_SENSOR_PROMPT_REBOOT}" REBOOT_CONFIRM

if [[ "$REBOOT_CONFIRM" =~ ^[sSyY]$ ]]; then
    echo -e "${YELLOW}${SETUP_SENSOR_REBOOTING}${NC}"
    sleep 3
    reboot
else
    echo -e "${YELLOW}${SETUP_SENSOR_NO_REBOOT}${NC}"
fi
