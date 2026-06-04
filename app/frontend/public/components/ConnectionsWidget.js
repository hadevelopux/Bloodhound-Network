const ConnectionsWidget = {
    props: ['connections', 'escapeHTML'],
    emits: ['clear-stats'],
    template: `
        <ui-widget-panel 
            :title="$t('recurring_conns')" 
            :col-left="$t('source_dest')" 
            :col-right="$t('packets_sent')" 
            :reset-label="$t('reset_btn')"
            @reset="$emit('reset-conns')">
            
            <li v-for="c in connections" :key="c.id" class="flex justify-between items-center py-2 px-3 border-b border-stone-300 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800/50 transition-colors text-stone-800 dark:text-stone-300">
                <span class="truncate pr-2" :title="c.id">{{ c.id }}</span>
                <span class="font-bold text-stone-600 dark:text-stone-400 shrink-0">{{ c.count }}</span>
            </li>
            
        </ui-widget-panel>
    `
};
