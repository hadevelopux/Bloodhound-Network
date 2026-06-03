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

const socket = io();
const packetBody = document.getElementById('packetBody');
const pktCounter = document.getElementById('pktCounter');
const connStatus = document.getElementById('connStatus');
const searchInput = document.getElementById('searchInput');

let totalPackets = 0;
const MAX_ROWS = 1000;
let currentCategoryFilter = '';

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

socket.on('packet', (pkt) => {
    const filterText = searchInput.value.toLowerCase();
    const rawData = Object.values(pkt).join(' ').toLowerCase();
    
    if (filterText && !rawData.includes(filterText)) {
        return; 
    }

    if (currentCategoryFilter) {
        let hasCategory = false;
        if (pkt.alerts && pkt.alerts.length > 0) {
            for (const alert of pkt.alerts) {
                if (alert.includes(currentCategoryFilter)) {
                    hasCategory = true;
                    break;
                }
            }
        }
        if (!hasCategory) return;
    }

    addPacketRow(pkt);
});

socket.on('stats_update', (stats) => {
    const alertsList = document.getElementById('alertsList');
    const connsList = document.getElementById('connsList');
    
    if (alertsList && stats.alerts) {
        alertsList.innerHTML = '';
        stats.alerts.forEach(item => {
            const style = getAlertStyle(item.id);
            const li = document.createElement('li');
            li.className = 'flex justify-between py-2 px-3 border-b border-white/5 hover:bg-white/5 transition-colors';
            li.innerHTML = `<span><span class="px-1.5 py-0.5 rounded text-xs font-bold mr-1.5 border ${style.badgeClass}">${item.id}</span></span> <span class="text-neon-yellow font-bold">${item.count}</span>`;
            alertsList.appendChild(li);
        });
    }

    if (connsList && stats.connections) {
        connsList.innerHTML = '';
        stats.connections.forEach(item => {
            const li = document.createElement('li');
            li.className = 'flex justify-between py-2 px-3 border-b border-white/5 hover:bg-white/5 transition-colors';
            li.innerHTML = `<span>${escapeHTML(item.id)}</span> <span class="text-neon-yellow font-bold">${item.count}</span>`;
            connsList.appendChild(li);
        });
    }
});

function getProtoClass(proto) {
    if (proto.includes('HTTP')) return 'text-neon-green';
    if (proto.includes('DNS')) return 'text-neon-cyan';
    if (proto.includes('TCP')) return 'text-neon-yellow';
    if (proto.includes('UDP')) return 'text-neon-cyan';
    if (proto.includes('TLS') || proto.includes('SSL')) return 'text-neon-purple';
    if (proto.includes('ICMP')) return 'text-neon-red';
    return '';
}

function getAlertStyle(alertName) {
    // Críticos (Rojo Parpadeante)
    if (alertName.includes('⚠️') || alertName.includes('🎣') || alertName.includes('XMAS') || alertName.includes('NULL') || alertName.includes('🧟') || alertName.includes('⛏️')) {
        return { badgeClass: 'border-neon-red text-neon-red bg-[#ff003c]/30 animate-pulse shadow-[0_0_8px_rgba(255,0,60,0.6)]', isCritical: true };
    }
    // Medios / Advertencias (Naranja)
    if (alertName.includes('🔓') || alertName.includes('SYN-SCAN') || alertName.includes('EXFILTRACIÓN') || alertName.includes('👁️') || alertName.includes('🔎')) {
        return { badgeClass: 'border-orange-500 text-orange-400 bg-orange-500/20', isCritical: false };
    }
    // Baja severidad o debug
    if (alertName === 'CNN') return { badgeClass: 'border-neon-cyan text-neon-cyan bg-[#00f0ff]/10', isCritical: false };
    if (alertName === 'SYN') return { badgeClass: 'border-neon-yellow text-neon-yellow bg-[#fcee0a]/10', isCritical: false };
    
    // Por defecto (SIZE, HTTP-404, etc)
    return { badgeClass: 'border-slate-500 text-slate-300 bg-slate-500/20', isCritical: false };
}

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
    tr.className = `transition-colors ${hasCritical ? 'bg-red-900/30 hover:bg-red-900/50' : 'hover:bg-white/5'}`;

    let domainHtml = pkt.domain ? `<span class="neon-text-cyan">[${escapeHTML(pkt.domain)}]</span> ` : '';

    const tdClasses = "py-2 px-4 border-b border-white/5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]";

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

document.getElementById('resetAlertsBtn')?.addEventListener('click', () => {
    socket.emit('clear_stats', 'alerts');
});

document.getElementById('resetConnsBtn')?.addEventListener('click', () => {
    socket.emit('clear_stats', 'connections');
});

const filterBtns = document.querySelectorAll('.filter-btn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

function applyCategoryFilter(filterValue) {
    currentCategoryFilter = filterValue;
    
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filterValue) {
            btn.classList.add('active', 'bg-neon-cyan/20', 'text-neon-cyan', 'border-neon-cyan/50', 'shadow-[0_0_8px_rgba(0,240,255,0.2)]');
            btn.classList.remove('bg-white/5', 'text-slate-300', 'border-white/10');
        } else {
            btn.classList.remove('active', 'bg-neon-cyan/20', 'text-neon-cyan', 'border-neon-cyan/50', 'shadow-[0_0_8px_rgba(0,240,255,0.2)]');
            btn.classList.add('bg-white/5', 'text-slate-300', 'border-white/10');
        }
    });

    packetBody.innerHTML = '';
    totalPackets = 0;
    pktCounter.textContent = '0';
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        applyCategoryFilter(btn.dataset.filter);
    });
});

clearFiltersBtn?.addEventListener('click', () => {
    applyCategoryFilter('');
});
