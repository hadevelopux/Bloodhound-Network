const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
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
setInterval(() => {
    if (dbQueue.length === 0) return;
    
    // Extraer hasta 100 queries por lote para no bloquear el Event Loop
    const batch = dbQueue.splice(0, 100);
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
            db.get(`SELECT count FROM stats_agg WHERE id = 'TOTAL_BYTES'`, [], (err, row) => {
                const totalBytes = row ? row.count : 0;
                
                const timeRemaining = (cycleStartMs + LIFECYCLE_MS) - Date.now();

                // Auto-Destruct if 30 days have passed
                if (timeRemaining <= 0) {
                    logger.warn('LIFECYCLE EXPIRED! Auto-resetting database...');
                    dbQueue.length = 0;
                    cycleStartMs = Date.now();
                    db.serialize(() => {
                        db.run("DELETE FROM stats_agg");
                        db.run("DELETE FROM raw_logs");
                        db.run(`INSERT INTO stats_agg (id, type, count) VALUES ('CYCLE_START', 'GLOBAL', ?)`, [cycleStartMs]);
                        db.run("VACUUM");
                    });
                    io.emit('historical_logs', []);
                    io.emit('stats_update', { connections: [], alerts: [], totalBytes: 0, timeRemaining: LIFECYCLE_MS });
                    return; 
                }
                
                if (connections.length > 0 || alerts.length > 0 || totalBytes > 0) {
                    logger.debug(`Broadcasting stats: ${connections.length} connections, ${alerts.length} alerts, ${totalBytes} bytes`);
                }
                io.emit('stats_update', { connections, alerts, totalBytes, timeRemaining });
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
        
        if (parsed.layers) {
           const pkt = processPacket(parsed.layers);
           if (pkt) {
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

             // Update Stats Connections
             if (pkt.src && pkt.dst && pkt.dst !== '-') {
                const connId = `${pkt.src} -> ${pkt.dst} : ${pkt.dport}`;
                dbQueue.push({
                    query: `INSERT INTO stats_agg (id, type, count) VALUES (?, 'CONNECTION', 1) ON CONFLICT(id) DO UPDATE SET count = count + 1`,
                    params: [connId]
                });
             }
             
             // Update Stats Alerts
             if (pkt.alerts && pkt.alerts.length > 0) {
                pkt.alerts.forEach(alert => {
                    dbQueue.push({
                        query: `INSERT INTO stats_agg (id, type, count) VALUES (?, 'ALERT', 1) ON CONFLICT(id) DO UPDATE SET count = count + 1`,
                        params: [alert]
                    });
                });
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
        if (dst && dst !== '239.255.255.250' && dst !== '255.255.255.255' && !dst.startsWith('192.168.') && !dst.startsWith('10.') && !dst.startsWith('172.16.')) {
            alerts.push(`🧟 BOTNET IoT (SSDP)`);
        }
    }

    // 3. Minería de Criptomonedas Oculta (CRÍTICO)
    const cryptoPorts = ['3333', '14433', '14444'];
    if (cryptoPorts.includes(dport) || cryptoPorts.includes(sport)) {
        const p = cryptoPorts.includes(dport) ? dport : sport;
        alerts.push(`⛏️ CRYPTOMINER [Port: ${p}]`);
    }

    // 4. Secuestro de DNS (DNS Hijacking) (CRÍTICO)
    if (dport === '53' || sport === '53') {
        const trustedDns = ['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1'];
        if (dst && !dst.startsWith('192.168.') && !trustedDns.includes(dst)) {
            alerts.push(`⚠️ DNS HIJACKED [To IP: ${dst}]`);
        }
    }

    // 5. Detección de Fugas de Texto Plano (MEDIO/ALTO)
    if (dport === '21' || sport === '21') {
        alerts.push(`🔓 PLAINTEXT [FTP]`);
    } else if (dport === '23' || sport === '23') {
        alerts.push(`🔓 PLAINTEXT [Telnet]`);
    } else if (method && dport !== '443' && sport !== '443') {
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
    if (len > 5000) {
        alerts.push(`📦 EXFILTRATION`);
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
          // Usa LIKE para buscar dentro del JSON stringificado de alertas o info
          query = `SELECT * FROM raw_logs WHERE alerts LIKE ? OR info LIKE ? ORDER BY time DESC LIMIT 1000`;
          params = [`%${filterText}%`, `%${filterText}%`];
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
  
  socket.on('clear_stats', (type) => {
    if (type === 'alerts') {
      db.run("DELETE FROM stats_agg WHERE type = 'ALERT'");
    } else if (type === 'connections') {
      db.run("DELETE FROM stats_agg WHERE type = 'CONNECTION'");
    }
    logger.info(`Stats cleared for type: ${type}`);
    // Clear in queue as well just in case
    for (let i = dbQueue.length - 1; i >= 0; i--) {
        if (dbQueue[i].query.includes(type === 'alerts' ? "'ALERT'" : "'CONNECTION'")) {
            dbQueue.splice(i, 1);
        }
    }
    // Broadcast immediate empty update so clients clear out
    if (type === 'alerts') io.emit('stats_update', { alerts: [], totalBytes: 0 }); // Note: totalBytes not cleared here
    if (type === 'connections') io.emit('stats_update', { connections: [], totalBytes: 0 });
  });

  socket.on('factory_reset', () => {
      logger.warn('Ejecutando FACTORY RESET de la base de datos completa!');
      dbQueue.length = 0; // Purge memory queue
      cycleStartMs = Date.now(); // Reset lifecycle variable
      db.serialize(() => {
          db.run("DELETE FROM stats_agg");
          db.run("DELETE FROM raw_logs");
          db.run(`INSERT INTO stats_agg (id, type, count) VALUES ('CYCLE_START', 'GLOBAL', ?)`, [cycleStartMs]);
          db.run("VACUUM"); // Reclaim space
      });
      // Broadcast to ALL clients to reset their UI
      io.emit('historical_logs', []);
      io.emit('stats_update', { connections: [], alerts: [], totalBytes: 0, timeRemaining: LIFECYCLE_MS });
  });
});

server.listen(3000, () => {
  logger.info('Backend Auditor corriendo en puerto 3000');
  startTshark();
});
