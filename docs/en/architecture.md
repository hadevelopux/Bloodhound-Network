# 🏗️ Technical Architecture

The system is orchestrated by Docker and is composed of three well-defined layers.

---

## 1. Central Control (Project Root)

- **`start_sensor_*.sh` and `start_redlocal_*.sh`**: Quick start scripts depending on the modality and architecture (32 or 64 bits). They automatically navigate to the correct folder and turn on the containers.
- **`setup_redlocal_64.sh`**: Automated provisioning script (Bare-Metal). It installs Docker, detects your physical network cards to build a transparent bridge (`br0`), and seals the UFW firewall allowing only SSH and web access.
- **The `.env` file**: Single control panel. If you wish to change the honeypot WiFi name, passwords, or the passive interface (`L_IFACE`), it's done here. All containers in both versions read this global configuration.

---

## 2. Decoupled Infrastructure (`docker/` folder)

All Dockerfiles and `docker-compose` files live separated from the source code (`app/`), organized by mode and architecture:

- **`sensor-64/` and `sensor-32/`**: Complete Rogue AP environment. They require physical WiFi antenna hardware.
- **`redlocal-64/`**: Transparent Bridge environment. Uses an ultra-lightweight Sniffer container that injects data into the Backend.

---

## 3. Source Code (`app/`)

The code is completely centralized and follows the DRY principle:

- **`app/sensor/`**: Bash scripts to deploy the AP, isolate victims, and capture traffic into the [FIFO](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)) pipe.
- **`app/backend/`**: Node.js server that processes the FIFO pipe with TShark, generates JSON alerts, and stores them in SQLite.
- **`app/frontend/`**: Web dashboard that receives telemetry via WebSockets in real time.

---

## 4. The Workflow (When you turn it on)

1. **The WiFi Trap (`sensor`)**: Deploys a virtual antenna with `hostapd`. It isolates victims using `iptables` and captures all their raw movements with `tcpdump`, sending them to a FIFO pipe (`/tmp_pipes/wifi_pipe`) shared via a Docker volume.

2. **The Heuristic Engine (`auditor-backend`)**: Node.js server listening on the other end of the pipe. It extracts IPs and ports with TShark and includes a **Passive Intrusion Detection System (IDS)** that analyzes TCP flags and ports to hunt for cybercriminal signatures in real time (C2 Trojans, Phishing, Nmap Scans, Plaintext Leaks). Backed by SQLite in WAL mode with insert queuing (Batching) to handle thousands of packets per second.

3. **The Visualization Center (`auditor-frontend`)**: Serves the dashboard on `https://localhost`. A forensic panel featuring a **Visual Threat Hierarchy**: critical attacks in blinking blood-red, unencrypted traffic in amber/orange.
