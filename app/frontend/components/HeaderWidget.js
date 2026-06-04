const HeaderWidget = {
    props: ['connStatus', 'connClass', 'totalBytes', 'totalPackets', 'timeRemaining', 'translations', 'currentLang', 'isDark'],
    template: `
        <header class="bg-white dark:bg-core-900 border-b border-core-300 dark:border-core-800 p-3 md:px-6 flex justify-between items-center shrink-0">
            <div class="flex items-center gap-3">
                <span class="pulse-dot w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_var(--tw-shadow-color)] shadow-red-500" :style="{ animationPlayState: connStatus === 'Live' || connStatus === 'En Vivo' ? 'running' : 'paused' }"></span>
                <h1 class="text-xl md:text-2xl font-extrabold tracking-tight"><span class="text-core-600 dark:text-core-400">Bloodhound</span> Forensics</h1>
            </div>
            <div class="flex items-center gap-5">
                <input type="text" 
                    :value="$parent.filterText"
                    @input="$parent.applyTextFilter($event.target.value)"
                    :placeholder="t('live_filter_placeholder')" 
                    autocomplete="off"
                    class="bg-core-200 dark:bg-core-800 border border-core-300 dark:border-core-700 text-core-800 dark:text-core-200 px-4 py-2 rounded-md font-mono w-64 md:w-[350px] outline-none focus:border-core-400 dark:focus:border-core-500 transition-all">
                <div class="flex gap-4 text-sm font-mono items-center">
                    <span :class="['font-bold', connClass]">{{ connStatus }}</span>
                    <span class="text-orange-500 font-bold" v-show="timeRemaining !== null && timeRemaining <= (5 * 24 * 60 * 60 * 1000)">
                        <span>{{ t('reset_in') }}</span> <span>{{ formattedTimeRemaining }}</span>
                    </span>
                    <span><span>{{ t('pkts') }}</span> <span>{{ totalPackets }}</span></span>
                    <span><span>{{ t('data_used') }}</span> <span>{{ formattedTotalBytes }}</span></span>
                    <button @click="$emit('toggle-legend')" class="px-3 py-1.5 bg-core-200 hover:bg-core-300 dark:bg-core-800 dark:hover:bg-core-700 rounded-md transition-colors font-bold text-xs uppercase tracking-wider ml-2 cursor-pointer">{{ t('legend_btn') }}</button>
                    <button @click="$emit('toggle-lang')" class="px-3 py-1.5 bg-core-200 hover:bg-core-300 dark:bg-core-800 dark:hover:bg-core-700 rounded-md transition-colors font-bold text-xs uppercase tracking-wider ml-2 cursor-pointer">{{ currentLang === 'es' ? 'EN' : 'ES' }}</button>
                    <button @click="$emit('toggle-theme')" class="p-1.5 rounded-md hover:bg-core-200 dark:hover:bg-core-800 transition-colors cursor-pointer text-core-600 dark:text-core-400 ml-2">
                        <svg v-if="isDark" class="w-5 h-5 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        <svg v-else class="w-5 h-5 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </button>
                </div>
            </div>
        </header>
    `,
    computed: {
        formattedTimeRemaining() {
            if (!this.timeRemaining) return '-';
            const days = Math.floor(this.timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((this.timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            if (days > 0) return `${days} dias`;
            return `${hours} hrs`;
        },
        formattedTotalBytes() {
            let bytes = this.totalBytes || 0;
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    },
    methods: {
        t(key) {
            return this.translations[this.currentLang]?.[key] || key;
        }
    }
};
