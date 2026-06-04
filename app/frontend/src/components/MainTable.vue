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
  <div class="flex-1 overflow-hidden flex flex-col relative bg-stone-100 dark:bg-[#121212]">
    <div class="p-3 bg-stone-100 dark:bg-stone-900 border-b border-stone-300 dark:border-stone-800 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4">
        <h2 class="text-sm font-bold text-stone-700 dark:text-stone-300">{{ $t('filters_title') }}</h2>
        <div class="flex flex-wrap gap-2">
          <UiButton :variant="currentCategory === '' ? 'primary' : 'ghost'" @click="setCategory('')">All</UiButton>
          <UiButton :variant="currentCategory === 'BOTNET' ? 'primary' : 'ghost'" @click="setCategory('BOTNET')">Botnet</UiButton>
          <UiButton :variant="currentCategory === 'TROJAN' ? 'primary' : 'ghost'" @click="setCategory('TROJAN')">Trojan/C2</UiButton>
          <UiButton :variant="currentCategory === 'NMAP' ? 'primary' : 'ghost'" @click="setCategory('NMAP')">Nmap Scan</UiButton>
          <UiButton :variant="currentCategory === 'PLAINTEXT' ? 'primary' : 'ghost'" @click="setCategory('PLAINTEXT')">Plaintext</UiButton>
          <UiButton :variant="currentCategory === 'DNS SECUESTRADO' ? 'primary' : 'ghost'" @click="setCategory('DNS SECUESTRADO')">DNS Hijacked</UiButton>
          <UiButton :variant="currentCategory === 'CRYPTO' ? 'primary' : 'ghost'" @click="setCategory('CRYPTO')">Crypto</UiButton>
          <UiButton :variant="currentCategory === 'EXFILTRACIÓN' ? 'primary' : 'ghost'" @click="setCategory('EXFILTRACIÓN')">Exfiltration</UiButton>
          <UiButton :variant="currentCategory === 'PHISHING' ? 'primary' : 'ghost'" @click="setCategory('PHISHING')">Phishing</UiButton>
          <UiButton :variant="currentCategory === 'TRACKING' ? 'primary' : 'ghost'" @click="setCategory('TRACKING')">Tracking/Adware</UiButton>
          <UiButton :variant="currentCategory === 'SYN-SCAN' ? 'primary' : 'ghost'" @click="setCategory('SYN-SCAN')">SYN-Scan</UiButton>
          <UiButton :variant="currentCategory === 'LOCAL' ? 'primary' : 'ghost'" @click="setCategory('LOCAL')">Local Scan</UiButton>
          <UiButton :variant="currentCategory === 'HTTP-404' ? 'primary' : 'ghost'" @click="setCategory('HTTP-404')">HTTP-404</UiButton>
        </div>
      </div>
      <UiButton v-if="filterText || currentCategory" variant="ghost" @click="clearFilters">
        {{ $t('clear_filter_btn') }}
      </UiButton>
    </div>
    
    <div class="flex-1 overflow-hidden flex flex-col relative">
      <div class="w-full h-full overflow-auto custom-scrollbar">
        <table class="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead class="sticky top-0 bg-stone-200 dark:bg-stone-900 text-stone-600 dark:text-stone-400 font-bold text-xs uppercase shadow-md z-10 border-b border-stone-300 dark:border-stone-800">
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
                :class="[getRowClass(pkt), 'border-b border-stone-200 dark:border-stone-800/50 transition-colors duration-150 hover:bg-stone-200 dark:hover:bg-stone-800/80 group']">
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
    return 'bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200';
  }
  if (pkt.alerts && pkt.alerts.length > 0) {
    return 'bg-orange-50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-200';
  }
  return 'bg-white dark:bg-[#1a1a1a] text-stone-700 dark:text-stone-300';
}
</script>
