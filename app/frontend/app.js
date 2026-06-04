const { createApp, ref, computed, onMounted, reactive } = Vue;

const i18nState = reactive({
    lang: localStorage.getItem('bloodhound_lang') || 'es'
});

const app = createApp({
    components: {
        'ui-button': UiButton,
        'alert-badge': AlertBadge,
        'ui-widget-panel': UiWidgetPanel,
        'legend-item': LegendItem,
        'ui-input': UiInput,
        'header-widget': HeaderWidget,
        'alerts-widget': AlertsWidget,
        'connections-widget': ConnectionsWidget,
        'main-table': MainTable,
        'legend-modal': LegendModal
    },
    data() {
        return {
            packets: [],
            stats: {
                alerts: [],
                connections: []
            },
            totalBytes: 0,
            totalPackets: 0,
            timeRemaining: null,
            connStatus: 'Disconnected',
            connClass: 'text-red-500',
            filterText: '',
            currentCategoryFilter: '',
            isDark: true,
            showLegend: false,
            socket: null
        };
    },
    computed: {
        filteredPackets() {
            return this.packets.filter(pkt => {
                // Text Filter (BPF-like)
                if (this.filterText) {
                    const text = this.filterText.toLowerCase();
                    const rawData = JSON.stringify(pkt).toLowerCase();
                    if (!rawData.includes(text)) return false;
                }
                
                // Category Filter
                if (this.currentCategoryFilter) {
                    if (!pkt.alerts || !pkt.alerts.some(a => a.includes(this.currentCategoryFilter))) {
                        return false;
                    }
                }
                
                return true;
            });
        }
    },
    methods: {
        applyTextFilter(text) {
            this.filterText = text;
            if (this.socket) {
                this.socket.emit('request_filter_history', this.filterText);
            }
        },
        setCategory(cat) {
            this.currentCategoryFilter = cat;
            if (this.socket) {
                this.socket.emit('request_filter_history', cat);
            }
        },
        clearFilters() {
            this.filterText = '';
            this.currentCategoryFilter = '';
            if (this.socket) {
                this.socket.emit('request_filter_history', '');
            }
        },
        factoryReset() {
            if(confirm("DANGER: Are you sure you want to completely erase the database and factory reset?")) {
                this.socket.emit('factory_reset');
                this.packets = [];
                this.stats = { alerts: [], connections: [] };
                this.totalBytes = 0;
            }
        },
        resetAlerts() {
            if(confirm("Clear Alert Stats?")) this.socket.emit('clear_stats', 'alerts');
        },
        resetConns() {
            if(confirm("Clear Connection Stats?")) this.socket.emit('clear_stats', 'connections');
        },
        toggleLang() {
            i18nState.lang = i18nState.lang === 'es' ? 'en' : 'es';
            localStorage.setItem('bloodhound_lang', i18nState.lang);
        },
        toggleTheme() {
            this.isDark = !this.isDark;
            localStorage.setItem('bloodhound_theme', this.isDark ? 'dark' : 'light');
            if (this.isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
        escapeHTML(str) {
            if (!str) return '';
            const p = document.createElement('p');
            p.textContent = str;
            return p.innerHTML;
        },
        getProtoClass(proto) {
            proto = (proto || '').toUpperCase();
            if (['TCP', 'UDP'].includes(proto)) return 'text-blue-600 dark:text-blue-400';
            if (['HTTP', 'HTTPS', 'DNS', 'TLS'].includes(proto)) return 'text-purple-600 dark:text-purple-400 font-bold';
            if (['ICMP', 'ARP'].includes(proto)) return 'text-orange-600 dark:text-orange-400';
            return 'text-core-600 dark:text-core-400';
        }
    },
    mounted() {
        // Load Preferences
        const savedTheme = localStorage.getItem('bloodhound_theme');
        if (savedTheme) {
            this.isDark = savedTheme === 'dark';
        }
        if (this.isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        // Setup WebSocket
        this.socket = io();

        this.socket.on('connect', () => {
            this.connStatus = i18nState.lang === 'es' ? 'En Vivo' : 'Live';
            this.connClass = 'text-neon-green drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]';
        });

        this.socket.on('disconnect', () => {
            this.connStatus = i18nState.lang === 'es' ? 'Desconectado' : 'Disconnected';
            this.connClass = 'text-neon-red';
        });

        this.socket.on('connect_error', (err) => {
            this.connStatus = 'Error';
            this.connClass = 'text-neon-red font-bold animate-pulse';
        });

        this.socket.on('packet', (pkt) => {
            this.packets.unshift(pkt);
            if (this.packets.length > 1000) {
                this.packets.length = 1000;
            }
            this.totalPackets++;
        });

        this.socket.on('stats_update', (data) => {
            if (data.alerts) this.stats.alerts = data.alerts;
            if (data.connections) this.stats.connections = data.connections;
            if (data.totalBytes !== undefined) this.totalBytes = data.totalBytes;
            if (data.timeRemaining !== undefined) this.timeRemaining = data.timeRemaining;
        });

        this.socket.on('historical_logs', (rows) => {
            this.packets = rows;
        });
    }
});

app.config.globalProperties.$t = function(key) {
    return window.translations[i18nState.lang]?.[key] || key;
};
app.config.globalProperties.$i18n = i18nState;

app.mount('#app');
