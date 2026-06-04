const MainTable = {
    props: ['packets', 'currentCategoryFilter', 'translations', 'currentLang', 'escapeHTML', 'getAlertStyle', 'getProtoClass'],
    template: `
        <main class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-core-950">
            <div class="bg-core-100 dark:bg-core-900 px-4 py-3 border-b border-core-300 dark:border-core-800 flex flex-col gap-2 shrink-0">
                <div class="font-semibold text-sm text-core-800 dark:text-core-300 flex justify-between items-center">
                    <span>{{ t('realtime_filters') }}</span>
                    <div class="ml-auto flex items-center gap-2">
                        <button @click="$emit('clear-filters')" class="px-3 py-1.5 bg-core-200 hover:bg-core-300 dark:bg-core-800 dark:hover:bg-core-700 rounded-md transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer">{{ t('clear_filter') }}</button>
                        <button @click="$emit('factory-reset')" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_8px_rgba(220,38,38,0.5)]">{{ t('factory_reset_btn') }}</button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 text-xs font-mono">
                    <button 
                        @click="$emit('set-category', '')"
                        :class="['filter-btn', currentCategoryFilter === '' ? 'active bg-core-300 dark:bg-core-700 text-core-900 dark:text-core-100' : 'bg-core-200 dark:bg-core-800 hover:bg-core-300 dark:hover:bg-core-700 text-core-600 dark:text-core-400', 'px-2 py-1 rounded border border-core-400 dark:border-core-600 transition-all cursor-pointer']"
                    >All</button>
                    <button v-for="cat in categories" :key="cat.val"
                        @click="$emit('set-category', cat.val)"
                        :class="['filter-btn', currentCategoryFilter === cat.val ? 'active bg-core-300 dark:bg-core-700 text-core-900 dark:text-core-100' : 'bg-core-200 dark:bg-core-800 hover:bg-core-300 dark:hover:bg-core-700 text-core-600 dark:text-core-400', 'px-2 py-1 rounded border border-core-400 dark:border-core-600 transition-all cursor-pointer']"
                    >{{ cat.label }}</button>
                </div>
            </div>
            
            <div class="flex-1 overflow-auto bg-core-50 dark:bg-core-950">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="sticky top-0 bg-core-200 dark:bg-core-900 text-core-600 dark:text-core-400 font-mono text-xs uppercase shadow-sm z-10 border-b border-core-300 dark:border-core-800">
                        <tr>
                            <th class="py-3 px-4 font-bold">{{ t('col_time') }}</th>
                            <th class="py-3 px-4 font-bold">{{ t('col_src') }}</th>
                            <th class="py-3 px-4 font-bold">{{ t('col_sport') }}</th>
                            <th class="py-3 px-4 font-bold">{{ t('col_dst') }}</th>
                            <th class="py-3 px-4 font-bold">{{ t('col_dport') }}</th>
                            <th class="py-3 px-4 font-bold">{{ t('col_proto') }}</th>
                            <th class="py-3 px-4 font-bold">{{ t('col_size') }}</th>
                            <th class="py-3 px-4 font-bold">{{ t('col_domain') }}</th>
                            <th class="py-3 px-4 font-bold">{{ t('col_info') }}</th>
                        </tr>
                    </thead>
                    <tbody class="font-mono text-xs divider-y divider-core-200 dark:divider-core-800">
                        <tr v-for="pkt in packets" :key="pkt.id" :class="getRowClass(pkt)">
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ formatTime(pkt.time) }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ escapeHTML(pkt.src) }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ escapeHTML(pkt.sport?.toString()) }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ escapeHTML(pkt.dst) }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ escapeHTML(pkt.dport?.toString()) }}</td>
                            <td :class="['py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]', getProtoClass(pkt.proto)]">{{ escapeHTML(pkt.proto) }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ pkt.len || '-' }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">
                                <span v-if="pkt.domain" class="font-bold text-core-900 dark:text-core-100">{{ escapeHTML(pkt.domain) }}</span>
                                <span v-else class="text-core-400 dark:text-core-600">-</span>
                            </td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]" :title="escapeHTML(pkt.info || '')">
                                <span v-for="a in pkt.alerts" :key="a" :class="['px-1.5', 'py-0.5', 'rounded', 'text-xs', 'font-bold', 'mr-1.5', 'border', getAlertStyle(a).badgeClass]">
                                    {{ a }}
                                </span>
                                {{ escapeHTML(pkt.info || '') }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>
    `,
    data() {
        return {
            categories: [
                { val: 'BOTNET', label: 'Botnet' },
                { val: 'TROJAN', label: 'Trojan/C2' },
                { val: 'NMAP', label: 'Nmap Scan' },
                { val: 'PLAINTEXT', label: 'Plaintext' },
                { val: 'DNS HIJACKED', label: 'DNS Hijacked' },
                { val: 'CRYPTOMINER', label: 'Crypto' },
                { val: 'EXFILTRATION', label: 'Exfiltration' },
                { val: 'PHISHING', label: 'Phishing' },
                { val: 'TRACKING/ADWARE', label: 'Tracking/Adware' },
                { val: 'SYN-SCAN', label: 'SYN-Scan' },
                { val: 'LOCAL SCAN', label: 'Local Scan' },
                { val: 'HTTP-404', label: 'HTTP-404' }
            ]
        };
    },
    methods: {
        t(key) {
            return this.translations[this.currentLang]?.[key] || key;
        },
        formatTime(ms) {
            const d = new Date(ms);
            return \`\${d.getHours().toString().padStart(2,'0')}:\${d.getMinutes().toString().padStart(2,'0')}:\${d.getSeconds().toString().padStart(2,'0')}.\${d.getMilliseconds().toString().padStart(3,'0')}\`;
        },
        getRowClass(pkt) {
            let hasCritical = false;
            if (pkt.alerts) {
                for (let a of pkt.alerts) {
                    if (this.getAlertStyle(a).isCritical) {
                        hasCritical = true;
                        break;
                    }
                }
            }
            return \`transition-colors \${hasCritical ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-core-900 dark:text-core-100' : 'hover:bg-core-100 dark:hover:bg-core-800/50 text-core-700 dark:text-core-300'}\`;
        }
    }
};
