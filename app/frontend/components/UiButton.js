const UiButton = {
    props: {
        variant: { type: String, default: 'default' },
        active: { type: Boolean, default: false }
    },
    template: `
        <button :class="btnClass" @click="$emit('click')">
            <slot></slot>
        </button>
    `,
    computed: {
        btnClass() {
            const base = 'transition-colors cursor-pointer rounded-md font-bold';
            
            if (this.variant === 'danger') {
                return `${base} px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs uppercase tracking-wider shadow-[0_0_8px_rgba(220,38,38,0.5)]`;
            }
            
            if (this.variant === 'small') {
                return `${base} text-xs bg-core-300 dark:bg-core-800 hover:bg-core-400 dark:hover:bg-core-700 px-2 py-1 font-normal`;
            }
            
            if (this.variant === 'filter') {
                const activeClass = this.active ? 'bg-core-300 dark:bg-core-700 text-core-900 dark:text-core-100' : 'bg-core-200 dark:bg-core-800 hover:bg-core-300 dark:hover:bg-core-700 text-core-600 dark:text-core-400';
                return `px-2 py-1 rounded border border-core-400 dark:border-core-600 transition-all cursor-pointer text-xs font-mono filter-btn ${activeClass}`;
            }
            
            if (this.variant === 'icon') {
                return `p-1.5 rounded-md hover:bg-core-200 dark:hover:bg-core-800 transition-colors cursor-pointer text-core-600 dark:text-core-400`;
            }
            
            // default
            return `${base} px-3 py-1.5 bg-core-200 hover:bg-core-300 dark:bg-core-800 dark:hover:bg-core-700 text-xs uppercase tracking-wider text-core-800 dark:text-core-200`;
        }
    }
};
