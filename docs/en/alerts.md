# ⚠️ Alerts Reading Manual

When you observe traffic in the `Vulnerabilities / Alerts` panel, the Malware Radar will inject visual tags. This is the complete glossary:

---

## 🔴 Critical Level (Blinking Red)

| Visual Tag | What does this mean in your network? |
| :--- | :--- |
| `⚠️ TROJAN/C2` | Someone on the network is running a Remote Access Trojan or a backdoor. The device is calling back to Metasploit, Cobalt Strike, or similar command ports (e.g. 4444, 4433, 1337). |
| `🧟 BOTNET IoT` | A Camera, Smart TV, or Smart Bulb in the house has been infected (e.g. Mirai Botnet) and is sending massive attacks out to the internet using vulnerable ports (2323, 1900). |
| `⛏️ CRYPTOMINER` | Hidden malware stealing a computer or phone's power and processor to mine cryptocurrencies. |
| `⚠️ DNS HIJACKED` | A device has a virus that changed its DNS settings. If the victim goes to their bank's website, they will be silently redirected to a fake cloned page to steal their password. |
| `🎣 PHISHING/DARKWEB` | A device attempted to resolve an `.onion` domain (Tor/DarkWeb) or a known fake URL used to steal credentials. |
| `🕵️ NMAP SCAN` | A stealth attacker is sending malformed packets (XMAS/NULL) to scan and discover which devices and ports are open on your network without being detected. |

---

## 🟠 Warning Level (Orange)

| Visual Tag | What does this mean in your network? |
| :--- | :--- |
| `🔓 PLAINTEXT` | Someone is using unencrypted FTP, Telnet, or HTTP. Their passwords, emails, or sessions have just traveled completely visible through the air. |
| `👁️ TRACKING/ADWARE` | A TV or phone is sending abusive telemetry to advertising or stealth tracking servers in the background. |
| `🔎 LOCAL SCAN (ARP)` | An infected device on your home network is using ARP bursts to search for which other computers and phones in your house it can spread to. |
| `📦 EXFILTRATION` | Suspiciously heavy traffic towards the internet. Possible indication that massive databases are being stolen to the cloud. |
| `SYN-SCAN` | Noisy port scan. A program is attempting to aggressively connect to thousands of ports per second. |

---

## ⚪ Info / Debug Level (Gray)

| Visual Tag | What does this mean in your network? |
| :--- | :--- |
| `CNN` / `HTTP-404` | General behavior monitoring. (e.g., Traffic towards the CNN website or normal browsing errors). |
