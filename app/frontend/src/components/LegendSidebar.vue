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
  <div v-if="show" class="fixed inset-y-0 right-0 w-80 bg-[#111] border-l border-stone-300 dark:border-stone-800 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
    <div class="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-[#111]">
      <h2 class="font-bold text-stone-800 dark:text-stone-200 text-lg flex items-center gap-2">
        <svg class="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        {{ $t('legend_title') }}
      </h2>
      <UiButton variant="icon" @click="$emit('close')">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </UiButton>
    </div>
    
    <div class="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar bg-[#1a1a1a]">
      <LegendItem 
        name="⚠️ DNS SECUESTRADO" 
        severity="CRÍTICO" 
        description="El tráfico DNS se dirige a un servidor no estándar. Riesgo de Phishing o suplantación." 
        trigger="Puerto 53 pero IP destino != (192.168.x / 1.1.1.1 / 8.8.8.8)"
        badgeClass="border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="🎣 PHISHING / DARKWEB" 
        severity="CRÍTICO" 
        description="Conexión hacia dominios TOR (.onion) o palabras clave asociadas a robo de credenciales." 
        trigger="Dominio incluye .onion, free-gift, paypal-secure, etc."
        badgeClass="border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
      ></LegendItem>

      <LegendItem 
        name="🧟 BOTNET / MALWARE" 
        severity="CRÍTICO" 
        description="Conexión detectada hacia un centro de comando y control (C2) de una Botnet conocida." 
        trigger="IP o Dominio listado en bases de datos de Botnets / C2."
        badgeClass="border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="⛏️ CRYPTO / MINING" 
        severity="CRÍTICO" 
        description="Tráfico asociado a pools de minería de criptomonedas (Monero, Bitcoin)." 
        trigger="Puertos 3333, 4444 o dominios como minexmr, nanopool."
        badgeClass="border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
      ></LegendItem>

      <LegendItem 
        name="📤 EXFILTRACIÓN" 
        severity="ALTO" 
        description="Posible fuga de datos o transferencia masiva hacia un servidor externo sospechoso." 
        trigger="Picos anómalos de tráfico saliente o conexiones largas."
        badgeClass="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="🔓 PLAINTEXT [X]" 
        severity="ALTO" 
        description="Se detectó tráfico sin cifrar (HTTP/FTP/Telnet). Contraseñas viajan en texto claro." 
        trigger="Puerto 80, 21, 23 sin uso de TLS/SSL."
        badgeClass="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
      ></LegendItem>

      <LegendItem 
        name="🔍 NMAP / ESCANEO" 
        severity="ALTO" 
        description="Escaneo de puertos activo en la red para descubrir vulnerabilidades o equipos." 
        trigger="Ráfagas de SYN a múltiples puertos en milisegundos."
        badgeClass="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="👁️ TRACKING / ADWARE" 
        severity="MEDIO" 
        description="Conexión hacia redes publicitarias o servidores masivos de telemetría." 
        trigger="Dominio incluye doubleclick, google-analytics, telemetry, etc."
        badgeClass="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
      ></LegendItem>

      <LegendItem 
        name="⚠️ HTTP-404" 
        severity="BAJO" 
        description="El servidor respondió con un error 404. Podría ser un error normal o un ataque de fuerza bruta a directorios." 
        trigger="Tráfico HTTP contiene código de respuesta 404."
        badgeClass="border-stone-500 text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-900/30"
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
