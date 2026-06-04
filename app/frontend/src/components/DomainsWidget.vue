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
    title="Rastreo y Adware (Top)"
    col-left="DOMINIO"
    col-right="PETICIONES">
    <template #header-actions>
      <UiButton variant="danger" @click="$emit('clear-stats')" title="Limpiar Estadísticas">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </UiButton>
    </template>
    
    <li v-for="dom in domains" :key="dom.id" class="flex justify-between py-2 px-3 border-b border-stone-300 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800/50 transition-colors text-stone-800 dark:text-stone-300">
      <span class="font-bold text-stone-500 dark:text-stone-500 truncate mr-2" v-html="escapeHTML(dom.id)"></span>
      <span class="font-bold text-neon-purple shrink-0">{{ dom.count }}</span>
    </li>
    <li v-if="!domains || domains.length === 0" class="text-xs text-stone-500 dark:text-stone-500 text-center py-2 italic">
      Sin rastreadores detectados
    </li>
  </UiWidgetPanel>
</template>

<script setup>
import UiWidgetPanel from './UiWidgetPanel.vue';
import UiButton from './UiButton.vue';

defineProps({
  domains: { type: Array, default: () => [] },
  escapeHTML: { type: Function, required: true }
});

defineEmits(['clear-stats']);
</script>
