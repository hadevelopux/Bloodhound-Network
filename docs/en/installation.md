# 🛠️ Bare-Metal Provisioning

The system has been designed to be **Plug & Play**. You don't need to install Docker, configure routing, or download libraries manually.

---

## ⚠️ Compatible Operating Systems

> The bare-metal installers are natively designed **ONLY** for distributions based on Debian and Ubuntu (and their cybersecurity derivatives like Kali Linux or ParrotOS). They feature a hard architecture lock: if you try to run them on Arch Linux, CentOS, or RedHat, the system will abort to protect your machine.

---

## Installation Instructions

Take a fresh Debian/Ubuntu server, open a terminal in the root of the project, and run the Master Orchestrator:

```bash
sudo ./bloodhound.sh
```

The wizard will ask you to select your language and display the main menu. Select **1) Install Suite**, and then choose your modality:

1. **Local Network Mode (Transparent Bridge)**: Guides you to select your physical cards, configures the bridge (`br0`), seals the firewall (UFW), and prepares Docker.
2. **Sensor Mode (Rogue AP)**: *Requires a physical WiFi antenna*. It will hardware-unlock your antenna (RFKill), evade NetworkManager locks, enable routing (NAT), and auto-fill your `.env` file.

---

## 🔧 What the Installer Does for You

Upon completing the installation, the system will have:

- Installed official Docker Engine from `get.docker.com`
- Configured daily automated vulnerability patching (`unattended-upgrades`)
- Saved installation logs in `/var/log/bloodhound_setup.log`
- Created a `systemd` daemon for auto-start in case of power failure

> **Important:** At the end of any installation, the system will prompt for a reboot. Accept it to apply kernel and network changes.
