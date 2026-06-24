<!--
/**
 * AlertBadge Component
 * 
 * Renderiza una pequeña insignia (badge) de alerta basada en el tipo de amenaza detectada.
 * Utiliza clases CSS condicionales para dar colores distintos según la severidad.
 * 
 * @vue-prop {String} name - El nombre de la alerta (ej. "BOTNET", "TROJAN", "PLAINTEXT").
 * @vue-prop {Boolean} pulsing - Si la insignia debe parpadear (animate-pulse) para alertas críticas.
 */
-->
<template>
  <span :class="['inline-block px-1.5 py-0.5 rounded text-xs font-bold border', styleObj.badgeClass]">
    {{ name }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: { type: String, required: true },
  pulsing: { type: Boolean, default: true }
});

const styleObj = computed(() => {
  const alertName = props.name || '';
  
  if (alertName.includes('⚠️') || alertName.includes('🎣') || alertName.includes('XMAS') || alertName.includes('NULL') || alertName.includes('🧟') || alertName.includes('⛏️')) {
    const pulseClass = props.pulsing ? 'animate-pulse' : '';
    return { badgeClass: `border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 shadow-[0_0_8px_rgba(239,68,68,0.3)] ${pulseClass}`, isCritical: true };
  }
  
  if (alertName.includes('🔓') || alertName.includes('SYN-SCAN') || alertName.includes('EXFILTRACIÓN') || alertName.includes('👁️') || alertName.includes('🔎') || alertName.includes('EXFILTRATION') || alertName.includes('TRACKING') || alertName.includes('PLAINTEXT')) {
    return { badgeClass: 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30', isCritical: false };
  }
  
  if (alertName === 'CNN') return { badgeClass: 'border-stone-400 text-stone-600 dark:text-stone-300 bg-stone-200 dark:bg-stone-800', isCritical: false };
  if (alertName === 'SYN') return { badgeClass: 'border-stone-500 text-stone-700 dark:text-stone-200 bg-stone-200 dark:bg-stone-800', isCritical: false };
  
  return { badgeClass: 'border-stone-500 text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-900/30', isCritical: false };
});
</script>
