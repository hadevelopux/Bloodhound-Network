const AlertsWidget = {
    props: ['alerts'],
    emits: ['clear-stats'],
    template: `
        <ui-widget-panel 
            :title="$t('vuln_alerts')" 
            :col-left="$t('alert_type')" 
            :col-right="$t('occurrences')">
            
            <li v-for="item in alerts" :key="item.id" class="flex justify-between py-2 px-3 border-b border-stone-300 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800/50 transition-colors text-stone-800 dark:text-stone-300">
                <span>
                    <alert-badge :name="item.id" class="mr-1.5"></alert-badge>
                </span>
                <span class="font-bold text-stone-600 dark:text-stone-400">{{ item.count }}</span>
            </li>
            
        </ui-widget-panel>
    `
};
