const MainTable = {
    props: ['packets', 'currentCategoryFilter', 'escapeHTML', 'getProtoClass'],
    emits: ['set-category', 'clear-filters'],
    template: `
        <main class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-stone-950">
            <div class="bg-stone-100 dark:bg-stone-900 px-4 py-3 border-b border-stone-300 dark:border-stone-800 flex flex-col gap-2 shrink-0">
                <div class="font-semibold text-sm text-stone-800 dark:text-stone-300 flex justify-between items-center">
                    <span>{{ $t('realtime_filters') }}</span>
                    <div class="ml-auto flex items-center gap-2">
                        <ui-button @click="$emit('clear-filters')">{{ $t('clear_filter') }}</ui-button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 text-xs font-mono">
                    <ui-button variant="filter" :active="currentCategoryFilter === ''" @click="$emit('set-category', '')">All</ui-button>
                    <ui-button variant="filter" v-for="cat in categories" :key="cat.val" :active="currentCategoryFilter === cat.val" @click="$emit('set-category', cat.val)">{{ cat.label }}</ui-button>
                </div>
            </div>
            
            <div class="flex-1 overflow-auto bg-stone-50 dark:bg-stone-950">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="sticky top-0 bg-stone-200 dark:bg-stone-900 text-stone-600 dark:text-stone-400 font-mono text-xs uppercase shadow-sm z-10 border-b border-stone-300 dark:border-stone-800">
                        <tr>
                            <th class="py-3 px-4 font-bold">{{ $t('th_time') }}</th>
                            <th class="py-3 px-4 font-bold">{{ $t('th_source') }}</th>
                            <th class="py-3 px-4 font-bold">{{ $t('th_sport') }}</th>
                            <th class="py-3 px-4 font-bold">{{ $t('th_destination') }}</th>
                            <th class="py-3 px-4 font-bold">{{ $t('th_dport') }}</th>
                            <th class="py-3 px-4 font-bold">{{ $t('th_proto') }}</th>
                            <th class="py-3 px-4 font-bold">{{ $t('th_size') }}</th>
                            <th class="py-3 px-4 font-bold">{{ $t('th_domain') }}</th>
                            <th class="py-3 px-4 font-bold">{{ $t('th_info') }}</th>
                        </tr>
                    </thead>
                    <tbody class="font-mono text-xs divider-y divider-stone-200 dark:divider-stone-800">
                        <tr v-for="pkt in packets" :key="pkt.id" :class="getRowClass(pkt)">
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ formatTime(pkt.time) }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ escapeHTML(pkt.src) }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ escapeHTML(pkt.sport?.toString()) }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ escapeHTML(pkt.dst) }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ escapeHTML(pkt.dport?.toString()) }}</td>
                            <td :class="['py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]', getProtoClass(pkt.proto)]">{{ escapeHTML(pkt.proto) }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{{ pkt.len || '-' }}</td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">
                                <span v-if="pkt.domain" class="font-bold text-stone-900 dark:text-stone-100">{{ escapeHTML(pkt.domain) }}</span>
                                <span v-else class="text-stone-400 dark:text-stone-600">-</span>
                            </td>
                            <td class="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]" :title="escapeHTML(pkt.info || '')">
                                <alert-badge v-for="a in pkt.alerts" :key="a" :name="a" class="mr-1.5"></alert-badge>
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
        formatTime(ms) {
            const d = new Date(ms);
            return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}.${d.getMilliseconds().toString().padStart(3,'0')}`;
        },
        getRowClass(pkt) {
            let hasCritical = false;
            if (pkt.alerts) {
                for (let a of pkt.alerts) {
                    if (a.includes('⚠️') || a.includes('🎣') || a.includes('XMAS') || a.includes('NULL') || a.includes('🧟') || a.includes('⛏️')) {
                        hasCritical = true;
                        break;
                    }
                }
            }
            return `transition-colors ${hasCritical ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-stone-900 dark:text-stone-100' : 'hover:bg-stone-100 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300'}`;
        }
    }
};
