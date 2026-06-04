const LegendModal = {
    props: ['show', 'translations', 'currentLang'],
    template: `
        <div v-if="show" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div class="bg-white dark:bg-core-900 border border-core-300 dark:border-core-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div class="flex justify-between items-center p-4 border-b border-core-200 dark:border-core-800">
                    <h2 class="text-lg font-bold text-core-800 dark:text-core-200 flex items-center gap-2">
                        <svg class="w-5 h-5 text-core-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span data-i18n="legend_title">{{ t('legend_title') }}</span>
                    </h2>
                    <button @click="$emit('close')" class="text-core-500 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-core-100 dark:hover:bg-core-800">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <!-- High Severity -->
                        <div>
                            <h3 class="text-sm font-bold text-red-600 dark:text-red-400 mb-4 uppercase tracking-wider border-b border-red-200 dark:border-red-900/50 pb-2" data-i18n="cat_high_sev">{{ t('cat_high_sev') }}</h3>
                            
                            <div class="space-y-4">
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 mb-2 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse" data-i18n="leg_c2_title">⚠️ TROYANO/C2</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_c2_desc">{{ t('leg_c2_desc') }}</p>
                                </div>
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 mb-2 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse" data-i18n="leg_botnet_title">🧟 BOTNET IoT</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_botnet_desc">{{ t('leg_botnet_desc') }}</p>
                                </div>
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 mb-2 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse" data-i18n="leg_crypto_title">⛏️ CRYPTOMINERO</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_crypto_desc">{{ t('leg_crypto_desc') }}</p>
                                </div>
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 mb-2 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse" data-i18n="leg_dns_title">⚠️ DNS HIJACKED</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_dns_desc">{{ t('leg_dns_desc') }}</p>
                                </div>
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 mb-2 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse" data-i18n="leg_phishing_title">🎣 PHISHING/DARKWEB</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_phishing_desc">{{ t('leg_phishing_desc') }}</p>
                                </div>
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 mb-2 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse" data-i18n="leg_nmap_title">🕵️ NMAP SCAN (NULL/XMAS)</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_nmap_desc">{{ t('leg_nmap_desc') }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Medium/Low Severity -->
                        <div>
                            <h3 class="text-sm font-bold text-orange-600 dark:text-orange-400 mb-4 uppercase tracking-wider border-b border-orange-200 dark:border-orange-900/50 pb-2" data-i18n="cat_med_sev">{{ t('cat_med_sev') }}</h3>
                            
                            <div class="space-y-4">
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 mb-2" data-i18n="leg_exfiltration_title">📦 EXFILTRATION</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_exfiltration_desc">{{ t('leg_exfiltration_desc') }}</p>
                                </div>
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 mb-2" data-i18n="leg_syn_title">SYN-SCAN</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_syn_desc">{{ t('leg_syn_desc') }}</p>
                                </div>
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 mb-2" data-i18n="leg_localscan_title">🔎 LOCAL SCAN (ARP)</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_localscan_desc">{{ t('leg_localscan_desc') }}</p>
                                </div>
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 mb-2" data-i18n="leg_tracking_title">👁️ TRACKING/ADWARE</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_tracking_desc">{{ t('leg_tracking_desc') }}</p>
                                </div>
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 mb-2" data-i18n="leg_plaintext_title">🔓 TEXTO PLANO</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_plaintext_desc">{{ t('leg_plaintext_desc') }}</p>
                                </div>
                                <div>
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-core-300 dark:border-core-600 text-core-500 dark:text-core-400 bg-core-100 dark:bg-core-800 mb-2" data-i18n="leg_http404_title">HTTP-404</span>
                                    <p class="text-core-600 dark:text-core-400 leading-relaxed" data-i18n="leg_http404_desc">{{ t('leg_http404_desc') }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-core-100 dark:bg-core-900 p-4 border-t border-core-200 dark:border-core-800 text-center">
                    <p class="text-xs text-core-500" data-i18n="leg_footer">{{ t('leg_footer') }}</p>
                </div>
            </div>
        </div>
    `,
    methods: {
        t(key) {
            return this.translations[this.currentLang]?.[key] || key;
        }
    }
};
