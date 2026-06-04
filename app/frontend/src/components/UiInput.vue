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
      class="bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 px-4 py-2 rounded-md font-mono w-64 md:w-[350px] outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-all"
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
