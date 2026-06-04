# ⚠️ Manual de Lectura de Alertas

Cuando observes el tráfico en el panel `Vulnerabilidades / Alertas`, el Radar de Malware inyectará etiquetas visuales. Este es el glosario completo:

---

## 🔴 Nivel Crítico (Rojo Parpadeante)

| Etiqueta Visual | ¿Qué significa que aparezca esto en tu red? |
| :--- | :--- |
| `⚠️ TROYANO/C2` | Alguien en la red está ejecutando un troyano de acceso remoto o un backdoor. El dispositivo está llamando a puertos de comando de Metasploit, Cobalt Strike o similares (ej. 4444, 4433, 1337). |
| `🧟 BOTNET IoT` | Una Cámara, Smart TV o Foco Inteligente de la casa ha sido infectado (Ej. Mirai Botnet) y está enviando ataques masivos hacia internet usando puertos vulnerables (2323, 1900). |
| `⛏️ CRYPTOMINERO` | Malware oculto robando la energía y procesador de una computadora o celular para minar criptomonedas. |
| `⚠️ DNS SECUESTRADO` | Un dispositivo tiene un virus que cambió sus configuraciones DNS. Si la víctima entra a la web de su banco, será redirigida silenciosamente a una página clonada falsa para robarle la contraseña. |
| `🎣 PHISHING/DARKWEB` | Un dispositivo intentó resolver un dominio `.onion` (Tor/DarkWeb) o una URL falsa conocida por robar credenciales. |
| `🕵️ ESCANEO NMAP` | Un atacante silencioso está enviando paquetes malformados (XMAS/NULL) para escanear y descubrir qué dispositivos y puertos están abiertos en tu red sin ser detectado. |

---

## 🟠 Nivel Advertencia (Naranja)

| Etiqueta Visual | ¿Qué significa que aparezca esto en tu red? |
| :--- | :--- |
| `🔓 TEXTO PLANO` | Alguien está usando FTP, Telnet o HTTP sin cifrar. Sus contraseñas, correos o sesiones acaban de viajar totalmente visibles por el aire. |
| `👁️ RASTREO/ADWARE` | Un televisor o celular está enviando telemetría abusiva a servidores de publicidad o rastreo silencioso en segundo plano. |
| `🔎 ESCANEO LOCAL (ARP)` | Un equipo infectado en tu red doméstica está usando ráfagas ARP para buscar a qué otras computadoras y celulares de tu casa puede propagarse. |
| `📦 EXFILTRACIÓN` | Tráfico sospechosamente pesado hacia internet. Posible indicio de que se están robando bases de datos masivas hacia la nube. |
| `SYN-SCAN` | Escaneo de puertos ruidoso. Un programa está intentando conectarse a miles de puertos por segundo de forma agresiva. |

---

## ⚪ Nivel Info / Debug (Gris)

| Etiqueta Visual | ¿Qué significa que aparezca esto en tu red? |
| :--- | :--- |
| `CNN` / `HTTP-404` | Monitoreo general de comportamiento. (Ej. Tráfico hacia la web CNN o errores de navegación normales). |
