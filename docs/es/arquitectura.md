# 🏗️ Arquitectura Técnica

El sistema está orquestado por Docker y se compone de tres capas bien definidas.

---

## 1. El Control Central (Raíz del Proyecto)

- **`start_sensor_*.sh` y `start_redlocal_*.sh`**: Scripts de arranque rápido según la modalidad y arquitectura (32 o 64 bits). Automáticamente navegan a la carpeta correcta y encienden los contenedores.
- **`setup_redlocal_64.sh`**: Script de aprovisionamiento automatizado (Bare-Metal). Instala Docker, detecta tus tarjetas físicas para armar un puente transparente (`br0`), y sella el firewall UFW permitiendo solo SSH y la web.
- **El archivo `.env`**: Panel de control único. Si deseas cambiar el nombre del WiFi trampa, contraseñas, o la interfaz pasiva (`L_IFACE`), se hace aquí. Todos los contenedores de ambas versiones leen esta configuración global.

---

## 2. Infraestructura Desacoplada (Carpeta `docker/`)

Todos los Dockerfiles y archivos `docker-compose` viven separados del código fuente (`app/`), organizados por modo y arquitectura:

- **`sensor-64/` y `sensor-32/`**: Entorno completo del Rogue AP. Requieren hardware de antena WiFi física.
- **`redlocal-64/`**: Entorno del Bridge Transparente. Utiliza un contenedor Sniffer ultra ligero que inyecta datos al Backend.

---

## 3. El Código Fuente (`app/`)

El código está completamente centralizado y sigue el principio DRY:

- **`app/sensor/`**: Scripts bash para levantar el AP, aislar a las víctimas y capturar tráfico hacia el [FIFO](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)).
- **`app/backend/`**: Servidor Node.js que procesa la tubería FIFO con TShark, genera alertas JSON y almacena en SQLite.
- **`app/frontend/`**: Dashboard web que recibe la telemetría por WebSockets en tiempo real.

---

## 4. El Flujo de Trabajo (Cuando lo Enciendes)

1. **La Trampa WiFi (`sensor`)**: Levanta una antena virtual con `hostapd`. Aísla a las víctimas mediante `iptables` y captura todos sus movimientos crudos con `tcpdump`, enviándolos a una tubería FIFO (`/tmp_pipes/wifi_pipe`) compartida en un volumen Docker.

2. **El Motor Heurístico (`auditor-backend`)**: Servidor Node.js que escucha el otro extremo de la tubería. Extrae IPs y puertos con TShark e incluye un **Sistema de Detección de Intrusos (IDS) Pasivo** que analiza banderas TCP y puertos para cazar firmas de cibercriminales en tiempo real (Troyanos C2, Phishing, Escaneos Nmap, Fugas de Texto Plano). Soportado por SQLite en modo WAL con colas de inserción (Batching) para soportar miles de paquetes por segundo.

3. **El Centro de Visualización (`auditor-frontend`)**: Sirve el dashboard en `https://localhost`. Panel forense con **Jerarquía Visual de Amenazas**: ataques críticos en rojo sangre parpadeante, tráfico no cifrado en ámbar/naranja.
