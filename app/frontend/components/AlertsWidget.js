const AlertsWidget = {
    props: ['alerts', 'translations', 'currentLang', 'getAlertStyle'],
    template: `
        <div class="flex-1 flex flex-col overflow-hidden min-h-0 border-b border-core-300 dark:border-core-800">
            <div class="bg-core-200 dark:bg-core-900 px-4 py-3 font-semibold text-sm text-core-800 dark:text-core-300 border-b border-core-300 dark:border-core-800 flex justify-between items-center">
                <span>{{ t('vuln_alerts') }}</span>
                <button @click="$emit('reset-alerts')" class="text-xs bg-core-300 dark:bg-core-800 hover:bg-core-400 dark:hover:bg-core-700 px-2 py-1 rounded transition-colors cursor-pointer">{{ t('reset_btn') }}</button>
            </div>
            <div class="flex justify-between px-4 py-1.5 text-xs text-core-500 dark:text-core-400 border-b border-core-300 dark:border-core-800 bg-core-100 dark:bg-core-900/80 font-mono">
                <span>{{ t('alert_type') }}</span>
                <span>{{ t('occurrences') }}</span>
            </div>
            <ul class="flex-1 overflow-y-auto p-2.5 font-mono text-sm">
                <li v-for="item in alerts" :key="item.id" class="flex justify-between py-2 px-3 border-b border-core-300 dark:border-core-800 hover:bg-core-200 dark:hover:bg-core-800/50 transition-colors text-core-800 dark:text-core-300">
                    <span>
                        <span :class="['px-1.5', 'py-0.5', 'rounded', 'text-xs', 'font-bold', 'mr-1.5', 'border', getAlertStyle(item.id).badgeClass]">
                            {{ item.id }}
                        </span>
                    </span>
                    <span class="font-bold text-core-600 dark:text-core-400">{{ item.count }}</span>
                </li>
            </ul>
        </div>
    `,
    methods: {
        t(key) {
            return this.translations[this.currentLang]?.[key] || key;
        }
    }
};
