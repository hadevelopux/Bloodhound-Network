# Bloodhound Network
Análisis forense de su red en tiempo real.

---

## 📡 ¿Qué es esto?

Suite de auditoría forense avanzada que opera bajo dos modalidades:

1. **Modo Sensor (Rogue AP)**: Levanta un Punto de Acceso WiFi falso para atraer dispositivos y analizar su tráfico en tiempo real.
2. **Modo Red Local (Bridge Transparente)**: Se sitúa de forma invisible (Capa 2) entre dos redes para capturar absolutamente todo el tráfico sin alterar la red original.

En ambos modos, el sistema extrae telemetría y muestra un análisis pericial detallado en tiempo real mediante un Dashboard Web.

---

## 📚 Documentación

| Documento | Descripción |
|---|---|
| [🏗️ Arquitectura](docs/es/arquitectura.md) | Cómo está estructurado el software y el flujo de datos entre contenedores |
| [🖥️ Hardware](docs/es/hardware.md) | Requisitos de la máquina virtual y configuración del hipervisor |
| [🛠️ Instalación](docs/es/instalacion.md) | Aprovisionamiento Bare-Metal paso a paso |
| [🚀 Uso Diario](docs/es/uso-diario.md) | Cómo encender, apagar y acceder al Dashboard |
| [⚠️ Alertas](docs/es/alertas.md) | Glosario completo de etiquetas visuales del Dashboard |

---

## 🖥️ Requisitos Mínimos

> ⚠️ Configura esto en tu hipervisor **antes de instalar**.

| Recurso | Mínimo | Recomendado |
|---|---|---|
| **Sistema Operativo** | Debian 12 (Bookworm) | Debian 13 (Trixie) |
| **vCPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Disco** | 20 GB | 40 GB |
| **NICs** | **2 obligatorias** | **2 obligatorias** |

> El **Modo Promiscuo** debe estar habilitado en ambas NICs. Sin esto el Sniffer queda ciego.
> → [Ver guía completa de hardware](docs/es/hardware.md)

