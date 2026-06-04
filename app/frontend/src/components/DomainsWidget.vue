<!--
/**
 * DomainsWidget Component
 * 
 * Widget del panel lateral que muestra los dominios de rastreo/adware más frecuentes.
 * 
 * @vue-prop {Array} domains - Lista de dominios ordenados por frecuencia.
 * @vue-prop {Function} escapeHTML - Función de utilidad para sanear strings.
 * @vue-event clear-stats - Emite un evento para limpiar el conteo de estadísticas.
 */
-->
<template>
  <UiWidgetPanel 
    :title="$t('threat_domains_title')"
    :col-left="$t('domain_col_header')"
    :col-right="'FILTROS / ' + $t('requests_col')">
    
    <li v-for="dom in parsedDomains" :key="dom.id" class="flex justify-between items-center py-2 px-3 border-b border-stone-300 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800/50 transition-colors text-stone-800 dark:text-stone-300">
      <span class="font-bold text-stone-500 dark:text-stone-500 truncate min-w-0 flex-1 mr-2" v-html="escapeHTML(dom.domain)"></span>
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase truncate max-w-[100px]">{{ dom.alert }}</span>
        <span class="font-bold text-stone-800 dark:text-stone-300 w-8 text-right">{{ dom.count }}</span>
      </div>
    </li>
    <li v-if="!parsedDomains || parsedDomains.length === 0" class="text-xs text-stone-500 text-center py-4 italic">
      {{ $t('no_trackers') }}
    </li>
  </UiWidgetPanel>
</template>

<script setup>
import { computed } from 'vue';
import UiWidgetPanel from './UiWidgetPanel.vue';

const props = defineProps({
  domains: { type: Array, default: () => [] },
  escapeHTML: { type: Function, required: true }
});

const parsedDomains = computed(() => {
  return props.domains.map(dom => {
    const parts = dom.id.split('|');
    const domain = parts[0];
    const alert = parts.length > 1 ? parts[1] : 'UNKNOWN';
    return {
      id: dom.id,
      domain: domain,
      alert: alert,
      count: dom.count
    };
  });
});

defineEmits(['clear-stats']);
</script>
