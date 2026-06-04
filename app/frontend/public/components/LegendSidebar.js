const LegendSidebar = {
    props: ['show'],
    template: `
        <aside class="w-80 h-full shrink-0 bg-white dark:bg-stone-950 border-l border-stone-300 dark:border-stone-800 transition-all duration-300 flex flex-col z-20 relative"
               :class="show ? 'mr-0' : '-mr-80'">
            <div class="p-4 border-b border-stone-300 dark:border-stone-800 flex justify-between items-center shrink-0">
                <h2 class="font-bold text-lg text-stone-800 dark:text-stone-200">{{ $t('legend_title') }}</h2>
                <button @click="$emit('close')" class="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 text-2xl font-bold cursor-pointer transition-colors">&times;</button>
            </div>
            
            <div class="p-4 flex-1 overflow-auto text-sm space-y-6 custom-scrollbar">
                
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 shadow-[0_0_8px_rgba(239,68,68,0.3)] mb-2">{{ $t('leg_c2_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_c2_desc') }}</p>
                </div>
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 shadow-[0_0_8px_rgba(239,68,68,0.3)] mb-2">{{ $t('leg_botnet_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_botnet_desc') }}</p>
                </div>
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 shadow-[0_0_8px_rgba(239,68,68,0.3)] mb-2">{{ $t('leg_crypto_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_crypto_desc') }}</p>
                </div>
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 shadow-[0_0_8px_rgba(239,68,68,0.3)] mb-2">{{ $t('leg_dns_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_dns_desc') }}</p>
                </div>
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 shadow-[0_0_8px_rgba(239,68,68,0.3)] mb-2">{{ $t('leg_phishing_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_phishing_desc') }}</p>
                </div>
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 shadow-[0_0_8px_rgba(239,68,68,0.3)] mb-2">{{ $t('leg_nmap_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_nmap_desc') }}</p>
                </div>
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 mb-2">{{ $t('leg_plaintext_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_plaintext_desc') }}</p>
                </div>
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 mb-2">{{ $t('leg_adware_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_adware_desc') }}</p>
                </div>
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 mb-2">{{ $t('leg_arp_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_arp_desc') }}</p>
                </div>
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 mb-2">{{ $t('leg_exfil_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_exfil_desc') }}</p>
                </div>
                <div>
                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold border border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 mb-2">{{ $t('leg_syn_title') }}</span>
                    <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ $t('leg_syn_desc') }}</p>
                </div>
                
            </div>
        </aside>
    `
};
