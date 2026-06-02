#!/bin/bash

# Garantizar que las rutas binarias estándar estén disponibles
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

# Cargar el archivo de idioma si se proporciona
if [ -n "$1" ] && [ -f "$1" ]; then
    source "$1"
else
    source "$(dirname "$0")/lang/en.txt"
fi

echo -e "${YELLOW}${START_SCRIPT_TITLE} (64-bit)...${NC}"

# Cambiar al directorio correspondiente sin importar desde dónde se llame el script
cd "$(dirname "$0")/../docker/sensor-64" || { echo "Error: No se encontró el directorio sensor-64"; exit 1; }

# Detener contenedores sin eliminarlos (para conservar logs)
echo -e "${YELLOW}${START_SCRIPT_STOPPING}${NC}"
docker compose stop

# Levantar contenedores
echo -e "${YELLOW}${START_SCRIPT_STARTING}${NC}"
docker compose up -d --build

echo ""
echo -e "${GREEN}${START_SCRIPT_DONE}${NC}"
echo -e "${GREEN}${START_SCRIPT_DASHBOARD}${NC}"
echo ""
echo -e "${BLUE}${START_SCRIPT_DOCKER_STATUS}${NC}"
docker compose ps
echo ""
echo -e "${BLUE}${START_SCRIPT_DOCKER_STATS}${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}"
