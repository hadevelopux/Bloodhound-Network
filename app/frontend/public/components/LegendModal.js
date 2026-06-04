const LegendModal = {
    props: ['show'],
    template: `
        <div v-if="show" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div class="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div class="flex justify-between items-center p-4 border-b border-stone-200 dark:border-stone-800">
                    <h2 class="text-lg font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                        <svg class="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span data-i18n="legend_title">{{ $t('legend_title') }}</span>
                    </h2>
                    <button @click="$emit('close')" class="text-stone-500 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <!-- High Severity -->
                        <div>
                            <h3 class="text-sm font-bold text-red-600 dark:text-red-400 mb-4 uppercase tracking-wider border-b border-red-200 dark:border-red-900/50 pb-2" data-i18n="cat_high_sev">{{ $t('cat_high_sev') }}</h3>
                            
                            <div class="space-y-4">
                                <legend-item badge="⚠️ TROYANO/C2" :desc="$t('leg_c2_desc')"></legend-item>
                                <legend-item badge="🧟 BOTNET IoT" :desc="$t('leg_botnet_desc')"></legend-item>
                                <legend-item badge="⛏️ CRYPTOMINERO" :desc="$t('leg_crypto_desc')"></legend-item>
                                <legend-item badge="⚠️ DNS HIJACKED" :desc="$t('leg_dns_desc')"></legend-item>
                                <legend-item badge="🎣 PHISHING/DARKWEB" :desc="$t('leg_phishing_desc')"></legend-item>
                                <legend-item badge="🕵️ NMAP SCAN (NULL/XMAS)" :desc="$t('leg_nmap_desc')"></legend-item>
                            </div>
                        </div>

                        <!-- Medium/Low Severity -->
                        <div>
                            <h3 class="text-sm font-bold text-orange-600 dark:text-orange-400 mb-4 uppercase tracking-wider border-b border-orange-200 dark:border-orange-900/50 pb-2" data-i18n="cat_med_sev">{{ $t('cat_med_sev') }}</h3>
                            
                            <div class="space-y-4">
                                <legend-item badge="📦 EXFILTRATION" :desc="$t('leg_exfiltration_desc')" :pulsing="false"></legend-item>
                                <legend-item badge="SYN-SCAN" :desc="$t('leg_syn_desc')" :pulsing="false"></legend-item>
                                <legend-item badge="🔎 LOCAL SCAN (ARP)" :desc="$t('leg_localscan_desc')" :pulsing="false"></legend-item>
                                <legend-item badge="👁️ TRACKING/ADWARE" :desc="$t('leg_tracking_desc')" :pulsing="false"></legend-item>
                                <legend-item badge="🔓 TEXTO PLANO" :desc="$t('leg_plaintext_desc')" :pulsing="false"></legend-item>
                                <legend-item badge="HTTP-404" :desc="$t('leg_http404_desc')" :pulsing="false"></legend-item>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-stone-100 dark:bg-stone-900 p-4 border-t border-stone-200 dark:border-stone-800 text-center">
                    <p class="text-xs text-stone-500" data-i18n="leg_footer">{{ $t('leg_footer') }}</p>
                </div>
            </div>
        </div>
    `
};
