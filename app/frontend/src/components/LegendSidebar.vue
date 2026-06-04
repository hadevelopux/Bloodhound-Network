<!--
/**
 * LegendSidebar Component
 * 
 * Barra lateral deslizante que contiene la leyenda de amenazas, explicando cada alerta
 * que el sistema puede detectar.
 * 
 * @vue-prop {Boolean} show - Controla la visibilidad de la barra lateral.
 * @vue-event close - Emite un evento para cerrar la barra lateral.
 */
-->
<template>
  <div v-if="show" class="fixed inset-y-0 right-0 w-80 bg-stone-50 dark:bg-stone-950 border-l border-stone-300 dark:border-stone-800 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
    <div class="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-white dark:bg-stone-900">
      <h2 class="font-bold text-stone-800 dark:text-stone-200 text-lg flex items-center gap-2">
        <svg class="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        {{ $t('legend_title') }}
      </h2>
      <UiButton variant="icon" @click="$emit('close')">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </UiButton>
    </div>
    
    <div class="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
      <LegendItem 
        name="⚠️ DNS SECUESTRADO" 
        severity="CRÍTICO" 
        description="El tráfico DNS se dirige a un servidor no estándar. Riesgo de Phishing o suplantación." 
        trigger="Puerto 53 pero IP destino != (192.168.x / 1.1.1.1 / 8.8.8.8)"
        badgeClass="border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="🎣 PHISHING/DARKWEB" 
        severity="CRÍTICO" 
        description="Conexión hacia dominios TOR (.onion) o palabras clave asociadas a robo de credenciales." 
        trigger="Dominio incluye .onion, free-gift, paypal-secure, etc."
        badgeClass="border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="🔓 PLAINTEXT [X]" 
        severity="ALTO" 
        description="Se detectó tráfico sin cifrar (HTTP/FTP/Telnet). Contraseñas viajan en texto claro." 
        trigger="Puerto 80, 21, 23 sin uso de TLS/SSL."
        badgeClass="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="👁️ TRACKING/ADWARE" 
        severity="MEDIO" 
        description="Conexión hacia redes publicitarias o servidores masivos de telemetría." 
        trigger="Dominio incluye doubleclick, google-analytics, telemetry, etc."
        badgeClass="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
      ></LegendItem>
    </div>
  </div>
</template>

<script setup>
import UiButton from './UiButton.vue';
import LegendItem from './LegendItem.vue';

defineProps({
  show: { type: Boolean, default: false }
});
defineEmits(['close']);
</script>
