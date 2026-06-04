<!--
/**
 * UiWidgetPanel Component
 * 
 * Un componente contenedor estructurado para los widgets laterales. Provee un título
 * estándar y un slot para acciones del header (ej. botón de limpiar).
 * 
 * @vue-prop {String} title - El título que se mostrará en la cabecera del panel.
 * @vue-slot default - El contenido principal del panel.
 * @vue-slot header-actions - Acciones/botones adicionales que se muestran a la derecha del título.
 */
-->
<template>
  <div class="flex-1 flex flex-col min-h-0 border-b border-stone-300 dark:border-stone-800 bg-[#111]">
    <div class="bg-stone-200 dark:bg-stone-900 px-4 py-3 font-bold text-sm text-stone-800 dark:text-stone-200 border-b border-stone-300 dark:border-stone-800 flex justify-between items-center shrink-0">
      <span class="tracking-wide">{{ title }}</span>
      <slot name="header-actions"></slot>
    </div>
    <div v-if="colLeft || colRight" class="flex justify-between px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-600 dark:text-orange-500 border-b border-stone-300 dark:border-stone-800 bg-stone-100 dark:bg-stone-900/80 font-mono shrink-0">
      <span>{{ colLeft }}</span>
      <span>{{ colRight }}</span>
    </div>
    <ul class="flex-1 overflow-y-auto p-2.5 font-mono text-xs custom-scrollbar">
      <slot></slot>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  colLeft: { type: String, default: '' },
  colRight: { type: String, default: '' }
});
</script>
