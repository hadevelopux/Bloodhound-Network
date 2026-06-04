<!--
/**
 * UiInput Component
 * 
 * Un componente de campo de texto reutilizable, diseñado para el buscador global.
 * 
 * @vue-prop {String} modelValue - El valor actual del input (para usar con v-model).
 * @vue-prop {String} placeholder - El texto de ayuda que se muestra cuando está vacío.
 * @vue-event {String} input-change - Emite el nuevo valor cada vez que el usuario teclea.
 */
-->
<template>
  <div class="relative w-full max-w-xs">
    <input 
      type="text" 
      :value="modelValue"
      @input="$emit('input-change', $event.target.value)"
      :placeholder="placeholder"
      class="w-full bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-sm rounded-md focus:ring-neon-cyan focus:border-neon-cyan block p-2 font-mono shadow-inner transition-colors"
    >
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Filter...' }
});
defineEmits(['input-change']);
</script>
