<!--
/**
 * ConnectionsWidget Component
 * 
 * Widget del panel lateral que muestra las conexiones recurrentes (IP de origen a IP de destino y puerto).
 * 
 * @vue-prop {Array} connections - Lista de conexiones ordenadas por frecuencia de paquetes enviados.
 * @vue-prop {Function} escapeHTML - Función de utilidad para prevenir XSS al renderizar IPs.
 * @vue-event clear-stats - Emite un evento para limpiar el conteo de estadísticas.
 */
-->
<template>
  <UiWidgetPanel 
    :title="$t('recurrent_conn_title')"
    :col-left="$t('ip_origin_dest_col')"
    :col-right="$t('pkts_sent_col')">
    
    <li v-for="conn in connections" :key="conn.id" class="flex justify-between py-2 px-3 border-b border-stone-300 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800/50 transition-colors text-stone-800 dark:text-stone-300">
      <span class="font-bold text-stone-500 dark:text-stone-500 truncate mr-2" v-html="escapeHTML(conn.id)"></span>
      <span class="font-bold text-stone-800 dark:text-stone-300 shrink-0">{{ conn.count }}</span>
    </li>
    <li v-if="!connections || connections.length === 0" class="text-xs text-stone-500 dark:text-stone-500 text-center py-2 italic">
      {{ $t('no_connections') }}
    </li>
  </UiWidgetPanel>
</template>

<script setup>
import UiWidgetPanel from './UiWidgetPanel.vue';
import UiButton from './UiButton.vue';

defineProps({
  connections: { type: Array, default: () => [] },
  escapeHTML: { type: Function, required: true }
});

defineEmits(['clear-stats']);
</script>
