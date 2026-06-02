# Bloodhound Network
Análisis forense de su red.

## 📡 WiFi Server Forensics (Arquitectura Dockerizada)
Este proyecto despliega un laboratorio de red y auditoría forense avanzado. Su objetivo es levantar un Punto de Acceso WiFi falso ([Rogue AP](https://en.wikipedia.org/wiki/Rogue_access_point)), capturar todo el tráfico de los clientes o víctimas y muestra un análisis pericial detallado en tiempo real mediante un Dashboard Web.

## 🏗️ La Arquitectura Técnica (El Software)
El sistema esta orquestada por Docker:

### 1. El Control Central (En la Raíz del Proyecto)
- **`start_64.sh` y `start_32.sh`**: Son los scripts de arranque rápido. Dependiendo de si estás en tu máquina potente o en hardware viejo, abres una terminal en la raíz y ejecutas el script correspondiente. Automáticamente navegarán a la carpeta correcta y encenderán los contenedores sin complicaciones.
- **El archivo `.env`**: Es el panel de control único de la red. Si deseas cambiar el nombre del WiFi trampa ([SSID](https://en.wikipedia.org/wiki/Service_set_(802.11_network))), la clave, la red local o las IPs, lo haces aquí. Al estar en la raíz, los contenedores de ambas versiones (`sensor-64` y `sensor-32`) leen esta configuración global de forma heredada.

### 2. Soporte Multi-Arquitectura (La Carpeta Docker)
Para garantizar compatibilidad absoluta sin estropear el código, el motor está empaquetado en dos entornos dentro de `docker/`:
- **`sensor-64/`**: Toda la estructura preparada para procesadores modernos (64 bits).
- **`sensor-32/`**: Un "laboratorio independiente" preparado para hardware antiguo (i386), lo que permite compilaciones de bajo nivel.

### 3. El Código Fuente
El código está completamente centralizado y sigue el principio DRY dentro de `app/`:
- **`app/sensor/`**: Scripts bash para levantar el AP, aislar a las víctimas y capturar tráfico hacia el [FIFO](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)).
- **`app/backend/`**: Servidor Node.js que procesa la tubería [FIFO](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)) con `[TShark](https://en.wikipedia.org/wiki/Wireshark)`, genera alertas JSON y almacena en SQLite.
- **`app/frontend/`**: Dashboard web que recibe la telemetría por WebSockets en tiempo real.

### 4. El Flujo de Trabajo (Cuando lo Enciendes)
1. **La Trampa WiFi (`sensor`)**: Levanta una antena virtual con `hostapd`. Aísla a las víctimas para que no vean la red real mediante `iptables` y captura todos sus movimientos crudos con `tcpdump`, enviándolos a una tubería [FIFO](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)) (`/tmp_pipes/wifi_pipe`) compartida en un volumen de Docker.
2. **El Motor Heurístico y Radar de Malware (`auditor-backend`)**: Este servidor Node.js se queda escuchando el otro extremo de la tubería. No solo extrae IPs y puertos usando [TShark](https://en.wikipedia.org/wiki/Wireshark), sino que incluye un **Sistema de Detección de Intrusos (IDS) Pasivo**. Analiza las banderas TCP y los puertos para cazar firmas de cibercriminales en tiempo real (Troyanos C2, Phishing, Escaneos Nmap y Fugas de Texto Plano), empaquetando esta inteligencia forense en formato JSON para inyectarla a la web. Todo soportado por una base de datos SQLite optimizada en modo WAL con colas de inserción (Batching) para soportar miles de paquetes por segundo sin colapsar la memoria.
3. **El Centro de Visualización (`auditor-frontend`)**: Te sirve un dashboard web local cifrada en `https://localhost`. Es un panel futurista con temática forense. Aquí la telemetría llega en vivo y cuenta con una **Jerarquía Visual de Amenazas**: los ataques críticos estallan en alertas de color rojo sangre parpadeante, mientras que el tráfico no cifrado se marca en ámbar/naranja, permitiéndote cazar incidentes con un solo vistazo a la tabla en vivo.

### ⚠️ Manual de Lectura de Alertas (Dashboard)
Cuando estés observando el tráfico en el panel `Vulnerabilidades / Alertas`, el Radar de Malware inyectará etiquetas visuales. Aquí tienes el glosario de lo que significa cada una:

| Etiqueta Visual | Nivel de Riesgo | ¿Qué significa que aparezca esto en tu red? |
| :--- | :--- | :--- |
| `⚠️ TROYANO/C2` | 🔴 **Crítico (Rojo Parpadeante)** | Alguien en la red está ejecutando un troyano de acceso remoto o un backdoor. El dispositivo está llamando a puertos de comando de Metasploit, Cobalt Strike o similares (ej. 4444, 4433, 1337). |
| `🧟 BOTNET IoT` | 🔴 **Crítico (Rojo Parpadeante)** | Una Cámara, Smart TV o Foco Inteligente de la casa ha sido infectado (Ej. Mirai Botnet) y está enviando ataques masivos hacia internet usando puertos vulnerables (2323, 1900). |
| `⛏️ CRYPTOMINERO` | 🔴 **Crítico (Rojo Parpadeante)** | Malware oculto robando la energía y procesador de una computadora o celular para minar criptomonedas hacia Rusia/China. |
| `⚠️ DNS SECUESTRADO` | 🔴 **Crítico (Rojo Parpadeante)** | Un dispositivo tiene un virus que cambió sus configuraciones DNS. Si la víctima entra a la web de su banco, será redirigida silenciosamente a una página clonada falsa para robarle la contraseña. |
| `🎣 PHISHING/DARKWEB` | 🔴 **Crítico (Rojo Parpadeante)** | Un dispositivo intentó resolver un dominio `.onion` (Tor/DarkWeb) o una URL falsa conocida por robar credenciales. |
| `🕵️ ESCANEO NMAP` | 🔴 **Crítico (Rojo Parpadeante)** | Un atacante silencioso (posiblemente con Kali Linux) está enviando paquetes malformados (XMAS/NULL) para escanear y descubrir qué dispositivos y puertos están abiertos en tu red sin ser detectado. |
| `🔓 TEXTO PLANO` | 🟠 **Advertencia (Naranja)** | Alguien está usando FTP, Telnet o HTTP sin cifrar. Sus contraseñas, correos o sesiones acaban de viajar totalmente visibles por el aire. Cualquiera pudo leerlas. |
| `👁️ RASTREO/ADWARE` | 🟠 **Advertencia (Naranja)** | Un televisor o celular está enviando telemetría abusiva a servidores de publicidad o rastreo silencioso en segundo plano. |
| `🔎 ESCANEO LOCAL (ARP)` | 🟠 **Advertencia (Naranja)** | Un equipo infectado en tu red doméstica está usando ráfagas ARP para buscar a qué otras computadoras y celulares de tu casa puede propagarse. |
| `📦 EXFILTRACIÓN` | 🟠 **Advertencia (Naranja)** | Tráfico sospechosamente pesado hacia internet. Posible indicio de que se están robando bases de datos masivas hacia la nube. |
| `SYN-SCAN` | 🟠 **Advertencia (Naranja)** | Escaneo de puertos ruidoso. Un programa está intentando conectarse a miles de puertos por segundo de forma agresiva. |
| `CNN` / `HTTP-404` | ⚪ **Info / Debug (Gris)** | Monitoreo general de comportamiento. (Ej. Tráfico hacia la web CNN o errores de navegación normales). |

---

## 🛠️ Requisitos Previos (Lo que necesitas instalar)
Para que toda esta arquitectura funcione en tu máquina (ya sea de 64 o 32 bits), el sistema anfitrión **solo necesita** tener instalado lo siguiente:

1. **Docker Engine y Compose**: Para ejecutar los contenedores. 
   - *Si usas 64 bits (PC Moderna)*: `curl -sSL "https://get.docker.com/" | bash`
   - *Si usas 32 bits (i386)*: Ejecuta `sudo ./install_docker_32.sh` desde la raíz de este proyecto.
   - *Verificación*: Ejecuta `docker-compose --version` o `docker compose version`.
3. **Hardware de Red Físico**: Una tarjeta de red WiFi física que soporte el "Modo Master/AP" (Access Point). **Esto es obligatorio para el contenedor Sensor**.

*Nota: Docker se encarga de contener todas esas dependencias de forma aislada.*

---

## 🚀 Cómo Desplegar y Probar (Uso Básico)

1. **Configura tu entorno**:
   - Edita el archivo `.env` en la raíz del proyecto para definir tu tarjeta de red (ej. `W_IFACE=wlp3s0b1`), el nombre de la red falsa (`WIFI_SSID`) y contraseñas.
   - **Logs y Trazabilidad**: El archivo `.env` incluye la variable `ENABLE_DEBUG_LOGS=false`. Por defecto tu consola estará limpia e impecable. Si eres desarrollador y necesitas cazar bugs o rastrear el flujo exacto de los paquetes, cámbiala a `true` para ver toda la telemetría en la consola.
2. **Inicia los Contenedores**:
   - Abre una terminal en la raíz del proyecto.
   - Ejecuta `./start_64.sh` (para PCs modernos) o `./start_32.sh` (para equipos antiguos como i386).
3. **Accede al Dashboard**:
   - Abre tu navegador web y entra a `https://localhost`. (Tu navegador te advertirá sobre un "Certificado Autofirmado", simplemente dale a "Avanzado" -> "Continuar"). Verás la interfaz forense cargada con un candado SSL.
4. **Pruebas Locales (Advertencia de Hardware)**:
   - *Nota de Hardware*: El contenedor `sensor` requiere obligatoriamente una antena WiFi física y libre para usar `hostapd`. Si pruebas esto localmente en una máquina que no tiene una tarjeta WiFi disponible (o está en uso), el contenedor `sensor` fallará y se reiniciará constantemente. **Esto es normal**; a pesar del fallo en la antena, el Panel Web y el servidor de análisis (Auditor) seguirán funcionando para que puedas interactuar con la interfaz en `https://localhost`.
5. **Ver Logs**:
   - Para ver qué está pasando por debajo, entra a la carpeta activa (ej. `cd docker/sensor-64`) y ejecuta `docker-compose logs -f`.
