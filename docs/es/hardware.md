# 🖥️ Requisitos de Hardware para la Máquina Virtual

> ⚠️ **CRÍTICO:** Sin cumplir estos requisitos el sistema no arrancará correctamente.

---

## Especificaciones Mínimas y Recomendadas

| Recurso | Mínimo | Recomendado |
|---|---|---|
| **vCPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Disco** | 20 GB | 40 GB (para logs forenses acumulados) |
| **Interfaces de Red (NICs)** | **2 (obligatorio)** | **2 (obligatorio)** |

---

## ⚙️ Configuración Crítica en el Hipervisor

Estas configuraciones deben aplicarse **antes de instalar**, directamente en la interfaz de configuración de tu hipervisor:

| Parámetro | Valor requerido | Motivo |
|---|---|---|
| **Modo Promiscuo** | **Habilitado** en ambas NICs | Sin esto, el puente `br0` no puede interceptar tráfico y el Sniffer queda ciego |
| **Tipo de NIC** | `VirtIO` o `VMXNET3` según tu hipervisor | Mejor rendimiento de red bajo carga forense |
| **Bus de Disco** | `VirtIO` o `SCSI` | Nunca usar `IDE`, degrada el rendimiento |

---

## 🌉 ¿Por qué son obligatorias 2 interfaces de red?

El **Modo Red Local** opera en arquitectura **Bridge Transparente (Capa 2)**. El servidor se coloca físicamente *en el medio* del tráfico de red:

```
[Modem/ISP] ──── ens18 ──── [br0 (Sniffer)] ──── ens19 ──── [Router/Víctimas]
```

- **`ens18`** → Recibe el cable que viene del modem o proveedor de internet.
- **`ens19`** → Envía el cable hacia el router o switch de las víctimas.
- **`br0`** → Puente software que une ambas tarjetas e intercepta todo el tráfico que fluye entre ellas, de forma completamente invisible.

Sin las 2 NICs, el puente no puede existir y el sistema falla en el arranque.
