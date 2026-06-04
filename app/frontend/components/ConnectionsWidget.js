const ConnectionsWidget = {
    props: ['connections', 'escapeHTML'],
    template: `
        <ui-widget-panel 
            :title="$t('recurring_conns')" 
            :col-left="$t('source_dest')" 
            :col-right="$t('packets_sent')" 
            :reset-label="$t('reset_btn')"
            @reset="$emit('reset-conns')">
            
            <li v-for="c in connections" :key="c.id" class="flex justify-between items-center py-2 px-3 border-b border-core-300 dark:border-core-800 hover:bg-core-200 dark:hover:bg-core-800/50 transition-colors text-core-800 dark:text-core-300">
                <span class="truncate pr-2" :title="c.id">{{ c.id }}</span>
                <span class="font-bold text-core-600 dark:text-core-400 shrink-0">{{ c.count }}</span>
            </li>
            
        </ui-widget-panel>
    `
};
