const HeaderWidget = {
    props: ['connStatus', 'connClass', 'totalBytes', 'totalPackets', 'timeRemaining', 'isDark'],
    emits: ['toggle-legend', 'toggle-lang', 'toggle-theme'],
    template: `
        <header class="bg-white dark:bg-stone-900 border-b border-stone-300 dark:border-stone-800 p-3 md:px-6 flex justify-between items-center shrink-0">
            <div class="flex items-center gap-3">
                <span class="pulse-dot w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_var(--tw-shadow-color)] shadow-red-500" :style="{ animationPlayState: connStatus === 'Live' || connStatus === 'En Vivo' ? 'running' : 'paused' }"></span>
                <h1 class="text-xl md:text-2xl font-extrabold tracking-tight"><span class="text-stone-600 dark:text-stone-400">Bloodhound</span> Forensics</h1>
            </div>
            <div class="flex items-center gap-5">
                <ui-input 
                    :model-value="$parent.filterText"
                    @update:modelValue="$parent.applyTextFilter($event)"
                    :placeholder="$t('live_filter_placeholder')">
                </ui-input>
                <div class="flex gap-4 text-sm font-mono items-center">
                    <span :class="['font-bold', connClass]">{{ connStatus }}</span>
                    <span class="text-orange-500 font-bold" v-show="timeRemaining !== null && timeRemaining <= (5 * 24 * 60 * 60 * 1000)">
                        <span>{{ $t('reset_in') }}</span> <span>{{ formattedTimeRemaining }}</span>
                    </span>
                    <span><span>{{ $t('pkts') }}</span> <span>{{ totalPackets }}</span></span>
                    <span><span>{{ $t('data_used') }}</span> <span>{{ formattedTotalBytes }}</span></span>
                    <ui-button @click="$emit('toggle-legend')">{{ $t('legend_btn') }}</ui-button>
                    <ui-button @click="$emit('toggle-lang')">{{ $i18n.lang === 'es' ? 'EN' : 'ES' }}</ui-button>
                    <ui-button variant="icon" @click="$emit('toggle-theme')">
                        <svg v-if="isDark" class="w-5 h-5 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        <svg v-else class="w-5 h-5 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </ui-button>
                </div>
            </div>
        </header>
    `,
    computed: {
        formattedTimeRemaining() {
            if (!this.timeRemaining) return '-';
            const days = Math.floor(this.timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((this.timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            if (days > 0) return `${days} ${this.$t('days')}`;
            return `${hours} ${this.$t('hours')}`;
        },
        formattedTotalBytes() {
            let bytes = this.totalBytes || 0;
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    }
};
