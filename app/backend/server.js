const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Determine global current ID
let currentDbId = 0;
const path = require('path');

process.on('uncaughtException', (err) => {
    console.error('[NODE FATAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[NODE FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Logger centralizado controlado por entorno
const DEBUG_MODE = process.env.ENABLE_DEBUG_LOGS === 'true';

const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    debug: (...args) => {
        if (DEBUG_MODE) {
            console.log('[DEBUG]', ...args);
        }
    }
};

// Initialize database
const dbDir = '/logs';
if (!fs.existsSync(dbDir)){
    fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error("Error opening database: " + err.message);
    } else {
        logger.info("Connected to the SQLite database.");
        // Optimizar SQLite para alto rendimiento en streaming
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA synchronous = NORMAL;');
        
        db.get("SELECT MAX(id) as maxId FROM raw_logs", [], (err, row) => {
            if (row && row.maxId) currentDbId = row.maxId;
        });
        
        db.run(`CREATE TABLE IF NOT EXISTS raw_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time INTEGER,
            src TEXT,
            sport TEXT,
            dst TEXT,
            dport TEXT,
            proto TEXT,
            len INTEGER,
            domain TEXT,
            info TEXT,
            alerts TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS stats_agg (
            id TEXT PRIMARY KEY,
            type TEXT,
            count INTEGER DEFAULT 0
        )`);
    }
});

// Manejador global de errores de SQLite para evitar que Node.js colapse
db.on('error', (err) => {
    logger.error('Excepción no controlada en SQLite:', err.message);
});

// Cola de inserción para evitar Memory Leaks (OOM)
const dbQueue = [];
const statsAggregator = new Map();
let isResetting = false;

setInterval(() => {
    if (isResetting) return;
    
    // Volcar agregador de memoria a cola SQL (Evita miles de queries/seg bajo ataques)
    if (statsAggregator.size > 0) {
        statsAggregator.forEach((data, id) => {
            dbQueue.push({
                query: `INSERT INTO stats_agg (id, type, count) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET count = count + ?`,
                params: [id, data.type, data.count, data.count]
            });
        });
        statsAggregator.clear();
    }
    
    if (dbQueue.length === 0) return;
    
    // Extraer hasta 2000 queries por lote para no bloquear el Event Loop
    const batch = dbQueue.splice(0, 2000);
    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");
        for (const q of batch) {
            db.run(q.query, q.params, (err) => {
                if (err) logger.error('DB Batch Error:', err.message);
            });
        }
        db.run("COMMIT;");
    });
}, 1000);

const LIFECYCLE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
let cycleStartMs = Date.now();

// Load or Initialize CYCLE_START
db.get(`SELECT count FROM stats_agg WHERE id = 'CYCLE_START'`, [], (err, row) => {
    if (row) {
        cycleStartMs = row.count;
    } else {
        cycleStartMs = Date.now();
        db.run(`INSERT INTO stats_agg (id, type, count) VALUES ('CYCLE_START', 'GLOBAL', ?)`, [cycleStartMs]);
    }
});

// Periodic cleanup of logs older than 7 days
setInterval(() => {
    db.run(`DELETE FROM raw_logs WHERE created_at <= datetime('now', '-7 days')`, function(err) {
        if (err) {
            logger.error('Error al limpiar base de datos:', err.message);
        } else if (this.changes > 0) {
            logger.info(`Deleted ${this.changes} logs older than 7 days.`);
        }
    });
}, 1000 * 60 * 60);

// Broadcast stats every 2 seconds
setInterval(() => {
    db.all(`SELECT * FROM stats_agg WHERE type = 'ALERT' ORDER BY count DESC LIMIT 50`, [], (err, alerts) => {
        if (err) {
            logger.error('Error fetching alerts:', err.message);
            return;
        }
        db.all(`SELECT * FROM stats_agg WHERE type = 'CONNECTION' ORDER BY count DESC LIMIT 50`, [], (err, connections) => {
            if (err) {
                logger.error('Error fetching connections:', err.message);
                return;
            }
            db.all(`SELECT * FROM stats_agg WHERE type = 'THREAT_DOMAIN' ORDER BY count DESC LIMIT 50`, [], (err, trackingDomains) => {
                if (err) {
                    logger.error('Error fetching tracking domains:', err.message);
                    return;
                }
                db.get(`SELECT count FROM stats_agg WHERE id = 'TOTAL_BYTES'`, [], (err, row) => {
                    const totalBytes = row ? row.count : 0;
                    const timeRemaining = (cycleStartMs + LIFECYCLE_MS) - Date.now();

                    // Auto-Destruct if 30 days have passed
                    if (timeRemaining <= 0) {
                        logger.warn('LIFECYCLE EXPIRED! Auto-resetting database...');
                        dbQueue.length = 0;
                        cycleStartMs = Date.now();
                        db.serialize(() => {
                            db.run(`DELETE FROM raw_logs`);
                            db.run(`DELETE FROM stats_agg`);
                            db.run(`INSERT INTO stats_agg (id, type, count) VALUES ('CYCLE_START', 'GLOBAL', ?)`, [cycleStartMs]);
                        });
                        io.emit('factory_reset_completed');
                    }

                    if (connections.length > 0 || alerts.length > 0 || totalBytes > 0) {
                        logger.debug(`Broadcasting stats: ${connections.length} connections, ${alerts.length} alerts, ${trackingDomains.length} tracking domains, ${totalBytes} bytes`);
                    }
                    io.emit('stats_update', { 
                        connections, 
                        alerts, 
                        trackingDomains, 
                        totalBytes, 
                        totalPackets: currentDbId,
                        timeRemaining 
                    });
                });
            });
        });
    });
}, 2000);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PIPE_PATH = process.env.TARGET_PIPE || '/tmp_pipes/wifi_pipe';

app.get('/health', (req, res) => {
  res.send({ status: 'ok' });
});

let tsharkProcess = null;

function startTshark() {
  if (tsharkProcess) {
    tsharkProcess.kill();
  }

  // Ensure FIFO exists
  if (!fs.existsSync(PIPE_PATH)) {
    logger.info(`Esperando a que el SENSOR cree el FIFO ${PIPE_PATH}...`);
    setTimeout(startTshark, 2000);
    return;
  }

  logger.info(`Iniciando tshark sobre ${PIPE_PATH}`);
  
  // Use TShark with Ek format (JSON) for easy parsing
  tsharkProcess = spawn('tshark', [
    '-l', '-n',
    '-r', PIPE_PATH,
    '-T', 'ek',
    '-e', 'frame.time_epoch',
    '-e', 'ip.src',
    '-e', 'ip.dst',
    '-e', 'tcp.srcport',
    '-e', 'tcp.dstport',
    '-e', 'udp.srcport',
    '-e', 'udp.dstport',
    '-e', 'frame.protocols',
    '-e', 'frame.len',
    '-e', 'http.request.method',
    '-e', 'http.response.code',
    '-e', 'http.host',
    '-e', 'tls.handshake.extensions_server_name',
    '-e', 'dns.qry.name',
    '-e', 'dns.resp.name',
    '-e', '_ws.col.Protocol',
    '-e', '_ws.col.Info',
    '-e', 'tcp.flags.syn',
    '-e', 'tcp.flags.ack',
    '-e', 'tcp.flags.fin',
    '-e', 'tcp.flags.push',
    '-e', 'tcp.flags.urg',
    '-e', 'arp.src.proto_ipv4',
    '-e', 'arp.dst.proto_ipv4'
  ]);

  let buffer = '';

  tsharkProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep the last incomplete line in the buffer

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        // ek format emits an index object before the actual document object
        if (parsed.index) continue; 
        
        if (parsed.layers && !isResetting) {
           const pkt = processPacket(parsed.layers);
           if (pkt) {
             currentDbId++;
             pkt.id = currentDbId;
             logger.debug(`[PACKET] ${pkt.src}:${pkt.sport} -> ${pkt.dst}:${pkt.dport} [${pkt.proto}]`);
             if (pkt.alerts && pkt.alerts.length > 0) {
                 logger.debug(`[ALERT TRIGGERED] ${pkt.alerts.join(', ')} on packet from ${pkt.src}`);
             }
             io.emit('packet', pkt);

             // Push queries to queue instead of executing immediately
             dbQueue.push({
                 query: `INSERT INTO raw_logs (time, src, sport, dst, dport, proto, len, domain, info, alerts) VALUES (?,?,?,?,?,?,?,?,?,?)`,
                 params: [pkt.time || 0, pkt.src || '-', pkt.sport || '-', pkt.dst || '-', pkt.dport || '-', pkt.proto || '-', pkt.len || 0, pkt.domain || '', pkt.info || '', JSON.stringify(pkt.alerts || [])]
             });
             
             // Función helper para agregación ultra-rápida en RAM (Evita colapso SQL)
             const addStat = (id, type) => {
                 if (!statsAggregator.has(id)) {
                     statsAggregator.set(id, { type, count: 0 });
                 }
                 statsAggregator.get(id).count++;
             };

             // Update Stats Connections
             if (pkt.src && pkt.dst && pkt.dst !== '-') {
                 const connId = `${pkt.src} -> ${pkt.dst} : ${pkt.dport}`;
                 addStat(connId, 'CONNECTION');
             }
             
             // Update Stats Alerts
             if (pkt.alerts && pkt.alerts.length > 0) {
                pkt.alerts.forEach(alert => {
                    addStat(alert, 'ALERT');
                });
                
                // Extraer todos los dominios que dispararon alertas
                if (pkt.domain) {
                    pkt.alerts.forEach(alert => {
                        const domainAlert = `${pkt.domain}|${alert}`;
                        addStat(domainAlert, 'THREAT_DOMAIN');
                    });
                }
             }
             
             // Update Global Data Consumption
             let packetLen = 0;
             if (pkt.len !== undefined && !isNaN(pkt.len)) {
                 packetLen = parseInt(pkt.len, 10);
             }
             
             if (packetLen > 0) {
                 dbQueue.push({
                     query: `INSERT INTO stats_agg (id, type, count) VALUES ('TOTAL_BYTES', 'GLOBAL', ?) ON CONFLICT(id) DO UPDATE SET count = count + ?`,
                     params: [packetLen, packetLen]
                 });
             }
             
             // Prevenir desbordamiento absoluto (Drop packets if disk is too slow)
             if (dbQueue.length > 10000) {
                 logger.error('DB Queue over 10,000! Dropping oldest packets to prevent OOM crash.');
                 dbQueue.splice(0, 5000);
             }
           }
        }
      } catch (err) {
        // Silently ignore parse errors for partial json
      }
    }
  });

  tsharkProcess.stderr.on('data', (data) => {
    // Tshark emite demasiada basura y warnings. Enviar solo al debug logger.
    logger.debug(`TSHARK STDERR: ${data}`);
  });

  tsharkProcess.on('close', (code) => {
    logger.error(`tshark process exited with code ${code}. Restarting...`);
    setTimeout(startTshark, 5000);
  });
}

function processPacket(layers) {
  try {
    const p = layers;
    
    // Safely extract arrays or single values
    const getVal = (field) => {
      if (!p[field]) return null;
      return Array.isArray(p[field]) ? p[field][0] : p[field];
    };

    const src = getVal('ip_src') || getVal('ip_ip_src') || getVal('arp_src_proto_ipv4') || getVal('arp_arp_src_proto_ipv4');
    const dst = getVal('ip_dst') || getVal('ip_ip_dst') || getVal('arp_dst_proto_ipv4') || getVal('arp_arp_dst_proto_ipv4');
    if (!src && !dst) return null; // Ignore completely unknown traffic

    const sport = getVal('tcp_srcport') || getVal('tcp_tcp_srcport') || getVal('udp_srcport') || getVal('udp_udp_srcport') || '-';
    const dport = getVal('tcp_dstport') || getVal('tcp_tcp_dstport') || getVal('udp_dstport') || getVal('udp_udp_dstport') || '-';
    const len = getVal('frame_len') || getVal('frame_frame_len') || 0;
    const time = getVal('frame_time_epoch') || getVal('frame_frame_time_epoch');
    const protoCol = getVal('_ws_col_Protocol') || getVal('_ws_col__ws_col_Protocol');
    const info = getVal('_ws_col_Info') || getVal('_ws_col__ws_col_Info');

    const domain = getVal('http_host') || getVal('http_http_host') || 
                   getVal('tls_handshake_extensions_server_name') || getVal('tls_handshake_tls_handshake_extensions_server_name') || 
                   getVal('dns_qry_name') || getVal('dns_dns_qry_name') || '';

    const method = getVal('http_request_method') || getVal('http_http_request_method') || '';

    // ==========================================
    // 🛡️ MOTOR DE HEURÍSTICA Y RADAR DE MALWARE
    // ==========================================
    const alerts = [];
    
    // 1. Detección de Troyanos C2 y Backdoors (CRÍTICO)
    const c2Ports = ['4444', '4433', '8443', '1337', '31337'];
    if (c2Ports.includes(dport) || c2Ports.includes(sport)) {
        alerts.push(`⚠️ TROJAN/C2`);
    }

    // 2. Infección IoT y Botnets (Mirai / UPnP) (CRÍTICO)
    const miraiPorts = ['2323']; 
    if (miraiPorts.includes(dport) || miraiPorts.includes(sport)) {
        alerts.push(`🧟 BOTNET IoT (MIRAI)`);
    }
    if (dport === '1900' || sport === '1900') {
        // Ignorar tráfico local típico de UPnP/SSDP (Broadcast, Multicast o LAN local)
        // Solo alertar si el tráfico SSDP está intentando salir hacia un servidor en Internet (posible DDoS)
        const d = dst || '';
        const isLocalOrMulticast = d.includes('239.255.255.250') || d.includes('255.255.255.255') || 
                                   d.startsWith('192.168.') || d.startsWith('10.') || d.startsWith('172.16.') || 
                                   d.startsWith('ff02:');
        if (!isLocalOrMulticast) {
            alerts.push(`🧟 BOTNET IoT (SSDP)`);
        }
    }

    // 3. Minería de Criptomonedas Oculta (CRÍTICO)
    const cryptoPorts = ['3333', '14433', '14444'];
    if (cryptoPorts.includes(dport) || cryptoPorts.includes(sport)) {
        alerts.push(`⛏️ CRYPTOMINER`);
    }

    // 4. Secuestro de DNS (DNS Hijacking) (CRÍTICO)
    if (dport === '53' || sport === '53') {
        const trustedDns = [
            // Google Public DNS
            '8.8.8.8', '8.8.4.4', 
            // Cloudflare
            '1.1.1.1', '1.0.0.1', 
            // Quad9
            '9.9.9.9', '149.112.112.112', 
            // OpenDNS (Cisco Umbrella)
            '208.67.222.222', '208.67.220.220',
            // AdGuard DNS
            '94.140.14.14', '94.140.15.15',
            // CleanBrowsing
            '185.228.168.9', '185.228.169.9',
            // Alternate DNS
            '76.76.19.19', '76.223.122.150',
            // Yandex DNS
            '77.88.8.8', '77.88.8.1',
            // Control D
            '76.76.2.0', '76.76.10.0',
            // Comodo Secure DNS
            '8.26.56.26', '8.20.247.20'
        ];
        // Solo alertamos si sale a internet hacia un DNS muy raro. 
        // Si el usuario usa el DNS de su ISP, puede saltar como falso positivo, 
        // pero limitarlo reduce el ruido.
        if (dst && !dst.startsWith('192.168.') && !dst.startsWith('10.') && !dst.startsWith('172.16.') && !trustedDns.includes(dst)) {
            alerts.push(`⚠️ DNS SECUESTRADO`);
        }
    }

    // 5. Detección de Fugas de Texto Plano (MEDIO/ALTO)
    if (dport === '21' || sport === '21') {
        alerts.push(`🔓 PLAINTEXT [FTP]`);
    } else if (dport === '23' || sport === '23') {
        alerts.push(`🔓 PLAINTEXT [Telnet]`);
    } else if (method && dport !== '443' && sport !== '443' && dport !== '1900' && sport !== '1900' && protoCol !== 'SSDP') {
        // Excluimos puerto 1900 (SSDP/UPnP) porque usa HTTP methods (M-SEARCH, NOTIFY)
        alerts.push(`🔓 PLAINTEXT [HTTP]`);
    }

    // 6. Phishing y Dark Web (CRÍTICO)
    const darkDomains = ['.onion', 'free-gift', 'login-update', 'paypal-secure-verify'];
    if (domain) {
        if (darkDomains.some(d => domain.includes(d))) {
            alerts.push(`🎣 PHISHING/DARKWEB`);
        }
    }

    // 7. Rastreo Masivo y Adware (MEDIO)
    const adwareDomains = ['adservice', 'analytics', 'metrics', 'telemetry', 'doubleclick', 'track'];
    if (domain) {
        if (adwareDomains.some(d => domain.includes(d))) {
            alerts.push(`👁️ TRACKING/ADWARE`);
        }
    }

    // 8. Escaneos Nmap y Anomalías de Red (ALTO)
    const synFlag = getVal('tcp_flags_syn') || p['tcp_tcp_flags_tcp_flags_syn'];
    const ackFlag = getVal('tcp_flags_ack') || p['tcp_tcp_flags_tcp_flags_ack'];
    const finFlag = getVal('tcp_flags_fin') || p['tcp_tcp_flags_tcp_flags_fin'];
    const pushFlag = getVal('tcp_flags_push') || p['tcp_tcp_flags_tcp_flags_push'];
    const urgFlag = getVal('tcp_flags_urg') || p['tcp_tcp_flags_tcp_flags_urg'];

    // XMAS Scan (FIN + PUSH + URG)
    if (finFlag === '1' && pushFlag === '1' && urgFlag === '1') {
        alerts.push(`🕵️ NMAP SCAN (XMAS)`);
    }
    // NULL Scan (Todos los flags en 0 pero es TCP)
    else if (protoCol === 'TCP' && synFlag === '0' && ackFlag === '0' && finFlag === '0' && pushFlag === '0' && urgFlag === '0') {
        alerts.push(`🕵️ NMAP SCAN (NULL)`);
    }
    // SYN Scan ruidoso (Medio)
    else if (synFlag === '1' && ackFlag === '0') {
        alerts.push(`SYN-SCAN`);
    }

    // 9. Escaneo Local de ARP (Infección cruzada) (MEDIO)
    if (protoCol === 'ARP' && info && info.includes('Who has')) {
        alerts.push(`🔎 LOCAL SCAN (ARP)`);
    }

    // 10. Exfiltración de Datos (Data Leak)
    // El TSO (TCP Segmentation Offload) agrupa paquetes, haciendo que frame_len sea > 5000 normalmente.
    // Solo alertaremos si es una subida masiva (> 50,000 bytes en un solo chunk) HACIA internet.
    if (len > 50000) {
        const isOutbound = src && (src.startsWith('192.168.') || src.startsWith('10.')) && 
                           dst && (!dst.startsWith('192.168.') && !dst.startsWith('10.'));
        if (isOutbound) {
            alerts.push(`📦 EXFILTRATION`);
        }
    }
    
    // Alertas Legadas
    if (info && info.includes('404 Not Found')) alerts.push(`HTTP-404`);

    return {
      time: parseFloat(time) * 1000, // ms
      src,
      sport,
      dst,
      dport,
      proto: protoCol || 'UNKN',
      len,
      domain,
      info,
      alerts
    };
  } catch (err) {
    return null;
  }
}

io.on('connection', (socket) => {
  logger.info('Cliente Web conectado vía WebSocket.');
  
  // Enviar configuración de logs centralizada al frontend
  socket.emit('app_config', { debug: DEBUG_MODE });

  // Emitir estadísticas iniciales de inmediato para evitar retrasos en el frontend
  db.get(`SELECT count FROM stats_agg WHERE id = 'TOTAL_BYTES'`, [], (err, row) => {
      const totalBytes = row ? row.count : 0;
      socket.emit('stats_update', {
          connections: [],
          alerts: [],
          trackingDomains: [],
          totalBytes,
          totalPackets: currentDbId,
          timeRemaining: (cycleStartMs + LIFECYCLE_MS) - Date.now()
      });
  });
  
  // Send the last 500 packets immediately on connect
  db.all(`SELECT * FROM raw_logs ORDER BY time DESC LIMIT 500`, [], (err, rows) => {
      if (!err && rows && rows.length > 0) {
          // The data is stored with alerts as JSON strings, we should parse them
          const parsedRows = rows.map(r => {
              try { r.alerts = JSON.parse(r.alerts); } catch(e) { r.alerts = []; }
              return r;
          });
          socket.emit('historical_logs', parsedRows.reverse()); // Reverse to chronological
      }
  });

  socket.on('request_filter_history', (filterText) => {
      // Si el filtro es vacío o ALL, trae los últimos 1000
      let query = `SELECT * FROM raw_logs ORDER BY time DESC LIMIT 1000`;
      let params = [];

      if (filterText && filterText.trim() !== '') {
          // Busca en todas las columnas para igualar el comportamiento del frontend
          query = `SELECT * FROM raw_logs WHERE src LIKE ? OR dst LIKE ? OR sport LIKE ? OR dport LIKE ? OR proto LIKE ? OR domain LIKE ? OR info LIKE ? OR alerts LIKE ? ORDER BY time DESC LIMIT 1000`;
          const p = `%${filterText}%`;
          params = [p, p, p, p, p, p, p, p];
      }

      db.all(query, params, (err, rows) => {
          if (!err && rows) {
              const parsedRows = rows.map(r => {
                  try { r.alerts = JSON.parse(r.alerts); } catch(e) { r.alerts = []; }
                  return r;
              });
              socket.emit('historical_logs', parsedRows.reverse());
          }
      });
  });
  
  socket.on('factory_reset', () => {
      logger.warn('Ejecutando FACTORY RESET NUCLEAR de la base de datos completa!');
      isResetting = true;
      
      // Limpiar memoria
      dbQueue.length = 0;
      cycleStartMs = Date.now();
      
      // Borrado a nivel SQL en vez de FS para evitar race conditions en Docker
      db.serialize(() => {
          db.run("CREATE TABLE IF NOT EXISTS stats_agg (id TEXT PRIMARY KEY, type TEXT, count INTEGER DEFAULT 0)");
          db.run("DELETE FROM stats_agg");
          db.run("DELETE FROM raw_logs");
          db.run(`INSERT INTO stats_agg (id, type, count) VALUES ('CYCLE_START', 'GLOBAL', ?)`, [cycleStartMs], (err) => {
              isResetting = false; // Liberar lock cuando termine de escribir
          });
      });

      // Emitir evento a todos los clientes para que limpien su UI instantáneamente
      io.emit('historical_logs', []);
      io.emit('stats_update', { connections: [], alerts: [], totalBytes: 0, timeRemaining: LIFECYCLE_MS });
  });
});

server.listen(3000, () => {
  logger.info('Backend Auditor corriendo en puerto 3000');
  startTshark();
});
