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
  <div class="bg-transparent p-3 transition-colors">
    <div class="flex items-center gap-2 mb-2">
      <span :class="['inline-block px-1.5 py-0.5 rounded-sm text-[10px] font-bold border tracking-wider', badgeClass]">{{ name }}</span>
      <span class="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{{ severity }}</span>
    </div>
    <p class="text-xs text-stone-700 dark:text-stone-400 mb-2 leading-relaxed">{{ description }}</p>
    <div class="bg-stone-100 dark:bg-[#111] rounded-sm p-2 text-[10px] font-mono text-stone-600 dark:text-stone-500 border border-stone-300 dark:border-stone-800/50">
      <span class="font-bold text-stone-600">Trigger:</span> {{ trigger }}
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
