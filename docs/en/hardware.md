# 🖥️ Virtual Machine Hardware Requirements

> ⚠️ **CRITICAL:** Without meeting these requirements, the system will not boot correctly.

---

## Minimum and Recommended Specifications

| Resource | Minimum | Recommended |
|---|---|---|
| **vCPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 20 GB | 40 GB (for accumulated forensic logs) |
| **Network Interfaces (NICs)** | **2 (mandatory)** | **2 (mandatory)** |

---

## ⚙️ Critical Hypervisor Configuration

These configurations must be applied **before installing**, directly in your hypervisor's configuration interface:

| Parameter | Required Value | Reason |
|---|---|---|
| **Promiscuous Mode** | **Enabled** on both NICs | Without this, the `br0` bridge cannot intercept traffic and the Sniffer remains blind |
| **NIC Type** | `VirtIO` or `VMXNET3` depending on your hypervisor | Better network performance under forensic load |
| **Disk Bus** | `VirtIO` or `SCSI` | Never use `IDE`, it degrades performance |

---

## 🌉 Why are 2 network interfaces mandatory?

The **Local Network Mode** operates in a **Transparent Bridge (Layer 2)** architecture. The server is physically placed *in the middle* of the network traffic:

```
[Modem/ISP] ──── ens18 ──── [br0 (Sniffer)] ──── ens19 ──── [Router/Victims]
```

- **`ens18`** → Receives the cable coming from the modem or internet provider.
- **`ens19`** → Sends the cable towards the victims' router or switch.
- **`br0`** → Software bridge that unites both cards and intercepts all traffic flowing between them, completely invisibly.

Without the 2 NICs, the bridge cannot exist and the system fails on boot.
