# Bloodhound Network
Análisis forense de su red.

## 📡 WiFi Server Forensics (Suite Dual Forense)
Este proyecto despliega un laboratorio de red y auditoría forense avanzado. Opera bajo dos modalidades distintas:
1. **Modo Sensor (Rogue AP)**: Levanta un Punto de Acceso WiFi falso para atraer víctimas y analizar su tráfico.
2. **Modo Red Local (Bridge Transparente)**: Se sitúa de forma invisible (Capa 2) entre dos redes (ej. un módem y un router) para capturar absolutamente todo el tráfico de una casa o empresa sin alterar la red original ni hacer Spoofing.

En ambos modos, el sistema extrae telemetría y muestra un análisis pericial detallado en tiempo real mediante un Dashboard Web.

## 🏗️ La Arquitectura Técnica (El Software)
El sistema esta orquestada por Docker:

### 1. El Control Central (En la Raíz del Proyecto)
- **`start_sensor_*.sh` y `start_redlocal_*.sh`**: Son los scripts de arranque rápido según la modalidad y arquitectura (32 o 64 bits) que necesites. Automáticamente navegarán a la carpeta correcta y encenderán los contenedores sin complicaciones.
- **`setup_redlocal_64.sh`**: Script de aprovisionamiento automatizado (Bare-Metal). Instala Docker, detecta tus tarjetas físicas para armar un puente transparente (`br0`), y sella el firewall UFW permitiendo solo SSH y la web. ¡Ideal para despliegues limpios en tu hipervisor o servidores nuevos!
- **El archivo `.env`**: Es el panel de control único. Si deseas cambiar el nombre del WiFi trampa, contraseñas, o la interfaz pasiva (`L_IFACE`), lo haces aquí. Todos los contenedores de ambas versiones leen esta configuración global.

### 2. Infraestructura Desacoplada (La Carpeta Docker)
Para garantizar una arquitectura limpia, todos los Dockerfiles y archivos de `docker-compose` viven separados del código fuente de la app (`app/`), organizados por modo y arquitectura:
- **`sensor-64/` y `sensor-32/`**: Entorno completo del Rogue AP. Requieren hardware de antena WiFi física.
- **`redlocal-64/`**: Entorno del Bridge Transparente. Utiliza un contenedor Sniffer ultra ligero que inyecta datos al Backend.

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

## 🛠️ Aprovisionamiento Bare-Metal (El Paso Cero)
El sistema ha sido diseñado para ser **Plug & Play**. No necesitas instalar Docker, configurar ruteos ni descargar librerías manualmente. 

**[ADVERTENCIA CRÍTICA DE SISTEMA OPERATIVO]**
> Los instaladores bare-metal están diseñados de forma nativa **SOLO** para distribuciones basadas en Debian y Ubuntu (y sus derivadas de ciberseguridad como Kali Linux o ParrotOS). Poseen un bloqueo duro de arquitectura: si intentas correrlos en Arch Linux, CentOS o RedHat, el sistema abortará para proteger tu máquina.

### Asistentes de Instalación Automática
Solo toma un servidor Debian/Ubuntu virgen, abre una terminal en la raíz del proyecto y ejecuta el Orquestador Maestro:

`sudo ./bloodhound.sh`

El asistente te pedirá seleccionar tu idioma y te mostrará el menú principal. Selecciona **1) Instalar Suite**, y luego elige tu modalidad:
1. **Modo Red Local (Bridge Transparente)**: Te guiará para seleccionar tus tarjetas físicas, configurará el puente (`br0`), sellará el firewall (UFW) y preparará Docker. ¡Ideal para Servidores Físicos y Máquinas Virtuales (Hypervisors)!
2. **Modo Sensor (Rogue AP)**: *Requiere una antena WiFi física*. Desbloqueará tu antena a nivel hardware (RFKill), evadirá los bloqueos de NetworkManager, habilitará el ruteo (NAT) y auto-completará tu archivo `.env`.

*Nota Oculta: La instalación inyectará capacidades nativas de Appliance. Configurará auto-parcheo de vulnerabilidades diario (`unattended-upgrades`), guardará logs en `/var/log/bloodhound_setup.log` y creará un demonio `systemd` para que el sistema auto-arranque solo si se va la luz.*

*Recomendación: Al finalizar cualquier instalación, el sistema pedirá un reinicio. ¡Acéptalo para aplicar los cambios del kernel y redes!*

---

## 🚀 Flujo de Trabajo y Despliegue Diario

Una vez que tu servidor haya sido aprovisionado y reiniciado, el uso diario es trivial gracias al auto-arranque nativo. Sin embargo, si necesitas gestionar el sistema manualmente:

1. **Configura tu entorno (Opcional)**:
   - El script de setup ya completó la configuración por ti, pero puedes editar el archivo `.env` en la raíz del proyecto en cualquier momento si deseas cambiar contraseñas, o activar logs para desarrolladores (`ENABLE_DEBUG_LOGS=true`).
2. **Control de Contenedores**:
   - Abre una terminal en la raíz del proyecto.
   - Ejecuta de nuevo el Orquestador Maestro: `./bloodhound.sh`.
   - Selecciona **2) Encender Suite** o **3) Detener Suite** según necesites. Automáticamente detendrá contenedores fantasmas y levantará tu suite forense.
3. **Accede al Dashboard**:
   - Abre tu navegador web y entra a `https://localhost` (o la IP remota de tu Servidor/Máquina Virtual). 
   - Tu navegador te advertirá sobre un "Certificado Autofirmado", simplemente dale a "Avanzado" -> "Continuar". Verás la interfaz forense cargada con un candado SSL cifrado.
4. **Comportamiento del Hardware**:
   - En Modo Sensor, si algo falla con la antena, el contenedor `sensor` se reiniciará en bucle de protección, pero el Dashboard seguirá activo para que leas los logs.
5. **Ver Logs**:
   - Para ver qué está pasando por debajo, entra a la carpeta activa (ej. `cd docker/sensor-64`) y ejecuta `docker-compose logs -f`.
