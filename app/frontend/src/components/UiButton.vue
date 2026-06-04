<!--
/**
 * UiButton Component
 * 
 * Un componente de botón reutilizable con múltiples variantes de diseño.
 * 
 * @vue-prop {String} variant - La variante de diseño ('primary', 'danger', 'icon', 'ghost'). Por defecto es 'primary'.
 * @vue-prop {String} title - El texto del tooltip nativo (title html attribute).
 */
-->
<template>
  <button :class="buttonClass">
    <slot></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'primary' },
  title: { type: String, default: '' }
});

const buttonClass = computed(() => {
const base = 'inline-flex items-center justify-center font-bold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  if (props.variant === 'primary') {
    return `${base} px-3 py-1.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700`;
  }
  
  if (props.variant === 'danger') {
    return `${base} px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)] border border-red-500`;
  }
  
  if (props.variant === 'icon') {
    return `${base} p-1.5 rounded-full text-stone-600 dark:text-stone-400 hover:text-neon-cyan hover:bg-stone-200 dark:hover:bg-stone-800`;
  }
  
  if (props.variant === 'ghost') {
    return `${base} px-2 py-1 rounded text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800`;
  }
  
  return base;
});
</script>
