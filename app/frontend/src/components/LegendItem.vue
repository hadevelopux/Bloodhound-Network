<!--
/**
 * LegendItem Component
 * 
 * Renderiza una tarjeta de leyenda individual para explicar una amenaza específica.
 * 
 * @vue-prop {String} name - Nombre de la amenaza o alerta.
 * @vue-prop {String} severity - Nivel de severidad (CRÍTICO, ALTO, MEDIO, BAJO).
 * @vue-prop {String} description - Descripción amigable de lo que significa esta alerta.
 * @vue-prop {String} trigger - Explicación técnica de la regla BPF o heurística que disparó la alerta.
 * @vue-prop {String} badgeClass - Clases CSS de Tailwind para estilizar el badge de acuerdo a la severidad.
 */
-->
<template>
  <div class="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-3 hover:border-neon-cyan/50 transition-colors">
    <div class="flex items-center gap-2 mb-2">
      <span :class="['inline-block px-1.5 py-0.5 rounded text-xs font-bold border', badgeClass]">{{ name }}</span>
      <span class="text-xs font-bold text-stone-500 uppercase tracking-wider">{{ severity }}</span>
    </div>
    <p class="text-sm text-stone-600 dark:text-stone-400 mb-2 leading-relaxed">{{ description }}</p>
    <div class="bg-stone-50 dark:bg-stone-950 rounded p-2 text-xs font-mono text-stone-500 dark:text-stone-500">
      <span class="font-bold text-stone-600 dark:text-stone-400">Trigger:</span> {{ trigger }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: String,
  severity: String,
  description: String,
  trigger: String,
  badgeClass: String
});
</script>
