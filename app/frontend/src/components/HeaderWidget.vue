<!--
/**
 * HeaderWidget Component
 * 
 * Componente de la barra superior de la aplicación (Navbar).
 * Contiene el buscador global, estadísticas generales de captura, estado de conexión y botones de acción.
 * 
 * @vue-prop {String} connStatus - Texto de estado de conexión WebSocket.
 * @vue-prop {String} connClass - Clase CSS para el color del estado de conexión.
 * @vue-prop {Number} totalBytes - Cantidad total de bytes capturados.
 * @vue-prop {Number} totalPackets - Cantidad total de paquetes procesados.
 * @vue-prop {Number} timeRemaining - Tiempo restante antes del reinicio automático.
 * @vue-prop {Boolean} isDark - Estado del tema oscuro.
 * @vue-prop {String} filterText - Texto actual del buscador.
 * @vue-event toggle-legend - Emite evento para abrir la barra lateral de leyenda.
 * @vue-event toggle-lang - Emite evento para cambiar idioma.
 * @vue-event toggle-theme - Emite evento para cambiar el tema (dark/light).
 * @vue-event factory-reset - Emite evento para vaciar la base de datos completa.
 * @vue-event {String} update-filter - Emite el nuevo texto al tipear en el buscador.
 */
-->
<template>
  <header class="bg-white dark:bg-stone-900 border-b border-stone-300 dark:border-stone-800 p-3 md:px-6 flex justify-between items-center shrink-0">
    <div class="flex items-center gap-3">
      <h1 class="text-xl md:text-2xl font-extrabold tracking-tight"><span class="text-stone-600 dark:text-stone-400">Bloodhound</span> Forensics</h1>
    </div>
    <div class="flex items-center gap-6">
      <UiInput 
        :model-value="filterText"
        @input-change="$emit('update-filter', $event)"
        :placeholder="$t('live_filter_placeholder')">
      </UiInput>
      <div class="flex gap-6 text-sm font-mono items-center whitespace-nowrap">
        <span :class="['font-bold', connClass]">{{ connStatus }}</span>
        <div class="flex items-center gap-2 text-neon-cyan drop-shadow-[0_0_2px_rgba(0,240,255,0.8)]"><span>{{ $t('pkts') }}</span><span>{{ totalPackets }}</span></div>
        <div class="flex items-center gap-2 text-neon-purple drop-shadow-[0_0_2px_rgba(176,38,255,0.8)]"><span>{{ $t('data_used') }}</span><span>{{ formattedTotalBytes }}</span></div>
        <div v-if="timeRemaining !== null" class="flex items-center gap-1.5 text-orange-400 drop-shadow-[0_0_2px_rgba(251,146,60,0.8)]">
          <svg class="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-stone-400 dark:text-stone-500 font-sans text-xs uppercase tracking-wider">{{ $t('reset_in') }}</span>
          <span :class="['font-bold', timeRemaining <= (5 * 24 * 60 * 60 * 1000) ? 'text-red-500 animate-pulse drop-shadow-[0_0_2px_rgba(239,68,68,0.8)]' : 'text-orange-400']">
            {{ formattedTimeRemaining }}
          </span>
        </div>
        <UiButton variant="danger" @click="$emit('factory-reset')">{{ $t('factory_reset_btn') }}</UiButton>
        <UiButton @click="$emit('toggle-legend')">{{ $t('legend_btn') }}</UiButton>
        <UiButton @click="$emit('toggle-lang')">{{ $i18n.locale === 'es' ? 'EN' : 'ES' }}</UiButton>
        <UiButton variant="icon" @click="$emit('toggle-theme')">
          <svg v-if="isDark" class="w-5 h-5 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
          <svg v-else class="w-5 h-5 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        </UiButton>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiButton from './UiButton.vue';
import UiInput from './UiInput.vue';

const props = defineProps({
  connStatus: String,
  connClass: String,
  totalBytes: Number,
  totalPackets: Number,
  timeRemaining: Number,
  isDark: Boolean,
  filterText: String
});

defineEmits(['toggle-legend', 'toggle-lang', 'toggle-theme', 'factory-reset', 'update-filter']);

const { t, locale } = useI18n();

const formattedTimeRemaining = computed(() => {
  if (props.timeRemaining === null || props.timeRemaining === undefined || props.timeRemaining < 0) return '-';
  const days = Math.floor(props.timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((props.timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((props.timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}${t('days')} ${hours}${t('hours')}`;
  }
  if (hours > 0) {
    return `${hours}${t('hours')} ${minutes}m`;
  }
  return `${Math.max(0, Math.floor(props.timeRemaining / 1000))}s`;
});

const formattedTotalBytes = computed(() => {
  const bytes = props.totalBytes || 0;
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});
</script>
