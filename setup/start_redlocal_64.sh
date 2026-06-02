#!/bin/bash

# Script de arranque para el Modo Red Local (Bridge Transparente) - 64 bits
echo "[+] Iniciando entorno WiFi Server Forensics (Modo Red Local Pasivo 64-bit)..."

# Cambiar al directorio correspondiente sin importar desde dónde se llame el script
cd "$(dirname "$0")/../docker/redlocal-64" || { echo "Error: No se encontró el directorio redlocal-64"; exit 1; }

# Detener contenedores sin eliminarlos
echo "[+] Deteniendo contenedores en ejecución..."
docker-compose stop

# Levantar contenedores
echo "[+] Levantando Modo Red Local..."
docker-compose up -d --build

echo ""
echo "[+] Sniffer Pasivo (64 bits) iniciado con éxito."
echo "[+] Accede al Dashboard Forense seguro en: https://localhost"
