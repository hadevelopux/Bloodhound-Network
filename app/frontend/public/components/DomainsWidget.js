/**
 * DomainsWidget Component
 * 
 * Widget del panel lateral que muestra los dominios de rastreo/adware más frecuentes.
 * 
 * @vue-prop {Array} domains - Lista de dominios ordenados por frecuencia.
 * @vue-prop {Function} escapeHTML - Función de utilidad para sanear strings.
 */
const DomainsWidget = {
    props: ['domains', 'escapeHTML'],
    emits: ['clear-stats'],
    template: `
        <ui-widget-panel title="Rastreo y Adware (Top)">
            <template #header-actions>
                <ui-button variant="danger" @click="$emit('clear-stats')" title="Limpiar Estadísticas">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </ui-button>
            </template>
            <div class="space-y-2">
                <div v-for="dom in domains" :key="dom.id" class="flex justify-between items-center p-2 bg-gray-50 dark:bg-[#1a1a1a] rounded text-xs border border-gray-100 dark:border-gray-800 hover:border-neon-purple/30 transition-colors">
                    <span class="text-gray-600 dark:text-gray-400 font-mono truncate mr-2" v-html="escapeHTML(dom.id)"></span>
                    <span class="text-neon-purple font-bold shrink-0">{{ dom.count }}</span>
                </div>
                <div v-if="!domains || domains.length === 0" class="text-xs text-gray-500 dark:text-gray-500 text-center py-2 italic">
                    Sin rastreadores detectados
                </div>
            </div>
        </ui-widget-panel>
    `
};
