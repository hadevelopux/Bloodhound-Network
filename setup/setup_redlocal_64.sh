#!/bin/bash

# ==============================================================================
# SCRIPT DE APROVISIONAMIENTO AUTOMÁTICO BARE-METAL - MODO RED LOCAL (64-BIT)
# AUTO-PROVISIONING BARE-METAL SCRIPT - LOCAL NETWORK MODE (64-BIT)
# ==============================================================================
# PROPOSITO: 
# Este script prepara un sistema Debian/Ubuntu completamente virgen para operar
# como un Nodo Forense en Modo Bridge Transparente (Capa 2).
# 
# ARQUITECTURA:
# - Instala dependencias base (Docker, UFW, Bridge-utils, Tshark).
# - Vincula físicamente dos tarjetas de red independientes en un único 
#   puente (br0) invisible al tráfico.
# - Endurece el sistema operativo cerrando todos los puertos excepto 
#   aquellos necesarios para la administración (SSH) y el Dashboard (HTTP/S).
# - Utiliza internacionalización (i18n) cargando diccionarios de la carpeta locales/.
# ==============================================================================

# ------------------------------------------------------------------------------
# DEFINICIÓN DE COLORES
# Se definen códigos ANSI para estilizar la salida en consola, mejorando la 
# experiencia del usuario (UX) al leer las advertencias y confirmaciones.
# ------------------------------------------------------------------------------
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color (Resetea el formato)

# ------------------------------------------------------------------------------
# MÓDULO DE INTERNACIONALIZACIÓN (CARGA DINÁMICA DE IDIOMAS)
# Este bloque garantiza que el sistema sea 100% escalable. En lugar de tener
# textos "hardcodeados", busca archivos .txt dentro de la carpeta /locales/
# y los muestra como opciones. Si mañana se agrega fr.txt (Francés), aparecerá
# automáticamente en el menú.
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
echo -e "${BLUE}      ${SETUP_REDLOCAL_TITLE}         ${NC}"


# ------------------------------------------------------------------------------
# FASE 1: VERIFICACIÓN DE PRIVILEGIOS Y SEGURIDAD
# La configuración de redes, firewalls y dependencias requiere permisos de 
# súper-usuario. Si el script no se corre con sudo, fallará. Aquí lo prevenimos.
# ------------------------------------------------------------------------------
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}${SETUP_REDLOCAL_ROOT_ERR}${NC}"
  exit 1
fi

echo -e "${GREEN}${SETUP_REDLOCAL_ROOT_OK}${NC}"

# ------------------------------------------------------------------------------
# FASE 2: ACTUALIZACIÓN E INSTALACIÓN DE DEPENDENCIAS CORE
# Preparamos el servidor instalando los motores fundamentales:
# - bridge-utils: Librería de Linux para crear el puente br0.
# - ufw: Firewall amigable para endurecer puertos.
# - docker.io / docker-compose: Orquestación de nuestros contenedores.
# - tcpdump / tshark: Herramientas de análisis de paquetes requeridas para Sniffing.
# ------------------------------------------------------------------------------
# 2. ACTUALIZACIÓN, DEPENDENCIAS Y AUTO-PARCHEO (UNATTENDED-UPGRADES)
echo -e "${GREEN}${SETUP_REDLOCAL_DEPS}${NC}"
apt-get update -y
apt-get install -y docker.io docker-compose ufw bridge-utils curl git unattended-upgrades update-notifier-common

echo -e "${GREEN}[+] Configurando actualizaciones de seguridad automáticas...${NC}"
cat <<EOF > /etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable unattended-upgrades >/dev/null 2>&1
systemctl start unattended-upgrades >/dev/null 2>&1
apt-get install -y tcpdump tshark

# Habilitar el demonio de Docker para que arranque junto con el servidor
systemctl enable docker
systemctl start docker

# Añadir al usuario actual al grupo docker para evitar el uso constante de sudo
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
fi

# ------------------------------------------------------------------------------
# FASE 3: DETECCIÓN Y CONFIGURACIÓN DEL BRIDGE TRANSPARENTE (CAPA 2)
# Esta es la fase crítica de la arquitectura. Linux debe "fusionar" dos tarjetas 
# de red físicas para permitir que el tráfico pase de un cable a otro (Ej: Modem 
# a Router TP-Link) mientras nuestro Sniffer pasivo escucha silenciosamente.
# ------------------------------------------------------------------------------
echo -e "${BLUE}================================================================${NC}"
echo -e "${YELLOW}${SETUP_REDLOCAL_NET_TITLE}${NC}"
echo "${SETUP_REDLOCAL_NET_INFO}"
echo "${SETUP_REDLOCAL_NET_DETECT}"

# Listar de forma bonita (brief) todas las tarjetas de red, excluyendo localhost (lo)
ip -br link show | awk '{print $1}' | grep -v "lo"
echo ""

# Solicitar al usuario los nombres exactos de sus tarjetas físicas
read -p "${SETUP_REDLOCAL_PROMPT_IF1}" IFACE1
IFACE1=${IFACE1:-ens18} # Valor por defecto ens18 si el usuario presiona Enter vacío

read -p "${SETUP_REDLOCAL_PROMPT_IF2}" IFACE2
IFACE2=${IFACE2:-ens19}

echo -e "${GREEN}${SETUP_REDLOCAL_NET_BACKUP}${NC}"
# Respaldamos la configuración actual de la red de Debian por seguridad
cp /etc/network/interfaces /etc/network/interfaces.backup_$(date +%s)

echo -e "${GREEN}${SETUP_REDLOCAL_NET_CREATING} ${IFACE1} & ${IFACE2}...${NC}"

# Escribir la nueva topología de red en el archivo principal de Debian.
# IMPORTANTE: Desactivamos STP y fijamos el retardo (Forward Delay - fd) en 0 
# para que el puente sea instantáneo y no haya micro-cortes de internet.
cat <<EOF > /etc/network/interfaces
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

source /etc/network/interfaces.d/*

# Interfaz Loopback (Crítica para procesos locales)
auto lo
iface lo inet loopback

# Interfaces físicas (Sin IP propia, atadas al puente)
# No se les asigna IP porque trabajarán en Capa 2 (Mac Addresses puras)
auto $IFACE1
iface $IFACE1 inet manual

auto $IFACE2
iface $IFACE2 inet manual

# Puente Transparente (br0)
# Esta será la nueva tarjeta de red lógica. Reemplazará a ens18/ens19
auto br0
iface br0 inet dhcp
    bridge_ports $IFACE1 $IFACE2
    bridge_stp off
    bridge_fd 0
    bridge_maxwait 0
EOF

# ------------------------------------------------------------------------------
# FASE 4: CONFIGURACIÓN DEL FIREWALL (ENDURECIMIENTO BARE-METAL)
# Aisla completamente la máquina virtual/servidor de escaneos o ataques
# directos. Bloquea todo el acceso no solicitado y abre solo agujeros
# quirúrgicos para operar la suite forense.
# ------------------------------------------------------------------------------
echo -e "${BLUE}================================================================${NC}"
echo -e "${YELLOW}${SETUP_REDLOCAL_FW_TITLE}${NC}"

# Reiniciar UFW a estado por defecto (Borra reglas viejas)
ufw --force reset >/dev/null

# Políticas estrictas: Todo lo que entra (IN) se bloquea. Todo lo que sale (OUT) se permite.
ufw default deny incoming
ufw default allow outgoing

# Abrir exclusivamente puertos requeridos:
# - Puerto 22: Esencial para conectar por SSH y administrar el servidor anfitrión.
# - Puertos 80/443: Necesarios para servir el Dashboard Frontend a otras PCs en casa.
ufw allow 22/tcp comment "${SETUP_REDLOCAL_FW_SSH}"
ufw allow 80/tcp comment "${SETUP_REDLOCAL_FW_HTTP}"
ufw allow 443/tcp comment "${SETUP_REDLOCAL_FW_HTTPS}"

# Activar el firewall y forzar inicio sin preguntar
ufw --force enable

echo -e "${GREEN}${SETUP_REDLOCAL_FW_OK}${NC}"

# ------------------------------------------------------------------------------
# FASE 5: INYECCIÓN DEL DEMONIO (AUTO-ARRANQUE)
# ------------------------------------------------------------------------------
echo -e "${GREEN}[+] Generando demonio Systemd para auto-arranque...${NC}"
cat <<EOF > /etc/systemd/system/bloodhound-redlocal.service
[Unit]
Description=Bloodhound Network - Red Local Bridge
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DIR/..
ExecStart=/bin/bash $DIR/setup/start_redlocal_64.sh
ExecStop=/usr/local/bin/docker-compose -f $DIR/../docker/redlocal-64/docker-compose.yml stop

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable bloodhound-redlocal.service >/dev/null 2>&1

# ------------------------------------------------------------------------------
# FASE 6: FINALIZACIÓN Y REINICIO
# Aplica los cambios de red y puente lógico haciendo reboot.
# ------------------------------------------------------------------------------
echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}${SETUP_REDLOCAL_DONE_TITLE}${NC}"
echo "${SETUP_REDLOCAL_DONE_1}"
echo -e "${RED}${SETUP_REDLOCAL_DONE_2}${NC}"
echo "${SETUP_REDLOCAL_DONE_3}"
echo -e "${BLUE}================================================================${NC}"

read -p "${SETUP_REDLOCAL_PROMPT_REBOOT}" REBOOT_CONFIRM

# Expresión regular que acepta "s" (Sí) o "y" (Yes) en mayúscula o minúscula
if [[ "$REBOOT_CONFIRM" =~ ^[sSyY]$ ]]; then
    echo -e "${YELLOW}${SETUP_REDLOCAL_REBOOTING}${NC}"
    sleep 3
    reboot
else
    echo -e "${YELLOW}${SETUP_REDLOCAL_NO_REBOOT}${NC}"
fi
