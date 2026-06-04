const UiWidgetPanel = {
    props: {
        title: { type: String, required: true },
        colLeft: { type: String, required: true },
        colRight: { type: String, required: true },
        resetLabel: { type: String, required: true }
    },
    template: `
        <div class="flex-1 flex flex-col overflow-hidden min-h-0 border-b border-core-300 dark:border-core-800">
            <div class="bg-core-200 dark:bg-core-900 px-4 py-3 font-semibold text-sm text-core-800 dark:text-core-300 border-b border-core-300 dark:border-core-800 flex justify-between items-center">
                <span>{{ title }}</span>
                <ui-button variant="small" @click="$emit('reset')">{{ resetLabel }}</ui-button>
            </div>
            <div class="flex justify-between px-4 py-1.5 text-xs text-core-500 dark:text-core-400 border-b border-core-300 dark:border-core-800 bg-core-100 dark:bg-core-900/80 font-mono">
                <span>{{ colLeft }}</span>
                <span>{{ colRight }}</span>
            </div>
            <ul class="flex-1 overflow-y-auto p-2.5 font-mono text-sm">
                <slot></slot>
            </ul>
        </div>
    `
};
