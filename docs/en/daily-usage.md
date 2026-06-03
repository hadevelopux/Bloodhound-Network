# 🚀 Daily Workflow and Deployment

Once provisioned and the server rebooted, daily use is trivial thanks to the native auto-start. If you need to manage the system manually:

---

## 1. Configure your Environment (Optional)

The setup script has already completed the configuration, but you can edit the `.env` file in the root of the project at any time to:
- Change the trap WiFi passwords
- Enable developer logs: `ENABLE_DEBUG_LOGS=true`

---

## 2. Container Control

```bash
sudo ./bloodhound.sh
```

From the menu select:
- **Turn On Suite** → Starts all containers for the selected mode
- **Stop Suite** → Stops all containers cleanly

---

## 3. Access the Dashboard

Open your web browser and navigate to:

```
https://localhost
```

or the remote IP of your server/virtual machine.

> Your browser will warn about a "Self-Signed Certificate". Click **Advanced → Continue**. You will see the forensic interface with encrypted SSL padlock.

---

## 4. Hardware Behavior on Failure

- In **Sensor Mode**, if something fails with the antenna, the `sensor` container will reboot in a protection loop, but the Dashboard will remain active to read the logs.

---

## 5. View Logs in Real Time

Enter the active mode folder and run:

```bash
# For Local Network:
cd docker/redlocal-64 && docker compose logs -f

# For 64-bit Sensor:
cd docker/sensor-64 && docker compose logs -f
```
