#!/bin/bash

# ==============================================================================
# ORQUESTADOR MAESTRO - BLOODHOUND NETWORK
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOCALES_DIR="$DIR/setup/lang"

# ------------------------------------------------------------------------------
# 1. SELECCIÓN DE IDIOMA
# ------------------------------------------------------------------------------
if [ ! -d "$LOCALES_DIR" ]; then
    echo -e "${RED}[ERROR] Directorio de idiomas ($LOCALES_DIR) no encontrado.${NC}"
    exit 1
fi

clear
echo -e "${BLUE}================================================================${NC}"
echo " Available Languages / Idiomas Disponibles:"
echo -e "${BLUE}================================================================${NC}"

locale_files=("$LOCALES_DIR"/*.txt)
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

source "$SELECTED_FILE"

pause_menu() {
    echo ""
    echo -e "${YELLOW}${MENU_PAUSE_PROMPT}${NC}"
    read -p ""
}

# ------------------------------------------------------------------------------
# 2. FUNCIONES DE SUB-MENÚS
# ------------------------------------------------------------------------------

menu_install() {
    while true; do
        clear
        echo -e "${BLUE}================================================================${NC}"
        echo -e "${YELLOW}      ${MENU_INSTALL_TITLE}         ${NC}"
        echo -e "${BLUE}================================================================${NC}"
        echo " 1) $MENU_INSTALL_OPT_1"
        echo " 2) $MENU_INSTALL_OPT_2"
        echo " 3) $MENU_INSTALL_OPT_4"
        echo -e "${BLUE}================================================================${NC}"
        read -p "${MENU_PROMPT}" OPT
        
        case $OPT in
            1) sudo bash "$DIR/setup/setup_redlocal_64.sh" "$SELECTED_FILE"; pause_menu; break ;;
            2) sudo bash "$DIR/setup/setup_sensor_64.sh" "$SELECTED_FILE"; pause_menu; break ;;
            3) break ;;
            *) echo -e "${RED}Invalid option.${NC}"; sleep 1 ;;
        esac
    done
}

menu_start() {
    while true; do
        clear
        echo -e "${BLUE}================================================================${NC}"
        echo -e "${YELLOW}      ${MENU_START_TITLE}         ${NC}"
        echo -e "${BLUE}================================================================${NC}"
        echo " 1) $MENU_START_OPT_1"
        echo " 2) $MENU_START_OPT_2"
        echo " 3) $MENU_START_OPT_4"
        echo -e "${BLUE}================================================================${NC}"
        read -p "${MENU_PROMPT}" OPT
        
        case $OPT in
            1) bash "$DIR/setup/start_redlocal_64.sh" "$SELECTED_FILE"; pause_menu; break ;;
            2) bash "$DIR/setup/start_sensor_64.sh" "$SELECTED_FILE"; pause_menu; break ;;
            3) break ;;
            *) echo -e "${RED}Invalid option.${NC}"; sleep 1 ;;
        esac
    done
}

menu_stop() {
    while true; do
        clear
        echo -e "${BLUE}================================================================${NC}"
        echo -e "${YELLOW}      ${MENU_STOP_TITLE}         ${NC}"
        echo -e "${BLUE}================================================================${NC}"
        echo " 1) $MENU_START_OPT_1"
        echo " 2) $MENU_START_OPT_2"
        echo " 3) $MENU_START_OPT_4"
        echo -e "${BLUE}================================================================${NC}"
        read -p "${MENU_PROMPT}" OPT
        
        case $OPT in
            1) echo -e "${YELLOW}${MENU_STOP_MSG}${NC}"; cd "$DIR/docker/redlocal-64" && docker compose stop; pause_menu; break ;;
            2) echo -e "${YELLOW}${MENU_STOP_MSG}${NC}"; cd "$DIR/docker/sensor-64" && docker compose stop; pause_menu; break ;;
            3) break ;;
            *) echo -e "${RED}Invalid option.${NC}"; sleep 1 ;;
        esac
    done
}

# ------------------------------------------------------------------------------
# 3. DETECCIÓN DE INSTALACIÓN
# ------------------------------------------------------------------------------
ACTIVE_MODE="NONE"
detect_installation() {
    if [ -f "/etc/systemd/system/bloodhound-redlocal.service" ]; then
        ACTIVE_MODE="REDLOCAL64"
    elif [ -f "/etc/systemd/system/bloodhound-sensor.service" ]; then
        ACTIVE_MODE="SENSOR64"
    else
        ACTIVE_MODE="NONE"
    fi
}

# ------------------------------------------------------------------------------
# 4. BUCLE PRINCIPAL (MAIN LOOP)
# ------------------------------------------------------------------------------

while true; do
    detect_installation
    clear
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${GREEN}      ${MENU_TITLE}         ${NC}"
    
    if [ "$ACTIVE_MODE" = "NONE" ]; then
        echo -e "${YELLOW}      ${MENU_NOT_INSTALLED}         ${NC}"
        echo -e "${BLUE}================================================================${NC}"
        echo " 1) $MENU_OPTION_1"
        echo " 2) $MENU_OPTION_4"
        echo -e "${BLUE}================================================================${NC}"
        read -p "${MENU_PROMPT}" MAIN_OPT
        
        case $MAIN_OPT in
            1) menu_install ;;
            2) echo -e "${GREEN}Bye!${NC}"; exit 0 ;;
            *) echo -e "${RED}Invalid option.${NC}"; sleep 1 ;;
        esac
    else
        case "$ACTIVE_MODE" in
            REDLOCAL64) MODE_NAME="Red Local (64-bit)" ;;
            SENSOR64) MODE_NAME="Sensor (64-bit)" ;;
        esac
        
        echo -e "${YELLOW}      ${MENU_ACTIVE_MODE} ${MODE_NAME}         ${NC}"
        echo -e "${BLUE}================================================================${NC}"
        echo " 1) $MENU_DYN_START"
        echo " 2) $MENU_DYN_STOP"
        echo " 3) $MENU_DYN_REINSTALL"
        echo " 4) $MENU_OPTION_4"
        echo -e "${BLUE}================================================================${NC}"
        read -p "${MENU_PROMPT}" MAIN_OPT
        
        case $MAIN_OPT in
            1) 
                case "$ACTIVE_MODE" in
                    REDLOCAL64) bash "$DIR/setup/start_redlocal_64.sh" "$SELECTED_FILE"; pause_menu ;;
                    SENSOR64) bash "$DIR/setup/start_sensor_64.sh" "$SELECTED_FILE"; pause_menu ;;
                esac
                ;;
            2) 
                case "$ACTIVE_MODE" in
                    REDLOCAL64) echo -e "${YELLOW}${MENU_STOP_MSG}${NC}"; cd "$DIR/docker/redlocal-64" && docker compose stop; pause_menu ;;
                    SENSOR64) echo -e "${YELLOW}${MENU_STOP_MSG}${NC}"; cd "$DIR/docker/sensor-64" && docker compose stop; pause_menu ;;
                esac
                ;;
            3) menu_install ;;
            4) echo -e "${GREEN}Bye!${NC}"; exit 0 ;;
            *) echo -e "${RED}Invalid option.${NC}"; sleep 1 ;;
        esac
    fi
done
