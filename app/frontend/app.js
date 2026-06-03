import './style.css';
import '@fontsource/inter';
import '@fontsource/fira-code';
import { io } from "socket.io-client";

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

// ==========================================
// EVENTOS DE WEBSOCKET (CONEXIÓN Y ESTADO)
// ==========================================

socket.on('connect', () => {
    connStatus.textContent = 'Live';
    connStatus.className = 'text-neon-green drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]';
    document.querySelector('.pulse-dot').style.animationPlayState = 'running';
});

socket.on('disconnect', () => {
    connStatus.textContent = 'Disconnected';
    connStatus.className = 'text-neon-red';
    document.querySelector('.pulse-dot').style.animationPlayState = 'paused';
});

socket.on('connect_error', (err) => {
    connStatus.textContent = 'Connection Error';
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
    // 1. Filtrado por texto libre (Buscador superior)
    const filterText = searchInput.value.toLowerCase();
    const rawData = Object.values(pkt).join(' ').toLowerCase();
    
    // Si hay texto en el buscador y el paquete no lo contiene, lo ignoramos por completo
    if (filterText && !rawData.includes(filterText)) {
        return; 
    }

    // 2. El paquete se agrega al DOM siempre, pero addPacketRow se encargará
    // de ocultarlo visualmente si no coincide con 'currentCategoryFilter'.
    addPacketRow(pkt);
});

/**
 * Escucha el evento 'stats_update' enviado periódicamente por el backend con los rankings.
 * Re-renderiza los widgets del lado izquierdo: "Vulnerabilidades/Alertas" y "Conexiones Recurrentes".
 * @param {Object} stats - Objeto con arreglos 'alerts' y 'connections' conteniendo objetos {id, count}.
 */
socket.on('stats_update', (stats) => {
    const alertsList = document.getElementById('alertsList');
    const connsList = document.getElementById('connsList');
    
    if (alertsList && stats.alerts) {
        alertsList.innerHTML = '';
        stats.alerts.forEach(item => {
            const style = getAlertStyle(item.id);
            const li = document.createElement('li');
            li.className = 'flex justify-between py-2 px-3 border-b border-core-300 dark:border-core-800 hover:bg-core-200 dark:hover:bg-core-800/50 transition-colors text-core-800 dark:text-core-300';
            li.innerHTML = `<span><span class="px-1.5 py-0.5 rounded text-xs font-bold mr-1.5 border ${style.badgeClass}">${item.id}</span></span> <span class="font-bold text-core-600 dark:text-core-400">${item.count}</span>`;
            alertsList.appendChild(li);
        });
    }

    if (connsList && stats.connections) {
        connsList.innerHTML = '';
        stats.connections.forEach(item => {
            const li = document.createElement('li');
            li.className = 'flex justify-between py-2 px-3 border-b border-core-300 dark:border-core-800 hover:bg-core-200 dark:hover:bg-core-800/50 transition-colors text-core-800 dark:text-core-300';
            li.innerHTML = `<span>${escapeHTML(item.id)}</span> <span class="font-bold text-core-600 dark:text-core-400">${item.count}</span>`;
            connsList.appendChild(li);
        });
    }
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
function addPacketRow(pkt) {
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
    
    // Si hay un filtro de categoría activo y este paquete NUEVO no lo contiene,
    // lo ocultamos inmediatamente (display: none) en lugar de no agregarlo.
    // Así no perdemos el historial si el usuario luego quita el filtro.
    if (currentCategoryFilter && !tr.dataset.alerts.includes(currentCategoryFilter)) {
        tr.style.display = 'none';
    }

    let domainHtml = pkt.domain ? `<span class="font-bold text-core-900 dark:text-core-100">[${escapeHTML(pkt.domain)}]</span> ` : '';

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
        <td class="${tdClasses}" title="${safeInfo}">${domainHtml}${alertsHtml}${safeInfo}</td>
    `;

    packetBody.prepend(tr);
    totalPackets++;
    pktCounter.textContent = totalPackets;

    if (packetBody.children.length > MAX_ROWS) {
        packetBody.removeChild(packetBody.lastChild);
    }
}

let timeout = null;
searchInput.addEventListener('keyup', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        packetBody.innerHTML = '';
        totalPackets = 0;
        pktCounter.textContent = '0';
    }, 500);
});

// Lógica para limpiar las estadísticas desde la interfaz (Widgets de la izquierda)
// Emite un evento al backend para que borre los registros correspondientes en SQLite.
document.getElementById('resetAlertsBtn')?.addEventListener('click', () => {
    socket.emit('clear_stats', 'alerts');
});

document.getElementById('resetConnsBtn')?.addEventListener('click', () => {
    socket.emit('clear_stats', 'connections');
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

    // 2. Iterar sobre TODAS las filas de la tabla actual y ocultar/mostrar
    // En lugar de borrar la tabla (innerHTML = ''), alteramos el display de CSS
    // para mantener el historial intacto al cambiar de filtros.
    const rows = packetBody.querySelectorAll('tr');
    rows.forEach(row => {
        if (!filterValue) {
            // Si el filtro está vacío ("All"), mostramos todas las filas
            row.style.display = '';
        } else {
            // Verificamos si el 'data-alerts' de la fila contiene la palabra clave del filtro
            const rowAlerts = row.dataset.alerts || '';
            if (rowAlerts.includes(filterValue)) {
                row.style.display = ''; // Mostrar si coincide
            } else {
                row.style.display = 'none'; // Ocultar si no coincide
            }
        }
    });
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

// Función auxiliar para leer cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Función auxiliar para guardar cookies (expira en 1 año)
function setCookie(name, value) {
    document.cookie = `${name}=${value}; path=/; max-age=31536000`;
}

// Leer preferencia inicial de las cookies (o usar oscuro por defecto)
const currentTheme = getCookie('theme') || 'dark';
if (currentTheme === 'dark') {
    htmlEl.classList.add('dark');
} else {
    htmlEl.classList.remove('dark');
}

themeToggleBtn?.addEventListener('click', () => {
    if (htmlEl.classList.contains('dark')) {
        htmlEl.classList.remove('dark');
        setCookie('theme', 'light');
    } else {
        htmlEl.classList.add('dark');
        setCookie('theme', 'dark');
    }
});
