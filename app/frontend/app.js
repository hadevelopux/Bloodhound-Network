const { createApp, ref, computed, onMounted } = Vue;

const app = createApp({
    components: {
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
            currentLang: 'es',
            translations: {}, // Populated from lang.js
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
            this.currentLang = this.currentLang === 'es' ? 'en' : 'es';
            localStorage.setItem('bloodhound_lang', this.currentLang);
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
        getAlertStyle(alertName) {
            if (alertName.includes('⚠️') || alertName.includes('🎣') || alertName.includes('XMAS') || alertName.includes('NULL') || alertName.includes('🧟') || alertName.includes('⛏️')) {
                return { badgeClass: 'border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.3)]', isCritical: true };
            }
            if (alertName.includes('🔓') || alertName.includes('SYN-SCAN') || alertName.includes('EXFILTRACIÓN') || alertName.includes('👁️') || alertName.includes('🔎') || alertName.includes('EXFILTRATION')) {
                return { badgeClass: 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30', isCritical: false };
            }
            if (alertName === 'CNN') return { badgeClass: 'border-core-400 text-core-600 dark:text-core-300 bg-core-200 dark:bg-core-800', isCritical: false };
            if (alertName === 'SYN') return { badgeClass: 'border-core-500 text-core-700 dark:text-core-200 bg-core-200 dark:bg-core-800', isCritical: false };
            
            return { badgeClass: 'border-core-300 dark:border-core-600 text-core-500 dark:text-core-400 bg-core-100 dark:bg-core-800', isCritical: false };
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
        // Load Translations from lang.js (assuming it defines a global window.translations)
        if (window.translations) {
            this.translations = window.translations;
        }

        // Load Preferences
        const savedTheme = localStorage.getItem('bloodhound_theme');
        if (savedTheme) {
            this.isDark = savedTheme === 'dark';
        }
        if (this.isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        const savedLang = localStorage.getItem('bloodhound_lang');
        if (savedLang) {
            this.currentLang = savedLang;
        }

        // Setup WebSocket
        this.socket = io();

        this.socket.on('connect', () => {
            this.connStatus = this.currentLang === 'es' ? 'En Vivo' : 'Live';
            this.connClass = 'text-neon-green drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]';
        });

        this.socket.on('disconnect', () => {
            this.connStatus = this.currentLang === 'es' ? 'Desconectado' : 'Disconnected';
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

app.mount('#app');
