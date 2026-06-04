const { createApp, ref, computed, onMounted, reactive } = Vue;

const i18nState = reactive({
    lang: localStorage.getItem('bloodhound_lang') || 'es'
});

const appConfig = reactive({
    debug: false
});

const logger = {
    info: (...args) => { if (appConfig.debug) console.log('[INFO]', ...args); },
    error: (...args) => { if (appConfig.debug) console.error('[ERROR]', ...args); },
    warn: (...args) => { if (appConfig.debug) console.warn('[WARN]', ...args); },
    debug: (...args) => { if (appConfig.debug) console.log('[DEBUG]', ...args); }
};
window.logger = logger; // Para acceso global si se necesita

const app = createApp({
    data() {
        return {
            packets: [],
            stats: {
                alerts: [],
                connections: [],
                trackingDomains: []
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
            logger.debug('Filtro de texto aplicado:', text);
            this.filterText = text;
            if (this.socket) {
                this.socket.emit('request_filter_history', this.filterText);
            }
        },
        setCategory(cat) {
            logger.debug('Filtro de categoría aplicado:', cat);
            this.currentCategoryFilter = cat;
            if (this.socket) {
                this.socket.emit('request_filter_history', cat);
            }
        },
        clearFilters() {
            logger.debug('Limpiando todos los filtros.');
            this.filterText = '';
            this.currentCategoryFilter = '';
            if (this.socket) {
                this.socket.emit('request_filter_history', '');
            }
        },
        factoryReset() {
            logger.info("Boton presionado, enviando señal de reseteo al servidor...");
            this.socket.emit('factory_reset');
            this.packets = [];
            this.stats = { alerts: [], connections: [] };
            this.totalBytes = 0;
            logger.info("Señal de reseteo enviada exitosamente.");
        },
        toggleLang() {
            i18nState.lang = i18nState.lang === 'es' ? 'en' : 'es';
            localStorage.setItem('bloodhound_lang', i18nState.lang);
            logger.debug('Idioma cambiado a:', i18nState.lang);
        },
        toggleTheme() {
            this.isDark = !this.isDark;
            localStorage.setItem('bloodhound_theme', this.isDark ? 'dark' : 'light');
            logger.debug('Tema cambiado. isDark:', this.isDark);
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
            return 'text-stone-600 dark:text-stone-400';
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

        this.socket.on('app_config', (config) => {
            appConfig.debug = config.debug;
            logger.info('Configuración de logs recibida del backend:', config);
        });

        this.socket.on('connect', () => {
            logger.info('Conectado al servidor WebSocket con éxito.');
            this.connStatus = i18nState.lang === 'es' ? 'En Vivo' : 'Live';
            this.connClass = 'text-neon-green drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]';
        });

        this.socket.on('disconnect', () => {
            logger.warn('Desconectado del servidor WebSocket.');
            this.connStatus = i18nState.lang === 'es' ? 'Desconectado' : 'Disconnected';
            this.connClass = 'text-neon-red';
        });

        this.socket.on('connect_error', (err) => {
            logger.error('Error de conexión WebSocket:', err.message);
            this.connStatus = 'Error';
            this.connClass = 'text-neon-red font-bold animate-pulse';
        });

        this.socket.on('packet', (pkt) => {
            logger.debug('Paquete en vivo recibido:', pkt.src, '->', pkt.dst);
            this.packets.unshift(pkt);
            
            if (this.packets.length > 1000) {
                // Recolector de basura inteligente: si hay filtro, expulsar primero la basura oculta
                if (this.filterText || this.currentCategoryFilter) {
                    let evicted = false;
                    for (let i = this.packets.length - 1; i >= 0; i--) {
                        const p = this.packets[i];
                        let isVisible = true;
                        
                        // Text Filter
                        if (this.filterText) {
                            const text = this.filterText.toLowerCase();
                            const rawData = JSON.stringify(p).toLowerCase();
                            if (!rawData.includes(text)) isVisible = false;
                        }
                        
                        // Category Filter
                        if (this.currentCategoryFilter) {
                            if (!p.alerts || !p.alerts.some(a => a.includes(this.currentCategoryFilter))) {
                                isVisible = false;
                            }
                        }
                        
                        if (!isVisible) {
                            this.packets.splice(i, 1); // Expulsamos este porque es invisible
                            evicted = true;
                            break;
                        }
                    }
                    if (!evicted) this.packets.pop();
                } else {
                    this.packets.pop();
                }
            }
            this.totalPackets++;
        });

        this.socket.on('stats_update', (data) => {
            logger.debug('Actualización de estadísticas recibida:', data);
            if (data.alerts) this.stats.alerts = data.alerts;
            if (data.connections) this.stats.connections = data.connections;
            if (data.trackingDomains) this.stats.trackingDomains = data.trackingDomains;
            if (data.totalBytes !== undefined) this.totalBytes = data.totalBytes;
            if (data.timeRemaining !== undefined) this.timeRemaining = data.timeRemaining;
        });

        this.socket.on('historical_logs', (rows) => {
            logger.info(`Cargados ${rows.length} paquetes históricos.`);
            this.packets = rows;
        });
    }
});

app.config.globalProperties.$t = function(key) {
    return window.translations[i18nState.lang]?.[key] || key;
};
app.config.globalProperties.$i18n = i18nState;

app.component('ui-button', UiButton);
app.component('alert-badge', AlertBadge);
app.component('ui-widget-panel', UiWidgetPanel);
app.component('legend-item', LegendItem);
app.component('ui-input', UiInput);
app.component('header-widget', HeaderWidget);
app.component('alerts-widget', AlertsWidget);
app.component('connections-widget', ConnectionsWidget);
app.component('domains-widget', DomainsWidget);
app.component('main-table', MainTable);
app.component('legend-sidebar', LegendSidebar);

app.mount('#app');
