const AlertsWidget = {
    props: ['alerts'],
    template: `
        <ui-widget-panel 
            :title="$t('vuln_alerts')" 
            :col-left="$t('alert_type')" 
            :col-right="$t('occurrences')" 
            :reset-label="$t('reset_btn')"
            @reset="$emit('reset-alerts')">
            
            <li v-for="item in alerts" :key="item.id" class="flex justify-between py-2 px-3 border-b border-core-300 dark:border-core-800 hover:bg-core-200 dark:hover:bg-core-800/50 transition-colors text-core-800 dark:text-core-300">
                <span>
                    <alert-badge :name="item.id" class="mr-1.5"></alert-badge>
                </span>
                <span class="font-bold text-core-600 dark:text-core-400">{{ item.count }}</span>
            </li>
            
        </ui-widget-panel>
    `
};
