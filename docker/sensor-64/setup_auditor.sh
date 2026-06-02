#!/bin/bash

# ==========================================================
#                    CONFIGURACIÓN GLOBAL
# ==========================================================
INTERFACE_CABLE="ens19" 
PIPE_PATH="/tmp/wifi_pipe"
LOG_DIR="/root/auditoria_logs"
PCAP_NAME="captura.pcap"

# Configuración de Retención
MAX_FILES=50
FILE_SIZE=102400

# IPs de Red
ROUTER_CASA="192.168.1.1"
ROUTER_ALT="192.168.0.1"

# Colores Matriz
CYAN='\e[36m'
GREEN='\e[32m'
YELLOW='\e[33m'
RED='\e[31m'
PURPLE='\e[35m'
BLUE='\e[34m'
NC='\e[0m'

# Variable para almacenar el filtro seleccionado en el menú
FILTRO_SELECCIONADO=""

# ==========================================================
#                      MENÚ PRINCIPAL
# ==========================================================
mostrar_menu() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}      MENU VM AUDITOR (MODO MATRIZ FORENSE)         ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo "1) INSTALAR (Herramientas Forenses)"
    echo "2) INICIAR  (Inspección Profunda Global 24/7)"
    echo "3) FILTRAR  (Aplicar reglas 'Useful Wireshark Filters')"
    echo "4) LIMPIAR  (Borrar logs y resetear Pipes)"
    echo "5) SALIR"
    echo -e "${BLUE}====================================================${NC}"
    read -p "Seleccione una opción: " OPCION
}

# ==========================================================
#                    SUBMENÚ DE FILTROS
# ==========================================================
menu_filtros() {
    while true; do
        clear
        echo -e "${CYAN}===============================================================================${NC}"
        echo -e "${CYAN}             USEFUL WIRESHARK FILTERS (CHEAT SHEET FORENSE)                    ${NC}"
        echo -e "${CYAN}===============================================================================${NC}"
        echo -e "${YELLOW}--- DIRECCIONAMIENTO IP Y SUBREDES ---${NC}"
        echo " 1) ip.addr == 10.0.0.1                 (Tráfico con IP específica)"
        echo " 2) ip.addr == 10.0.0.0/24              (Tráfico de la subred 10.0.0.0/24)"
        echo " 3) ip.src == 10.0.0.1 && ip.dst == ... (Tráfico de origen a destino)"
        echo " 4) !(ip.addr == 10.0.0.1)              (Excluir tráfico de una IP)"
        echo -e "${YELLOW}--- PUERTOS Y PROTOCOLOS ---${NC}"
        echo " 5) tcp or udp                          (Sólo tráfico TCP o UDP)"
        echo " 6) tcp.port == 80                      (Tráfico TCP por puerto 80)"
        echo " 7) tcp.srcport < 1000                  (Tráfico con puerto origen < 1000)"
        echo " 8) !(tcp or udp)                       (Protocolos inusuales, no TCP/UDP)"
        echo " 9) icmp.type == 3                      (Paquetes ICMP Destination Unreachable)"
        echo "10) !(arp or icmp or stp)               (Filtrar ruido de fondo ARP/ICMP/STP)"
        echo -e "${YELLOW}--- BANDERAS TCP Y RETRANSMISIONES ---${NC}"
        echo "11) tcp.flags.syn == 1                  (Paquetes con bandera SYN activa)"
        echo "12) tcp.flags == 0x012                  (Banderas SYN y ACK establecidas)"
        echo "13) tcp.analysis.retransmission         (Paquetes TCP retransmitidos)"
        echo -e "${YELLOW}--- CAPA DE APLICACIÓN (HTTP, DNS, TLS) ---${NC}"
        echo "14) http or dns                         (Todo el tráfico HTTP o DNS)"
        echo "15) http.request.method == \"GET\"        (Peticiones HTTP GET)"
        echo "16) http.response.code == 404           (Respuestas HTTP 404 Not Found)"
        echo "17) http.host == \"www.test.com\"         (Filtrar por campo Host HTTP)"
        echo "18) tls.handshake                       (Paquetes de negociación TLS)"
        echo "19) tls.handshake.type == 1             (Paquetes Client Hello de TLS)"
        echo "20) dns.qry.name contains \"cnn.com\"     (Consultas DNS hacia cnn.com)"
        echo "21) dns.resp.name contains \"cnn.com\"    (Respuestas DNS desde cnn.com)"
        echo "22) dns.qry.name matches \"\\.xyz\$|\\.club\$\" (Consultas DNS hacia TLDs especificados)"
        echo -e "${YELLOW}--- CAPA DE ENLACE, DHCP Y VLAN ---${NC}"
        echo "23) dhcp and ip.addr == 10.0.0.0/24     (Tráfico DHCP en subred 10.0.0.0/24)"
        echo "24) dhcp.hw.mac_addr == 00:11:22...     (Peticiones DHCP por MAC de cliente)"
        echo "25) eth.addr == 00:11:22:33:44:55       (Tráfico hacia/desde dirección MAC)"
        echo "26) eth[0x47:2] == 01:80                (Coincidencia de bytes en offset Ethernet)"
        echo "27) vlan.id == 100                      (Paquetes con etiqueta VLAN ID 100)"
        echo -e "${YELLOW}--- CONTENIDO Y TAMAÑO ---${NC}"
        echo "28) frame contains \"keyword\"            (Paquetes que contienen la palabra)"
        echo "29) frame.len > 1000                    (Paquetes con longitud > 1000 bytes)"
        echo -e "${CYAN}-------------------------------------------------------------------------------${NC}"
        echo " c) Ingresar un filtro Wireshark PERSONALIZADO libremente"
        echo " v) Volver al menú principal"
        echo -e "${CYAN}===============================================================================${NC}"
        read -p "Seleccione el filtro a aplicar en la inspección en vivo: " OPT_FILTRO
        
        FILTRO_CUSTOM=""
        case $OPT_FILTRO in
            1) FILTRO_CUSTOM="ip.addr == 10.0.0.1" ;;
            2) FILTRO_CUSTOM="ip.addr == 10.0.0.0/24" ;;
            3) FILTRO_CUSTOM="ip.src == 10.0.0.1 && ip.dst == 10.0.0.2" ;;
            4) FILTRO_CUSTOM="!(ip.addr == 10.0.0.1)" ;;
            5) FILTRO_CUSTOM="tcp or udp" ;;
            6) FILTRO_CUSTOM="tcp.port == 80" ;;
            7) FILTRO_CUSTOM="tcp.srcport < 1000" ;;
            8) FILTRO_CUSTOM="!(tcp or udp)" ;;
            9) FILTRO_CUSTOM="icmp.type == 3" ;;
            10) FILTRO_CUSTOM="!(arp or icmp or stp)" ;;
            11) FILTRO_CUSTOM="tcp.flags.syn == 1" ;;
            12) FILTRO_CUSTOM="tcp.flags == 0x012" ;;
            13) FILTRO_CUSTOM="tcp.analysis.retransmission" ;;
            14) FILTRO_CUSTOM="http or dns" ;;
            15) FILTRO_CUSTOM="http.request.method == \"GET\"" ;;
            16) FILTRO_CUSTOM="http.response.code == 404" ;;
            17) FILTRO_CUSTOM="http.host == \"www.test.com\"" ;;
            18) FILTRO_CUSTOM="tls.handshake" ;;
            19) FILTRO_CUSTOM="tls.handshake.type == 1" ;;
            20) FILTRO_CUSTOM="dns.qry.name contains \"cnn.com\"" ;;
            21) FILTRO_CUSTOM="dns.resp.name contains \"cnn.com\"" ;;
            22) FILTRO_CUSTOM="dns.qry.name matches \"\\.xyz\$|\\.club\$\"" ;;
            23) FILTRO_CUSTOM="dhcp and ip.addr == 10.0.0.0/24" ;;
            24) FILTRO_CUSTOM="dhcp.hw.mac_addr == 00:11:22:33:44:55" ;;
            25) FILTRO_CUSTOM="eth.addr == 00:11:22:33:44:55" ;;
            26) FILTRO_CUSTOM="eth[0x47:2] == 01:80" ;;
            27) FILTRO_CUSTOM="vlan.id == 100" ;;
            28) FILTRO_CUSTOM="frame contains \"keyword\"" ;;
            29) FILTRO_CUSTOM="frame.len > 1000" ;;
            c|C) 
                echo ""
                read -p "Ingrese la sintaxis del filtro Wireshark (ej. tcp.port == 443): " FILTRO_CUSTOM
                ;;
            v|V) return ;;
            *) echo "Opción no válida."; sleep 1; continue ;;
        esac
        
        if [ -n "$FILTRO_CUSTOM" ]; then
            echo -e "[+] Iniciando captura con filtro: ${YELLOW}$FILTRO_CUSTOM${NC}"
            sleep 1
            FILTRO_SELECCIONADO="$FILTRO_CUSTOM"
            iniciar
            return
        fi
    done
}

# ==========================================================
#                    FUNCIONES DE APOYO
# ==========================================================
instalar() {
    echo "[+] Instalando TShark y SSH Server..."
    apt update && apt install tshark ssh -y
    echo "[+] Instalación completada."
    read -p "Presione Enter para volver..."
}

limpiar_auditoria() {
    echo "[+] Deteniendo procesos de captura..."
    exec 3>&- 4>&- 5>&- 2>/dev/null
    killall tshark tee cat 2>/dev/null
    rm -f $PIPE_PATH /tmp/wifi_pcap /tmp/wifi_live 2>/dev/null
    read -p "¿Desea borrar TODOS los logs guardados (.pcap)? (s/n): " CONFIRM
    if [ "$CONFIRM" = "s" ]; then
        rm -rf $LOG_DIR/*.pcap
        echo "[+] Logs eliminados."
    fi
    echo "[+] Limpieza terminada."
    sleep 2
}

iniciar() {
    # 1. Limpieza y creación de sub-tuberías (Solución estricta a BUG-001)
    exec 3>&- 4>&- 5>&- 2>/dev/null
    killall tshark cat tee 2>/dev/null
    rm -f $PIPE_PATH /tmp/wifi_pcap /tmp/wifi_live 2>/dev/null
    mkdir -p $LOG_DIR
    
    PIPE_IN="$PIPE_PATH"
    PIPE_PCAP="/tmp/wifi_pcap"
    PIPE_LIVE="/tmp/wifi_live"
    
    mkfifo "$PIPE_IN" "$PIPE_PCAP" "$PIPE_LIVE"
    chmod 777 "$PIPE_IN"

    # Preparar archivo de log de seguridad aislado
    ALERT_LOG="$LOG_DIR/alertas_seguridad.log"
    touch "$ALERT_LOG"

    # Abrir descriptores de lectura/escritura para mantener vivas las FIFOs pase lo que pase
    exec 3<> "$PIPE_IN"
    exec 4<> "$PIPE_PCAP"
    exec 5<> "$PIPE_LIVE"

    # 2. Grabación PCAP consumiendo de la FIFO secundaria dedicada
    tshark -i "$PIPE_PCAP" -b filesize:$FILE_SIZE -b files:$MAX_FILES -w "$LOG_DIR/$PCAP_NAME" > /dev/null 2>&1 &
    
    clear
    echo -e "${BLUE}=======================================================================================================${NC}"
    if [ -n "$FILTRO_SELECCIONADO" ]; then
        echo -e "${BLUE}  VM AUDITOR: INSPECCIÓN PROFUNDA | FILTRO ACTIVO: ${YELLOW}$FILTRO_SELECCIONADO${NC}"
    else
        echo -e "${BLUE}  VM AUDITOR: INSPECCIÓN PROFUNDA GLOBAL (MATRIZ 24/7)${NC}"
    fi
    echo -e "${BLUE}  PRESIONE [CTRL+C] PARA VOLVER AL MENU PRINCIPAL${NC}"
    echo -e "${CYAN}  [*] Nota: Si no ve tráfico de inmediato, navegue en la víctima para activar la auto-reconexión.${NC}"
    echo -e "${YELLOW}-------------------------------------------------------------------------------------------------------${NC}"
    printf "${YELLOW}%-8s %-15s %-6s %-15s %-6s %-8s %-6s %s${NC}\n" "TIME" "SOURCE" "PORT" "DEST" "PORT" "PROTO" "SIZE" "INFO"
    echo -e "${YELLOW}-------------------------------------------------------------------------------------------------------${NC}"

    # 3. Lanzar bifurcador de flujo en segundo plano (tee)
    tee "$PIPE_PCAP" < "$PIPE_IN" > "$PIPE_LIVE" &
    PID_TEE=$!

    # Preparar argumentos opcionales de filtrado Wireshark nativo
    TSHARK_ARGS=()
    if [ -n "$FILTRO_SELECCIONADO" ]; then
        TSHARK_ARGS+=("-Y" "$FILTRO_SELECCIONADO")
    fi

    # 4. TSHARK ORIGINAL consumiendo de la FIFO en vivo dedicada
    # Se añadió tls.handshake.extensions_server_name para rescatar los dominios HTTPS
    cat "$PIPE_LIVE" | stdbuf -oL tshark -l -n -r - "${TSHARK_ARGS[@]}" \
    -T fields -E separator='|' \
    -e frame.time_relative \
    -e ip.src \
    -e ip.dst \
    -e tcp.srcport \
    -e udp.srcport \
    -e tcp.dstport \
    -e udp.dstport \
    -e _ws.col.Protocol \
    -e frame.len \
    -e tcp.flags.syn \
    -e tcp.flags.ack \
    -e tcp.flags.reset \
    -e tcp.flags \
    -e tcp.analysis.retransmission \
    -e http.request.method \
    -e http.response.code \
    -e http.host \
    -e tls.handshake.type \
    -e tls.handshake.extensions_server_name \
    -e dhcp.hw.mac_addr \
    -e dns.qry.name \
    -e dns.resp.name \
    -e icmp.type \
    -e vlan.id \
    -e eth.src \
    -e eth.dst \
    -e _ws.col.Info 2>/dev/null | grep --line-buffered -vE "ARP|ICMPv6|LLMNR|STP" | while IFS='|' read -r time ip_src ip_dst tcp_sport udp_sport tcp_dport udp_dport proto len tcp_syn tcp_ack tcp_rst tcp_flags tcp_retrans http_method http_code http_host tls_hstype tls_sni dhcp_mac dns_qry dns_resp icmp_type vlan_id eth_src eth_dst info; do

        # Consolidar origen y destino (IP o MAC si no hay IP)
        src="${ip_src:-$eth_src}"
        dst="${ip_dst:-$eth_dst}"
        sport="${tcp_sport:-$udp_sport}"
        dport="${tcp_dport:-$udp_dport}"

        [ -z "$src" ] && continue
        [ -z "$proto" ] && proto="UNKN"
        [ -z "$sport" ] && sport="-"
        [ -z "$dport" ] && dport="-"

        ALERT=""
        ALERT_TXT=""
        
        # --- EXTRACCIÓN VISUAL DEL DOMINIO ---
        DOMAIN_STR=""
        if [ -n "$http_host" ]; then DOMAIN_STR="${CYAN}[$http_host]${NC} "
        elif [ -n "$tls_sni" ]; then DOMAIN_STR="${CYAN}[$tls_sni]${NC} "
        elif [ -n "$dns_qry" ]; then DOMAIN_STR="${CYAN}[$dns_qry]${NC} "
        fi
        
        # --- EVALUACIÓN PROGRAMÁTICA FORENSE DE TUS REGLAS ORIGINALES ---
        
        # Banderas TCP y Retransmisiones
        if [ "$tcp_syn" == "1" ] && [ "$tcp_ack" != "1" ]; then
            ALERT+="${RED}[SYN]${NC} "
            ALERT_TXT+="SYN-WAIT "
        elif [ "$tcp_syn" == "1" ] && [ "$tcp_ack" == "1" ]; then
            ALERT+="${GREEN}[SYN-ACK]${NC} "
        elif [ "$tcp_rst" == "1" ]; then
            ALERT+="${YELLOW}[RST]${NC} "
            ALERT_TXT+="RST "
        fi
        
        if [ -n "$tcp_retrans" ]; then
            ALERT+="${YELLOW}[RETRANS]${NC} "
            ALERT_TXT+="RETRANS "
        fi
        
        # Capa de Aplicación: HTTP
        if [ "$http_method" == "GET" ]; then
            ALERT+="${GREEN}[HTTP-GET]${NC} "
        fi
        
        if [ "$http_code" == "404" ]; then
            ALERT+="${PURPLE}[HTTP-404]${NC} "
            ALERT_TXT+="HTTP-404 "
        fi
        
        if [ -n "$http_host" ] && [ "$http_host" == "www.test.com" ]; then
            ALERT+="${PURPLE}[HOST-TEST]${NC} "
            ALERT_TXT+="HOST-TEST "
        fi
        
        # Capa de Aplicación: TLS
        if [ "$tls_hstype" == "1" ]; then
            ALERT+="${PURPLE}[TLS-ClientHello]${NC} "
        elif [[ "$proto" == *"TLS"* || "$proto" == *"SSL"* ]] && [[ "$info" == *"Handshake"* ]]; then
            ALERT+="${PURPLE}[TLS-Handshake]${NC} "
        fi
        
        # Capa de Aplicación: DNS
        if [ -n "$dns_qry" ]; then
            if [[ "$dns_qry" == *"cnn.com"* ]]; then
                ALERT+="${CYAN}[DNS-QRY-CNN]${NC} "
                ALERT_TXT+="DNS-CNN "
            elif [[ "$dns_qry" =~ \.(xyz|club)$ ]]; then
                ALERT+="${CYAN}[DNS-SUSP-TLD]${NC} "
                ALERT_TXT+="SUSP-TLD "
            fi
        fi

        if [ -n "$dns_resp" ] && [[ "$dns_resp" == *"cnn.com"* ]]; then
            ALERT+="${CYAN}[DNS-RESP-CNN]${NC} "
        fi
        
        # Capa de Enlace, DHCP, ICMP y VLAN
        if [ -n "$dhcp_mac" ]; then
            ALERT+="${BLUE}[DHCP]${NC} "
        fi
        
        if [ "$icmp_type" == "3" ]; then
            ALERT+="${RED}[ICMP-UNREACH]${NC} "
            ALERT_TXT+="ICMP-UNREACH "
        fi
        
        if [ -n "$vlan_id" ] && [ "$vlan_id" == "100" ]; then
            ALERT+="${BLUE}[VLAN-100]${NC} "
        fi
        
        # Tamaño y anomalías de protocolo
        if [ -n "$len" ] && [ "$len" -gt 1000 ] 2>/dev/null; then
            ALERT+="${RED}[LEN>1000]${NC} "
            ALERT_TXT+="LEN>1000 "
        fi
        
        if [ -n "$ip_src" ] && [ -z "$tcp_sport" ] && [ -z "$udp_sport" ] && [[ "$proto" != *"ICMP"* ]]; then
            ALERT+="${PURPLE}[UNUSUAL-PROTO]${NC} "
            ALERT_TXT+="UNUSUAL-PROTO "
        fi
        
        # Subredes específicas de las reglas
        if [[ "$ip_src" == "10.0."* || "$ip_dst" == "10.0."* ]]; then
            ALERT+="${CYAN}[SUBNET-10]${NC} "
            ALERT_TXT+="SUBNET-10 "
        fi
        
        # Búsqueda de keyword genérica
        if [[ "$info" == *"keyword"* ]]; then
            ALERT+="${YELLOW}[KEYWORD]${NC} "
            ALERT_TXT+="KEYWORD "
        fi

        # Reglas críticas de Ciberseguridad preexistentes
        INFO_UPPER=$(echo "$info" | tr '[:lower:]' '[:upper:]')
        if [[ "$INFO_UPPER" =~ (SELECT|UNION|INSERT|DROP|\<SCRIPT|ALERT\(|%27|%22|%3C) ]]; then
            ALERT+="${RED}[INJECT]${NC} "
            ALERT_TXT+="INJECT "
        fi
        
        if [[ "$dst" == "$ROUTER_CASA" || "$dport" == "4444" || "$dport" == "6666" ]]; then
            ALERT+="${RED}[CRITICAL]${NC} "
            ALERT_TXT+="CRITICAL "
        fi

        # Colorización por Protocolo
        case $proto in
            "HTTP") COLOR=$GREEN ;;
            "DNS")  COLOR=$CYAN ;;
            "TCP")  COLOR=$YELLOW ;;
            "UDP")  COLOR=$BLUE ;;
            "TLS"*|"SSL"*|"HTTPS") COLOR=$PURPLE ;;
            "ICMP"*) COLOR=$RED ;;
            *)      COLOR=$NC ;;
        esac

        # -> GUARDADO EN EL LOG DE SEGURIDAD <-
        ALERT_TXT=$(echo "$ALERT_TXT" | xargs)
        if [[ -n "$ALERT_TXT" ]]; then
            FECHA=$(date '+%Y-%m-%d %H:%M:%S')
            DOM_LOG=""
            [ -n "$http_host" ] && DOM_LOG=" | DOM: $http_host"
            [ -n "$tls_sni" ] && DOM_LOG=" | DOM: $tls_sni"
            [ -n "$dns_qry" ] && DOM_LOG=" | DOM: $dns_qry"
            
            echo "[$FECHA] | IP: $src:$sport -> $dst:$dport | PROTO: $proto | TIPO: [$ALERT_TXT]${DOM_LOG} | INFO: $info" >> "$ALERT_LOG"
        fi

        # Imprimir la Matriz con el dominio extraído al frente de los TAGS
        printf "%-8s %-15s %-6s %-15s %-6s ${COLOR}%-8s${NC} %-6s %b\n" \
               "$time" "$src" "$sport" "$dst" "$dport" "$proto" "$len" "${DOMAIN_STR}${ALERT}${info}"
    done
}

# ==========================================================
#                     BUCLE DE EJECUCIÓN
# ==========================================================
while true; do
    mostrar_menu
    case $OPCION in
        1) instalar ;;
        2) 
            FILTRO_SELECCIONADO=""
            iniciar 
            ;;
        3) menu_filtros ;;
        4) limpiar_auditoria ;;
        5) 
            exec 3>&- 4>&- 5>&- 2>/dev/null
            exit 0 
            ;;
        *) echo "Opción no válida."; sleep 1 ;;
    esac
done