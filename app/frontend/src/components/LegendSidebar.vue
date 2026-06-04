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
  <div v-if="show" class="fixed inset-y-0 right-0 w-80 bg-white dark:bg-[#111] border-l border-stone-300 dark:border-stone-800 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
    <div class="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-100 dark:bg-[#111]">
      <h2 class="font-bold text-stone-800 dark:text-stone-200 text-lg flex items-center gap-2">
        <svg class="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        {{ $t('legend_title') }}
      </h2>
      <UiButton variant="icon" @click="$emit('close')">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </UiButton>
    </div>
    
    <div class="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar bg-stone-50 dark:bg-[#1a1a1a]">
      <LegendItem 
        name="⚠️ DNS SECUESTRADO" 
        severity="CRÍTICO" 
        :description="$t('leg_dns_desc')" 
        :trigger="$t('leg_dns_trig')"
        badgeClass="border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="🎣 PHISHING / DARKWEB" 
        severity="CRÍTICO" 
        :description="$t('leg_phish_desc')" 
        :trigger="$t('leg_phish_trig')"
        badgeClass="border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
      ></LegendItem>

      <LegendItem 
        name="🧟 BOTNET / MALWARE" 
        severity="CRÍTICO" 
        :description="$t('leg_botnet_desc')" 
        :trigger="$t('leg_botnet_trig')"
        badgeClass="border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="⛏️ CRYPTO / MINING" 
        severity="CRÍTICO" 
        :description="$t('leg_crypto_desc')" 
        :trigger="$t('leg_crypto_trig')"
        badgeClass="border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
      ></LegendItem>

      <LegendItem 
        name="📤 EXFILTRACIÓN" 
        severity="ALTO" 
        :description="$t('leg_exfil_desc')" 
        :trigger="$t('leg_exfil_trig')"
        badgeClass="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="🔓 PLAINTEXT [X]" 
        severity="ALTO" 
        :description="$t('leg_plain_desc')" 
        :trigger="$t('leg_plain_trig')"
        badgeClass="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
      ></LegendItem>

      <LegendItem 
        name="🔍 NMAP / ESCANEO" 
        severity="ALTO" 
        :description="$t('leg_nmap_desc')" 
        :trigger="$t('leg_nmap_trig')"
        badgeClass="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
      ></LegendItem>
      
      <LegendItem 
        name="👁️ TRACKING / ADWARE" 
        severity="MEDIO" 
        :description="$t('leg_track_desc')" 
        :trigger="$t('leg_track_trig')"
        badgeClass="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
      ></LegendItem>

      <LegendItem 
        name="⚠️ HTTP-404" 
        severity="BAJO" 
        :description="$t('leg_404_desc')" 
        :trigger="$t('leg_404_trig')"
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
