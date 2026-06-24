# 🚀 Flujo de Trabajo y Despliegue Diario

Una vez aprovisionado y reiniciado el servidor, el uso diario es trivial gracias al auto-arranque nativo. Si necesitas gestionar el sistema manualmente:

---

## 1. Configura tu Entorno (Opcional)

El script de setup ya completó la configuración, pero puedes editar el archivo `.env` en la raíz del proyecto en cualquier momento para:
- Cambiar contraseñas del WiFi trampa
- Activar logs para desarrolladores: `ENABLE_DEBUG_LOGS=true`

---

## 2. Control de Contenedores

```bash
sudo ./bloodhound.sh
```

Desde el menú selecciona:
- **Encender Suite** → Levanta todos los contenedores del modo seleccionado
- **Detener Suite** → Para todos los contenedores de forma limpia

---

## 3. Accede al Dashboard

Abre tu navegador web y entra a:

```
https://localhost
```

o la IP remota de tu servidor/máquina virtual.

> Tu navegador advertirá sobre un "Certificado Autofirmado". Dale a **Avanzado → Continuar**. Verás la interfaz forense con candado SSL cifrado.

---

## 4. Comportamiento del Hardware en Fallos

- En **Modo Sensor**, si algo falla con la antena, el contenedor `sensor` se reiniciará en bucle de protección, pero el Dashboard seguirá activo para leer los logs.

---

## 5. Ver Logs en Tiempo Real

Entra a la carpeta del modo activo y ejecuta:

```bash
# Para Red Local:
cd docker/redlocal-64 && docker compose logs -f

# Para Sensor 64-bit:
cd docker/sensor-64 && docker compose logs -f
```
