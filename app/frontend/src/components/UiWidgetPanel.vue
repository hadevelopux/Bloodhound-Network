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
  <div class="flex flex-col border-b border-stone-300 dark:border-stone-800">
    <div class="p-3 bg-stone-100 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
      <h2 class="text-sm font-bold text-stone-700 dark:text-stone-300">{{ title }}</h2>
      <slot name="header-actions"></slot>
    </div>
    <div class="p-3 flex-1 overflow-y-auto bg-white dark:bg-stone-950">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true }
});
</script>
