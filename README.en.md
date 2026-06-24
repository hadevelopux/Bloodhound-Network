# Bloodhound Network
Real-time network forensics analysis.

<div align="right">
  <a href="README.md">Español</a> | <a href="README.en.md">English</a>
</div>

---

## 📡 What is this?

Advanced forensics auditing suite operating in two modes:

1. **Sensor Mode (Rogue AP)**: Deploys an emulated WiFi Access Point to attract devices and analyze their traffic in real time.
2. **Local Network Mode (Transparent Bridge)**: Sits invisibly (Layer 2) between two networks to capture absolutely all traffic without altering the original network.

In both modes, the system extracts telemetry and displays detailed forensic analysis in real time via a Web Dashboard.

---

## 📚 Documentation

| Document | Description |
|---|---|
| [🏗️ Architecture](docs/en/architecture.md) | How the software is structured and data flow between containers |
| [🖥️ Hardware](docs/en/hardware.md) | Virtual machine requirements and hypervisor configuration |
| [🛠️ Installation](docs/en/installation.md) | Step-by-step Bare-Metal provisioning |
| [🚀 Daily Usage](docs/en/daily-usage.md) | How to start, stop, and access the Dashboard |
| [⚠️ Alerts](docs/en/alerts.md) | Complete glossary of visual tags in the Dashboard |

---

## 🖥️ Minimum Requirements

> ⚠️ Configure this in your hypervisor **before installing**.

| Resource | Minimum | Recommended |
|---|---|---|
| **OS** | Debian 12 (Bookworm) | Debian 13 (Trixie) |
| **vCPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 20 GB | 40 GB |
| **NICs** | **2 mandatory** | **2 mandatory** |

> **Promiscuous Mode** must be enabled on both NICs. Without this, the Sniffer remains blind.
> → [View complete hardware guide](docs/en/hardware.md)
