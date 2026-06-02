#!/bin/bash
# Script de instalación de Docker exclusivo para arquitecturas 32 bits (i386)
# Ya que Docker CE oficial no soporta i386, instalamos la versión nativa de los repositorios de Debian.

if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta este script como root (usando sudo)"
  exit 1
fi

echo "[*] Actualizando repositorios..."
apt-get update -y

echo "[*] Instalando docker.io y docker-compose nativos de Debian (Soporte i386)..."
apt-get install -y docker.io docker-compose

echo "[*] Habilitando y arrancando el servicio de Docker..."
systemctl enable --now docker

echo "[*] Verificando instalación..."
docker --version
docker-compose --version

echo "[*] Añadiendo al usuario actual al grupo docker..."
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
    echo "    Usuario '$SUDO_USER' añadido al grupo docker. Deberás reiniciar tu sesión para que los cambios tengan efecto."
else
    echo "    Script ejecutado directamente como root. Se recomienda configurar 'usermod -aG docker <tu_usuario>' si no quieres usar root siempre."
fi

echo "[+] Instalación de Docker 32-Bits finalizada con éxito."
