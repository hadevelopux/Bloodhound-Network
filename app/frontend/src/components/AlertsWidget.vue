<!--
/**
 * AlertsWidget Component
 * 
 * Widget del panel lateral que muestra el conteo de alertas (vulnerabilidades) detectadas en la red.
 * Ordena las alertas por cantidad de ocurrencias de forma descendente.
 * 
 * @vue-prop {Array} alerts - Lista de objetos de alerta provenientes de las estadísticas agregadas.
 * @vue-event clear-stats - Emite un evento para solicitar al backend la limpieza de las estadísticas.
 */
-->
<template>
  <UiWidgetPanel :title="$t('alerts_widget_title')">
    <template #header-actions>
      <UiButton variant="danger" @click="$emit('clear-stats')" :title="$t('clear_stats_btn')">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </UiButton>
    </template>
    
    <div class="flex justify-between text-[10px] text-stone-500 font-bold mb-2 uppercase tracking-wider px-1">
      <span>{{ $t('alert_type_col') }}</span>
      <span>{{ $t('occurrences_col') }}</span>
    </div>
    
    <div class="space-y-2">
      <div v-for="alert in sortedAlerts" :key="alert.id" class="flex justify-between items-center group">
        <AlertBadge :name="alert.id" :pulsing="false"></AlertBadge>
        <span class="text-xs font-bold text-stone-600 dark:text-stone-400 group-hover:text-neon-cyan transition-colors">{{ alert.count }}</span>
      </div>
      <div v-if="!alerts || alerts.length === 0" class="text-xs text-stone-500 text-center py-4 italic">
        {{ $t('no_alerts') }}
      </div>
    </div>
  </UiWidgetPanel>
</template>

<script setup>
import { computed } from 'vue';
import UiWidgetPanel from './UiWidgetPanel.vue';
import UiButton from './UiButton.vue';
import AlertBadge from './AlertBadge.vue';

const props = defineProps({
  alerts: { type: Array, default: () => [] }
});

defineEmits(['clear-stats']);

const sortedAlerts = computed(() => {
  if (!props.alerts) return [];
  return [...props.alerts].sort((a, b) => b.count - a.count);
});
</script>
