const UiButton = {
    props: {
        variant: { type: String, default: 'default' },
        active: { type: Boolean, default: false }
    },
    template: `
        <button :class="btnClass">
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
                return `${base} text-xs bg-stone-300 dark:bg-stone-800 hover:bg-stone-400 dark:hover:bg-stone-700 px-2 py-1 font-normal`;
            }
            
            if (this.variant === 'filter') {
                const activeClass = this.active ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100' : 'bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400';
                return `px-2 py-1 rounded border border-stone-400 dark:border-stone-600 transition-all cursor-pointer text-xs font-mono filter-btn ${activeClass}`;
            }
            
            if (this.variant === 'icon') {
                return `p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer text-stone-600 dark:text-stone-400`;
            }
            
            // default
            return `${base} px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs uppercase tracking-wider text-stone-800 dark:text-stone-200`;
        }
    }
};
