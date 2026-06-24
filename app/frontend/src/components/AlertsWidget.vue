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
  <UiWidgetPanel 
    :title="$t('alerts_widget_title')"
    :col-left="$t('alert_type_col')"
    :col-right="$t('occurrences_col')">
    
    <li v-for="alert in sortedAlerts" :key="alert.id" class="flex justify-between py-2 px-3 border-b border-stone-300 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800/50 transition-colors text-stone-800 dark:text-stone-300">
      <span>
        <AlertBadge :name="alert.id" class="mr-1.5" :pulsing="false"></AlertBadge>
      </span>
      <span class="font-bold text-stone-600 dark:text-stone-400">{{ alert.count }}</span>
    </li>
    <li v-if="!alerts || alerts.length === 0" class="text-xs text-stone-500 text-center py-4 italic">
      {{ $t('no_alerts') }}
    </li>
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
