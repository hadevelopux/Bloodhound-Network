#!/bin/bash

# ==============================================================================
# AUDITOR FORENSE: BIFURCADOR DE FLUJO Y GRABADOR DE PCAP (RING BUFFER)
# Implementación de la solución BUG-001 (Wireshark Agent)
# ==============================================================================

PIPE_IN="/tmp_pipes/wifi_pipe"
PIPE_LIVE="/tmp_pipes/wifi_live"
LOG_DIR="/logs"
PCAP_NAME="capture.pcap"

echo "[*] Esperando a que el Sensor inicie la tubería principal ($PIPE_IN)..."
while [ ! -p "$PIPE_IN" ]; do
    sleep 2
done

echo "[+] Tubería principal detectada. Configurando bifurcación de flujos..."

# Limpieza de tuberías secundarias
rm -f "$PIPE_LIVE" 2>/dev/null

# Creación de la sub-tubería para Node.js
mkfifo "$PIPE_LIVE"
chmod 600 "$PIPE_LIVE"

# Lanzar TShark para grabación de evidencia cruda (PCAP Ring Buffer)
# Límite: 50MB por archivo, reteniendo máximo 10 archivos (500MB totales)
echo "[+] Iniciando grabación forense de PCAP en $LOG_DIR..."
# tshark con `-i -` lee de stdin. Pero tshark NO soporta `-b` leyendo desde pipe stdin.
# Para evitar el bloqueo de "Ring buffer requested, but capture isn't being saved...",
# la mejor forma para FIFOs es que tcpdump o tshark traten el FIFO como interfaz,
# pero OJO: tshark -i /tmp_pipes/wifi_pipe bloquea la lectura si no es un device real.
# Sin embargo, usar tcpdump con rotación o split podría funcionar.
# Afortunadamente, tcpdump sí soporta leer del pipe con -r e ignorar el límite, 
# pero no: `tcpdump -r` ignora -C (rotación) si es pipe.
# La solución real es leer la FIFO con un demonio C, pero como estamos en BASH,
# simplemente guardaremos 1 solo PCAP rotado manualmente, o dejaremos tcpdump escribiendo sin -C.
# En lugar de pelear con las limitantes de libpcap, usaremos la solución exacta recomendada en wireshark.md:
# mkfifo wifi_pcap; tshark -i wifi_pcap -b ...
# tshark con libpcap >= 1.5.3 PERMITE -i a una FIFO y aplicar -b. 

PIPE_PCAP="/tmp_pipes/wifi_pcap"
rm -f "$PIPE_PCAP" 2>/dev/null
mkfifo "$PIPE_PCAP"
chmod 600 "$PIPE_PCAP"

# Grabador de PCAP (Consumidor 1)
tshark -i "$PIPE_PCAP" -b filesize:50000 -b files:10 -w "$LOG_DIR/$PCAP_NAME" > /dev/null 2>&1 &

# Bifurcador Tee (Distribuye a Grabador y a Node.js)
echo "[+] Iniciando Tee para clonar el flujo a PCAP y Node.js..."
tee "$PIPE_PCAP" < "$PIPE_IN" > "$PIPE_LIVE" &

# Finalmente, iniciar el servidor Node.js que consumirá de PIPE_LIVE
echo "[+] Iniciando Backend Auditor (Node.js)..."
export TARGET_PIPE="$PIPE_LIVE"
exec node server.js
