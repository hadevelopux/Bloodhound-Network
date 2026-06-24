# 🛠️ Aprovisionamiento Bare-Metal

El sistema ha sido diseñado para ser **Plug & Play**. No necesitas instalar Docker, configurar ruteos ni descargar librerías manualmente.

---

## ⚠️ Sistemas Operativos Compatibles

> Los instaladores bare-metal están diseñados de forma nativa **SOLO** para distribuciones basadas en Debian y Ubuntu (y sus derivadas de ciberseguridad como Kali Linux o ParrotOS). Poseen un bloqueo duro de arquitectura: si intentas correrlos en Arch Linux, CentOS o RedHat, el sistema abortará para proteger tu máquina.

---

## Instrucciones de Instalación

Toma un servidor Debian/Ubuntu virgen, abre una terminal en la raíz del proyecto y ejecuta el Orquestador Maestro:

```bash
sudo ./bloodhound.sh
```

El asistente te pedirá seleccionar tu idioma y mostrará el menú principal. Selecciona **1) Instalar Suite**, y luego elige tu modalidad:

1. **Modo Red Local (Bridge Transparente)**: Guiará para seleccionar tus tarjetas físicas, configurará el puente (`br0`), sellará el firewall (UFW) y preparará Docker.
2. **Modo Sensor (Rogue AP)**: *Requiere una antena WiFi física*. Desbloqueará tu antena a nivel hardware (RFKill), evadirá los bloqueos de NetworkManager, habilitará el ruteo (NAT) y auto-completará tu archivo `.env`.

---

## 🔧 Lo que el Instalador Hace por Ti

Al completar la instalación, el sistema habrá:

- Instalado Docker Engine oficial desde `get.docker.com`
- Configurado auto-parcheo de vulnerabilidades diario (`unattended-upgrades`)
- Guardado logs de instalación en `/var/log/bloodhound_setup.log`
- Creado un demonio `systemd` para auto-arranque si se va la luz

> **Importante:** Al finalizar cualquier instalación, el sistema pedirá un reinicio. Acéptalo para aplicar los cambios del kernel y redes.
