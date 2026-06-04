const AlertBadge = {
    props: {
        name: { type: String, required: true },
        pulsing: { type: Boolean, default: true }
    },
    template: `
        <span :class="['inline-block px-1.5 py-0.5 rounded text-xs font-bold border', styleObj.badgeClass]">
            {{ name }}
        </span>
    `,
    computed: {
        styleObj() {
            const alertName = this.name || '';
            
            // Critical
            if (alertName.includes('⚠️') || alertName.includes('🎣') || alertName.includes('XMAS') || alertName.includes('NULL') || alertName.includes('🧟') || alertName.includes('⛏️')) {
                const pulseClass = this.pulsing ? 'animate-pulse' : '';
                return { badgeClass: `border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 shadow-[0_0_8px_rgba(239,68,68,0.3)] ${pulseClass}`, isCritical: true };
            }
            
            // Medium/Warning
            if (alertName.includes('🔓') || alertName.includes('SYN-SCAN') || alertName.includes('EXFILTRACIÓN') || alertName.includes('👁️') || alertName.includes('🔎') || alertName.includes('EXFILTRATION')) {
                return { badgeClass: 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30', isCritical: false };
            }
            
            // Low/Debug
            if (alertName === 'CNN') return { badgeClass: 'border-core-400 text-core-600 dark:text-core-300 bg-core-200 dark:bg-core-800', isCritical: false };
            if (alertName === 'SYN') return { badgeClass: 'border-core-500 text-core-700 dark:text-core-200 bg-core-200 dark:bg-core-800', isCritical: false };
            
            // Default
            return { badgeClass: 'border-core-300 dark:border-core-600 text-core-500 dark:text-core-400 bg-core-100 dark:bg-core-800', isCritical: false };
        }
    }
};
