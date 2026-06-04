import './style.css';
import '@fontsource/inter';
import '@fontsource/fira-code';
import { io } from "socket.io-client";
import { translations } from './lang.js';

function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// ==========================================
// REFERENCIAS AL DOM
// ==========================================
const socket = io();
const packetBody = document.getElementById('packetBody'); // <tbody> de la tabla de paquetes principal
const pktCounter = document.getElementById('pktCounter'); // <span> contador de paquetes
const dataCounter = document.getElementById('dataCounter');
const connStatus = document.getElementById('connStatus'); // <span> estado de la conexión WebSocket
const searchInput = document.getElementById('searchInput'); // <input> de texto para el filtro BPF/texto libre


// ==========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
let totalPackets = 0;
const MAX_ROWS = 1000;

// Almacena el filtro de categoría activo (ej. "BOTNET", "NMAP", etc.)
// Si está vacío (''), significa que se muestran todos los paquetes.
let currentCategoryFilter = '';
let globalTotalBytes = 0;

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatTimeRemaining(ms) {
    if (ms <= 0) return '0';
    const dict = translations[currentLang] || translations['en'];
    
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (hours > 48) {
        return `${days} ${dict.days || 'd'}`;
    } else if (mins > 120) {
        return `${hours} ${dict.hours || 'h'}`;
    } else if (secs > 60) {
        return `${mins} ${dict.mins || 'm'}`;
    } else {
        return `${secs} ${dict.secs || 's'}`;
    }
}

function updateCounters() {
    if (pktCounter) {
        const visibleRows = packetBody.querySelectorAll('tr:not([style*="display: none"])');
        
        let visibleBytes = 0;
        visibleRows.forEach(row => {
            const lenStr = row.dataset.len;
            if (lenStr) visibleBytes += parseInt(lenStr, 10) || 0;
        });

        if (currentCategoryFilter || searchInput.value) {
            // We are filtering! Show visible vs total
            pktCounter.textContent = `${visibleRows.length} / ${totalPackets}`;
            if (dataCounter) {
                dataCounter.textContent = formatBytes(visibleBytes);
            }
        } else {
            pktCounter.textContent = totalPackets;
            if (dataCounter) {
                dataCounter.textContent = formatBytes(globalTotalBytes);
            }
        }
    }
}

// ==========================================
// EVENTOS DE WEBSOCKET (CONEXIÓN Y ESTADO)
// ==========================================

function updateConnStatusText() {
    if (socket.connected) {
        connStatus.textContent = translations[currentLang]?.['live'] || 'Live';
    } else {
        connStatus.textContent = translations[currentLang]?.['disconnected'] || 'Disconnected';
    }
}

socket.on('connect', () => {
    updateConnStatusText();
    connStatus.className = 'text-neon-green drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]';
    document.querySelector('.pulse-dot').style.animationPlayState = 'running';
});

socket.on('disconnect', () => {
    updateConnStatusText();
    connStatus.className = 'text-neon-red';
    document.querySelector('.pulse-dot').style.animationPlayState = 'paused';
});

socket.on('connect_error', (err) => {
    connStatus.textContent = 'Error';
    connStatus.className = 'text-neon-red font-bold animate-pulse';
    document.querySelector('.pulse-dot').style.animationPlayState = 'paused';
    console.error('WebSocket Error:', err);
});

// ==========================================
// EVENTOS DE WEBSOCKET (TRÁFICO Y ALERTAS)
// ==========================================

/**
 * Escucha el evento 'packet' enviado por el servidor cada vez que tshark procesa un nuevo paquete de red.
 * Aplica lógica de filtrado por texto (búsqueda BPF simulada) y delega el renderizado en pantalla.
 * @param {Object} pkt - Objeto JSON con la información del paquete (src, dst, proto, alerts, etc.)
 */
socket.on('packet', (pkt) => {
    // El paquete se agrega al DOM SIEMPRE. addPacketRow se encargará
    // de ocultarlo visualmente si no coincide con los filtros activos.
    addPacketRow(pkt);
    updateCounters();
});

/**
 * Escucha el evento 'stats_update' enviado periódicamente por el backend con los rankings.
 * Re-renderiza los widgets del lado izquierdo: "Vulnerabilidades/Alertas" y "Conexiones Recurrentes".
 * @param {Object} stats - Objeto con arreglos 'alerts' y 'connections' conteniendo objetos {id, count}.
 */
socket.on('stats_update', (data) => {
    const alertsList = document.getElementById('alertsList');
    const connsList = document.getElementById('connsList');
    
    if (alertsList && data.alerts) {
        alertsList.innerHTML = '';
        data.alerts.forEach(item => {
            const style = getAlertStyle(item.id);
            const li = document.createElement('li');
            li.className = 'flex justify-between py-2 px-3 border-b border-core-300 dark:border-core-800 hover:bg-core-200 dark:hover:bg-core-800/50 transition-colors text-core-800 dark:text-core-300';
            li.innerHTML = `<span><span class="px-1.5 py-0.5 rounded text-xs font-bold mr-1.5 border ${style.badgeClass}">${item.id}</span></span> <span class="font-bold text-core-600 dark:text-core-400">${item.count}</span>`;
            alertsList.appendChild(li);
        });
    }

    // 2. Connection Stats
    if (connsList && data.connections) {
        connsList.innerHTML = '';
        data.connections.forEach(c => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center py-2 px-3 border-b border-core-300 dark:border-core-800 hover:bg-core-200 dark:hover:bg-core-800/50 transition-colors text-core-800 dark:text-core-300';
            li.innerHTML = `<span class="truncate pr-2" title="${escapeHTML(c.id)}">${escapeHTML(c.id)}</span> <span class="font-bold text-core-600 dark:text-core-400 shrink-0">${c.count}</span>`;
            connsList.appendChild(li);
        });
    }

    // 3. Global Data Consumption
    if (data.totalBytes !== undefined) {
        globalTotalBytes = data.totalBytes;
        updateCounters();
    }
    
    // 4. Lifecycle Countdown
    const countdownContainer = document.getElementById('countdownContainer');
    const countdownTimer = document.getElementById('countdownTimer');
    
    if (data.timeRemaining !== undefined && countdownContainer) {
        countdownContainer.style.display = 'inline';
        countdownTimer.textContent = formatTimeRemaining(data.timeRemaining);
        
        // Critical visual alert (Red pulse if < 1 minute)
        const isCritical = data.timeRemaining < 60000; 
        if (isCritical) {
            countdownContainer.classList.add('text-red-500', 'animate-pulse');
            countdownContainer.classList.remove('text-orange-500');
        } else {
            countdownContainer.classList.add('text-orange-500');
            countdownContainer.classList.remove('text-red-500', 'animate-pulse');
        }
    }
});

socket.on('historical_logs', (packets) => {
    packetBody.innerHTML = ''; 
    packets.forEach(pkt => addPacketRow(pkt, true));
    updateCounters();
});

// ==========================================
// FUNCIONES AUXILIARES DE RENDERIZADO
// ==========================================

/**
 * Asigna un color de texto de neón específico basado en la familia del protocolo.
 * @param {string} proto - El nombre del protocolo (ej. "TCP", "HTTP", "DNS")
 * @returns {string} Clase CSS de Tailwind para dar color al texto.
 */
function getProtoClass(proto) {
    if (proto.includes('HTTP')) return 'text-core-600 dark:text-core-300 font-bold';
    if (proto.includes('DNS')) return 'text-core-500 dark:text-core-400 font-bold';
    if (proto.includes('TCP')) return 'text-core-700 dark:text-core-200 font-bold';
    if (proto.includes('UDP')) return 'text-core-500 dark:text-core-400 font-bold';
    if (proto.includes('TLS') || proto.includes('SSL')) return 'text-core-600 dark:text-core-300 font-bold';
    if (proto.includes('ICMP')) return 'text-core-800 dark:text-core-100 font-bold';
    return 'text-core-800 dark:text-core-400';
}

/**
 * Clasifica una alerta entrante y devuelve el estilo visual (colores, bordes, animaciones)
 * correspondiente a su nivel de severidad.
 * @param {string} alertName - Nombre de la alerta generada por el backend.
 * @returns {Object} Objeto con 'badgeClass' (clases CSS) y 'isCritical' (booleano).
 */
function getAlertStyle(alertName) {
    // Críticos (Rojo Parpadeante) - Mantenemos colores vivos según requerimiento
    if (alertName.includes('⚠️') || alertName.includes('🎣') || alertName.includes('XMAS') || alertName.includes('NULL') || alertName.includes('🧟') || alertName.includes('⛏️')) {
        return { badgeClass: 'border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.3)]', isCritical: true };
    }
    // Medios / Advertencias (Naranja) - Mantenemos colores vivos según requerimiento
    if (alertName.includes('🔓') || alertName.includes('SYN-SCAN') || alertName.includes('EXFILTRACIÓN') || alertName.includes('👁️') || alertName.includes('🔎')) {
        return { badgeClass: 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30', isCritical: false };
    }
    // Baja severidad o debug (Paleta Stone)
    if (alertName === 'CNN') return { badgeClass: 'border-core-400 text-core-600 dark:text-core-300 bg-core-200 dark:bg-core-800', isCritical: false };
    if (alertName === 'SYN') return { badgeClass: 'border-core-500 text-core-700 dark:text-core-200 bg-core-200 dark:bg-core-800', isCritical: false };
    
    // Por defecto (SIZE, HTTP-404, etc)
    return { badgeClass: 'border-core-300 dark:border-core-600 text-core-500 dark:text-core-400 bg-core-100 dark:bg-core-800', isCritical: false };
}

/**
 * Construye dinámicamente un elemento <tr> y lo inserta en la tabla principal.
 * Maneja la visibilidad inicial de la fila si existe un filtro de categoría activo, 
 * y gestiona el límite de filas en el DOM (MAX_ROWS).
 * @param {Object} pkt - El paquete de red procesado.
 */
function addPacketRow(pkt, isHistorical = false) {
    const d = new Date(pkt.time);
    const timeStr = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}.${d.getMilliseconds().toString().padStart(3,'0')}`;

    let alertsHtml = '';
    let hasCritical = false;
    
    if (pkt.alerts) {
        pkt.alerts.forEach(a => {
            const style = getAlertStyle(a);
            if (style.isCritical) hasCritical = true;
            alertsHtml += `<span class="px-1.5 py-0.5 rounded text-xs font-bold mr-1.5 border ${style.badgeClass}">${a}</span>`;
        });
    }

    const tr = document.createElement('tr');
    // Si hay alerta crítica, pintamos todo el fondo de la fila de rojo translúcido
    tr.className = `transition-colors ${hasCritical ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-core-900 dark:text-core-100' : 'hover:bg-core-100 dark:hover:bg-core-800/50 text-core-700 dark:text-core-300'}`;
    
    // Guardamos las alertas del paquete como un atributo "data-alerts" en la fila HTML.
    // Esto nos permite iterar sobre las filas existentes más adelante y saber qué alertas tienen sin consultar el backend.
    tr.dataset.alerts = pkt.alerts ? pkt.alerts.join('||') : '';
    tr.dataset.len = pkt.len || 0;
    
    // Si hay filtros activos (texto o categoría) y el paquete no coincide,
    // lo ocultamos inmediatamente (display: none) en lugar de no agregarlo.
    // Así no perdemos el historial si el usuario luego quita el filtro.
    let shouldHide = false;
    
    if (currentCategoryFilter && !tr.dataset.alerts.includes(currentCategoryFilter)) {
        shouldHide = true;
    }
    
    const filterText = searchInput.value.toLowerCase();
    if (filterText) {
        const rawData = Object.values(pkt).join(' ').toLowerCase();
        if (!rawData.includes(filterText)) {
            shouldHide = true;
        }
    }
    
    if (shouldHide) {
        tr.style.display = 'none';
    }
    let domainCellHtml = pkt.domain ? `<span class="font-bold text-core-900 dark:text-core-100">${escapeHTML(pkt.domain)}</span>` : '<span class="text-core-400 dark:text-core-600">-</span>';

    const tdClasses = "py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]";

    const safeInfo = escapeHTML(pkt.info || '');

    tr.innerHTML = `
        <td class="${tdClasses}">${timeStr}</td>
        <td class="${tdClasses}">${escapeHTML(pkt.src)}</td>
        <td class="${tdClasses}">${escapeHTML(pkt.sport.toString())}</td>
        <td class="${tdClasses}">${escapeHTML(pkt.dst)}</td>
        <td class="${tdClasses}">${escapeHTML(pkt.dport.toString())}</td>
        <td class="${tdClasses} ${getProtoClass(pkt.proto)}">${escapeHTML(pkt.proto)}</td>
        <td class="${tdClasses}">${pkt.len || '-'}</td>
        <td class="${tdClasses}">${domainCellHtml}</td>
        <td class="${tdClasses}" title="${safeInfo}">${alertsHtml}${safeInfo}</td>
    `;

    packetBody.prepend(tr);
    if (!isHistorical) {
        totalPackets++;
    }

    // Mantenimiento de memoria (MAX_ROWS)
    if (packetBody.children.length > MAX_ROWS) {
        let nodeToRemove = packetBody.lastElementChild;
        
        // Si hay algún filtro activo, buscamos desde el final (el más viejo)
        // el primer paquete que esté OCULTO para borrarlo, preservando así
        // los paquetes visibles que el usuario está analizando.
        if (currentCategoryFilter || searchInput.value) {
            let tempNode = packetBody.lastElementChild;
            while (tempNode) {
                if (tempNode.style.display === 'none') {
                    nodeToRemove = tempNode;
                    break;
                }
                tempNode = tempNode.previousElementSibling;
            }
        }
        
        if (nodeToRemove) {
            nodeToRemove.remove();
        }
    }
}

let timeout = null;
searchInput.addEventListener('keyup', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const filterText = searchInput.value.toLowerCase();
        const rows = packetBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const rawData = row.textContent.toLowerCase();
            
            // Si el texto de la fila NO incluye la búsqueda, la ocultamos
            if (filterText && !rawData.includes(filterText)) {
                row.style.display = 'none';
            } else {
                // Si la búsqueda coincide, pero tenemos un filtro de categoría activo,
                // respetamos el filtro de categoría.
                const rowAlerts = row.dataset.alerts || '';
                if (currentCategoryFilter && !rowAlerts.includes(currentCategoryFilter)) {
                    row.style.display = 'none';
                } else {
                    row.style.display = '';
                }
            }
        });
        updateCounters();
    }, 300);
});

// Lógica para limpiar las estadísticas desde la interfaz (Widgets de la izquierda)
// Emite un evento al backend para que borre los registros correspondientes en SQLite.
document.getElementById('resetAlertsBtn')?.addEventListener('click', () => {
    socket.emit('clear_stats', 'alerts');
});

document.getElementById('resetConnsBtn')?.addEventListener('click', () => {
    socket.emit('clear_stats', 'connections');
});

document.getElementById('factoryResetBtn')?.addEventListener('click', () => {
    const dict = translations[currentLang];
    const msg = dict['factory_reset_confirm'] || '¡ATENCIÓN! Esto eliminará permanentemente TODA la evidencia. ¿Estás seguro?';
    if (confirm(msg)) {
        socket.emit('factory_reset');
        totalPackets = 0;
        pktCounter.textContent = '0';
        packetBody.innerHTML = '';
        updateCounters();
    }
});

// Elementos del DOM para los botones de filtrado de categorías (ej. Botnet, Trojan)
const filterBtns = document.querySelectorAll('.filter-btn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

/**
 * Aplica el filtro de categoría seleccionada a los paquetes que YA están en la pantalla.
 * @param {string} filterValue - El valor de data-filter (ej. "BOTNET") o vacío para "All"
 */
function applyCategoryFilter(filterValue) {
    currentCategoryFilter = filterValue;
    
    // 1. Actualizar el estilo visual de los botones (efecto Stone para el activo)
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filterValue) {
            btn.classList.add('active', 'bg-core-300', 'dark:bg-core-700', 'text-core-900', 'dark:text-core-100', 'border-core-400', 'dark:border-core-600');
            btn.classList.remove('bg-core-200', 'dark:bg-core-800', 'text-core-600', 'dark:text-core-400', 'border-core-300', 'dark:border-core-700', 'hover:bg-core-300', 'dark:hover:bg-core-700');
        } else {
            btn.classList.remove('active', 'bg-core-300', 'dark:bg-core-700', 'text-core-900', 'dark:text-core-100', 'border-core-400', 'dark:border-core-600');
            btn.classList.add('bg-core-200', 'dark:bg-core-800', 'text-core-600', 'dark:text-core-400', 'border-core-300', 'dark:border-core-700', 'hover:bg-core-300', 'dark:hover:bg-core-700');
        }
    });

    socket.emit('request_filter_history', filterValue);
    
    if (connStatus) {
        if (filterValue) {
            connStatus.textContent = 'SQLite';
            connStatus.className = 'text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.4)] font-bold';
        } else {
            connStatus.textContent = translations[currentLang]?.['live'] || 'Live';
            connStatus.className = 'text-neon-green drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]';
        }
    }
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        applyCategoryFilter(btn.dataset.filter);
    });
});

clearFiltersBtn?.addEventListener('click', () => {
    applyCategoryFilter('');
});

// ==========================================
// TEMA CLARO / OSCURO (DARK MODE TOGGLE)
// ==========================================
const themeToggleBtn = document.getElementById('themeToggleBtn');
const htmlEl = document.documentElement;

// Las preferencias de UI (Tema e Idioma) se guardan en localStorage para no sobrecargar las peticiones HTTP.

function setTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}

themeToggleBtn?.addEventListener('click', () => {
    setTheme(!document.documentElement.classList.contains('dark'));
});

// Inicializar tema y barra de búsqueda
setTheme(localStorage.getItem('theme') !== 'light');
searchInput.value = ''; // Limpiar barra al recargar

// ==========================================
// INTERNACIONALIZACIÓN (I18N)
// ==========================================
let currentLang = localStorage.getItem('appLang') || 'es';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    const dict = translations[lang];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });

    const toggleLangBtn = document.getElementById('toggleLangBtn');
    if (toggleLangBtn) {
        toggleLangBtn.textContent = lang === 'es' ? 'EN' : 'ES';
    }

    // Actualizar estado de conexión dinámico
    if (typeof updateConnStatusText === 'function') {
        updateConnStatusText();
    }
}

const toggleLangBtn = document.getElementById('toggleLangBtn');
if (toggleLangBtn) {
    toggleLangBtn.addEventListener('click', () => {
        setLanguage(currentLang === 'es' ? 'en' : 'es');
    });
}

// Inicializar idioma
setLanguage(currentLang);

// ==========================================
// LÓGICA DEL PANEL DE LEYENDA (PUSH EFFECT)
// ==========================================
const toggleLegendBtn = document.getElementById('toggleLegendBtn');
const closeLegendBtn = document.getElementById('closeLegendBtn');
const legendSidebar = document.getElementById('legendSidebar');

function toggleLegend() {
    if (legendSidebar.classList.contains('-mr-80')) {
        legendSidebar.classList.remove('-mr-80');
    } else {
        legendSidebar.classList.add('-mr-80');
    }
}

toggleLegendBtn?.addEventListener('click', toggleLegend);
closeLegendBtn?.addEventListener('click', toggleLegend);
