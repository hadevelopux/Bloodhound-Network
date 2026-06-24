<template>
  <div class="h-full w-full flex">
    
    <div class="flex-1 h-full flex flex-col overflow-hidden min-w-0">
      <HeaderWidget 
        :connStatus="connStatus"
        :connClass="connClass"
        :totalBytes="totalBytes"
        :totalPackets="totalPackets"
        :timeRemaining="timeRemaining"
        :isDark="isDark"
        :filterText="filterText"
        @toggle-legend="showLegend = true"
        @toggle-lang="toggleLang"
        @toggle-theme="toggleTheme"
        @factory-reset="factoryReset"
        @update-filter="applyTextFilter"
      />

      <div class="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <aside class="flex flex-col lg:w-[400px] xl:w-[450px] h-full shrink-0 border-r border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 overflow-hidden">
          <AlertsWidget 
            :alerts="stats.alerts" 
            @clear-stats="socket.emit('request_clear_stats')">
          </AlertsWidget>

          <ConnectionsWidget 
            :connections="stats.connections" 
            :escapeHTML="escapeHTML"
            @clear-stats="socket.emit('request_clear_stats')">
          </ConnectionsWidget>

          <DomainsWidget
            :domains="stats.trackingDomains"
            :escapeHTML="escapeHTML"
            @clear-stats="socket.emit('request_clear_stats')">
          </DomainsWidget>
        </aside>

        <MainTable
          :packets="filteredPackets"
          :currentCategory="currentCategoryFilter"
          :filterText="filterText"
          :escapeHTML="escapeHTML"
          @set-category="setCategory"
          @clear-filters="clearFilters"
        />
      </div>

    </div>

    <LegendSidebar 
      :show="showLegend"
      @close="showLegend = false"
    />

  </div>
</template>

<script setup>
import { ref, shallowRef, reactive, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import HeaderWidget from './components/HeaderWidget.vue';
import AlertsWidget from './components/AlertsWidget.vue';
import ConnectionsWidget from './components/ConnectionsWidget.vue';
import DomainsWidget from './components/DomainsWidget.vue';
import MainTable from './components/MainTable.vue';
import LegendSidebar from './components/LegendSidebar.vue';
import { io } from 'socket.io-client';

const { locale } = useI18n();

const packets = shallowRef([]);
const packetBuffer = [];
const stats = reactive({
  alerts: [],
  connections: [],
  trackingDomains: []
});
const totalBytes = ref(0);
const totalPackets = ref(0);
const timeRemaining = ref(null);
const connStatus = ref('Disconnected');
const connClass = ref('text-red-500');
const filterText = ref('');
const currentCategoryFilter = ref('');
const isDark = ref(localStorage.getItem('bloodhound_theme') !== 'light');
const showLegend = ref(false);
let socket = null;

const filteredPackets = computed(() => {
  return packets.value.filter(pkt => {
    if (filterText.value) {
      const text = filterText.value.toLowerCase();
      const rawData = JSON.stringify(pkt).toLowerCase();
      if (!rawData.includes(text)) return false;
    }
    if (currentCategoryFilter.value) {
      if (!pkt.alerts || !pkt.alerts.some(a => a.includes(currentCategoryFilter.value))) {
        return false;
      }
    }
    return true;
  });
});

const applyTextFilter = (text) => {
  filterText.value = text;
  if (socket) socket.emit('request_filter_history', filterText.value);
};

const setCategory = (cat) => {
  currentCategoryFilter.value = cat;
  if (socket) socket.emit('request_filter_history', cat);
};

const clearFilters = () => {
  filterText.value = '';
  currentCategoryFilter.value = '';
  if (socket) socket.emit('request_filter_history', '');
};

const factoryReset = () => {
  socket.emit('factory_reset');
  packets.value = [];
  stats.alerts = [];
  stats.connections = [];
  stats.trackingDomains = [];
  totalBytes.value = 0;
};

const toggleLang = () => {
  locale.value = locale.value === 'es' ? 'en' : 'es';
  localStorage.setItem('bloodhound_lang', locale.value);
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('bloodhound_theme', isDark.value ? 'dark' : 'light');
  applyTheme();
};

const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const escapeHTML = (str) => {
  if (!str) return '';
  return str.toString().replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag])
  );
};

onMounted(() => {
  applyTheme();
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  socket = io(wsUrl, { transports: ['websocket', 'polling'] });
  
  // Flush buffer periodically to avoid UI freezing from deep reactivity proxies
  setInterval(() => {
    if (packetBuffer.length > 0) {
      packets.value = [...packetBuffer, ...packets.value].slice(0, 1000);
      packetBuffer.length = 0;
    }
  }, 200);
  
  socket.on('connect', () => {
    connStatus.value = 'Live';
    connClass.value = 'text-neon-green';
    if (filterText.value || currentCategoryFilter.value) {
      socket.emit('request_filter_history', currentCategoryFilter.value || filterText.value);
    }
  });

  socket.on('disconnect', () => {
    connStatus.value = 'Offline';
    connClass.value = 'text-red-500';
  });

  socket.on('stats_update', (data) => {
    if (data.alerts) stats.alerts = data.alerts;
    if (data.connections) stats.connections = data.connections;
    if (data.trackingDomains) stats.trackingDomains = data.trackingDomains;
    if (data.totalBytes !== undefined) totalBytes.value = data.totalBytes;
    if (data.totalPackets !== undefined) totalPackets.value = data.totalPackets;
    if (data.timeRemaining !== undefined) timeRemaining.value = data.timeRemaining;
  });

  socket.on('packet', (pkt) => {
    if (filterText.value === '' && currentCategoryFilter.value === '') {
      packetBuffer.unshift(pkt);
    }
    totalPackets.value++;
    if (pkt.len) {
      totalBytes.value += parseInt(pkt.len);
    }
  });

  socket.on('historical_logs', (historicalData) => {
    packets.value = historicalData;
    // Si se vacía completamente, reseteamos contadores
    if (historicalData.length === 0) {
      totalPackets.value = 0;
      totalBytes.value = 0;
    }
  });

  socket.on('factory_reset_completed', () => {
    window.location.reload();
  });
});
</script>
