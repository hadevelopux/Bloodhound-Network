#!/bin/bash

echo "[+] Sniffer RedLocal (Bridge Transparente) Iniciando..."

if [ -z "$L_IFACE" ]; then
    echo "[-] ERROR: L_IFACE no está definida en .env"
    echo "[-] Configurando L_IFACE=br0 por defecto"
    L_IFACE="br0"
fi

# Esperar a que la interfaz exista
echo "[*] Esperando a que la interfaz $L_IFACE esté disponible..."
while ! ip link show "$L_IFACE" > /dev/null 2>&1; do
    sleep 1
done
echo "[+] Interfaz $L_IFACE detectada."

# Configurar tubería FIFO
PIPE="/tmp_pipes/wifi_pipe"
if [ ! -p "$PIPE" ]; then
    echo "[*] Creando tubería en $PIPE..."
    mkfifo "$PIPE"
    chmod 600 "$PIPE"
fi

echo "[+] Iniciando TShark en modo pasivo sobre $L_IFACE..."
# Ejecutamos tshark en modo promiscuo (-p no es necesario ya que es por defecto, pero podemos forzar)
# Usamos stdbuf para evitar buffering y enviamos el JSON (ek) a la tubería
stdbuf -oL tshark -i "$L_IFACE" -T ek -l > "$PIPE" 2>&1
