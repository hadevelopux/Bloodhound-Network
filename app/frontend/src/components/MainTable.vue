<!--
/**
 * MainTable Component
 * 
 * El componente principal de la aplicación. Muestra una tabla en tiempo real con
 * todos los paquetes capturados, o los datos históricos filtrados.
 * 
 * @vue-prop {Array} packets - La lista de paquetes a renderizar en la tabla.
 * @vue-prop {String} currentCategory - El filtro de categoría actualmente activo (ej. "BOTNET").
 * @vue-prop {String} filterText - El filtro de texto BPF actualmente activo.
 * @vue-prop {Function} escapeHTML - Función para sanear la salida y prevenir XSS.
 * @vue-event {String} set-category - Emite un evento para cambiar el filtro de categoría.
 * @vue-event clear-filters - Emite un evento para limpiar todos los filtros de la tabla.
 */
-->
<template>
  <div class="flex-1 overflow-hidden flex flex-col relative bg-stone-100 dark:bg-transparent">
    <div class="p-3 bg-[#111] border-b border-stone-300 dark:border-stone-800 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-6">
        <h2 class="text-[10px] uppercase tracking-wider font-bold text-stone-700 dark:text-stone-200 shrink-0 w-32">{{ $t('filters_title') }}</h2>
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <button 
            @click="setCategory('')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === '' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            All
          </button>
          <button 
            @click="setCategory('BOTNET')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'BOTNET' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            Botnet
          </button>
          <button 
            @click="setCategory('TROJAN')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'TROJAN' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            Trojan/C2
          </button>
          <button 
            @click="setCategory('NMAP')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'NMAP' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            Nmap Scan
          </button>
          <button 
            @click="setCategory('PLAINTEXT')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'PLAINTEXT' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            Plaintext
          </button>
          <button 
            @click="setCategory('DNS SECUESTRADO')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'DNS SECUESTRADO' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            DNS Hijacked
          </button>
          <button 
            @click="setCategory('CRYPTO')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'CRYPTO' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            Crypto
          </button>
          <button 
            @click="setCategory('EXFILTRACIÓN')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'EXFILTRACIÓN' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            Exfiltration
          </button>
          <button 
            @click="setCategory('PHISHING')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'PHISHING' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            Phishing
          </button>
          <button 
            @click="setCategory('TRACKING')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'TRACKING' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            Tracking/Adware
          </button>
          <button 
            @click="setCategory('SYN-SCAN')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'SYN-SCAN' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            SYN-Scan
          </button>
          <button 
            @click="setCategory('LOCAL')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'LOCAL' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            Local Scan
          </button>
          <button 
            @click="setCategory('HTTP-404')"
            :class="['px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider transition-colors', currentCategory === 'HTTP-404' ? 'bg-stone-700 text-stone-100 dark:bg-stone-700/50 dark:text-white border border-stone-500' : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200']">
            HTTP-404
          </button>
        </div>
      </div>
      <UiButton v-if="filterText || currentCategory" variant="ghost" @click="clearFilters">
        {{ $t('clear_filter_btn') }}
      </UiButton>
    </div>
    
    <div class="flex-1 overflow-hidden flex flex-col relative">
      <div class="w-full h-full overflow-auto custom-scrollbar">
        <table class="w-full text-left text-[10px] whitespace-nowrap min-w-[800px]">
          <thead class="sticky top-0 bg-stone-300 dark:bg-[#111] text-stone-600 dark:text-stone-400 font-bold text-xs uppercase shadow-md z-10 border-b border-stone-300 dark:border-stone-800">
            <tr>
              <th class="px-4 py-3 w-32">{{ $t('time_col') }}</th>
              <th class="px-4 py-3">{{ $t('origin_col') }}</th>
              <th class="px-4 py-3">{{ $t('p_origin_col') }}</th>
              <th class="px-4 py-3">{{ $t('dest_col') }}</th>
              <th class="px-4 py-3">{{ $t('p_dest_col') }}</th>
              <th class="px-4 py-3">{{ $t('proto_col') }}</th>
              <th class="px-4 py-3">{{ $t('size_col') }}</th>
              <th class="px-4 py-3">{{ $t('domain_col') }}</th>
              <th class="px-4 py-3 w-64 text-right">{{ $t('info_alerts_col') }}</th>
            </tr>
          </thead>
          <tbody class="font-mono text-xs font-medium">
            <tr v-for="pkt in packets" :key="pkt.id" 
                :class="[getRowClass(pkt), 'border-b border-stone-200 dark:border-stone-800/50 transition-colors duration-150 group']">
              <td class="px-4 py-2 text-stone-500 dark:text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-300">{{ formatTime(pkt.timestamp) }}</td>
              <td class="px-4 py-2" v-html="escapeHTML(pkt.src)"></td>
              <td class="px-4 py-2 text-stone-500 dark:text-stone-500" v-html="escapeHTML(pkt.sport)"></td>
              <td class="px-4 py-2" v-html="escapeHTML(pkt.dst)"></td>
              <td class="px-4 py-2 text-stone-500 dark:text-stone-500" v-html="escapeHTML(pkt.dport)"></td>
              <td class="px-4 py-2 text-stone-600 dark:text-stone-400">{{ pkt.proto }}</td>
              <td class="px-4 py-2 text-stone-600 dark:text-stone-400">{{ pkt.size }}</td>
              <td class="px-4 py-2 text-stone-600 dark:text-stone-400 truncate max-w-[200px]" :title="pkt.domain || '-'">{{ pkt.domain || '-' }}</td>
              <td class="px-4 py-2 text-right">
                <div class="flex flex-wrap justify-end gap-1">
                  <span v-if="!pkt.alerts || pkt.alerts.length === 0" class="text-stone-400 dark:text-stone-600">-</span>
                  <AlertBadge v-for="(alert, idx) in pkt.alerts" :key="idx" :name="alert"></AlertBadge>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="packets.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="text-stone-400 dark:text-stone-600 flex flex-col items-center">
            <svg class="w-12 h-12 mb-3 animate-pulse opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <span class="text-sm font-bold tracking-widest uppercase">{{ $t('listening_msg') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import UiButton from './UiButton.vue';
import AlertBadge from './AlertBadge.vue';

defineProps({
  packets: { type: Array, default: () => [] },
  currentCategory: { type: String, default: '' },
  filterText: { type: String, default: '' },
  escapeHTML: { type: Function, required: true }
});

const emit = defineEmits(['set-category', 'clear-filters']);

function setCategory(cat) {
  emit('set-category', cat);
}

function clearFilters() {
  emit('clear-filters');
}

function formatTime(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('es-ES', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }) + '.' + d.getMilliseconds().toString().padStart(3, '0');
}

function getRowClass(pkt) {
  if (pkt.alerts && pkt.alerts.some(a => a.includes('⚠️') || a.includes('🎣') || a.includes('XMAS') || a.includes('NULL') || a.includes('🧟') || a.includes('⛏️'))) {
    return 'hover:bg-red-100 dark:hover:bg-red-900/40 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200';
  }
  if (pkt.alerts && pkt.alerts.length > 0) {
    return 'hover:bg-stone-100 dark:hover:bg-stone-800/50 bg-orange-50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-200';
  }
  return 'hover:bg-stone-100 dark:hover:bg-stone-800/50 bg-white dark:bg-transparent text-stone-700 dark:text-stone-300';
}
</script>
