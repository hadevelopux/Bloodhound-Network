#!/bin/bash

# Script de arranque centralizado para la versión de 64 bits
echo "[+] Iniciando entorno WiFi Server Forensics (64-bit)..."

# Cambiar al directorio correspondiente sin importar desde dónde se llame el script
cd "$(dirname "$0")/../docker/sensor-64" || { echo "Error: No se encontró el directorio sensor-64"; exit 1; }

# Detener contenedores sin eliminarlos (para conservar logs)
echo "[+] Deteniendo contenedores en ejecución..."
docker-compose stop

# Levantar contenedores
echo "[+] Levantando contenedores..."
docker-compose up -d --build

echo ""
echo "[+] Servicio de 64 bits iniciado con éxito."
echo "[+] Accede al Dashboard Forense seguro en: https://localhost"
