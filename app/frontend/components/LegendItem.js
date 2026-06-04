const LegendItem = {
    props: {
        badge: { type: String, required: true },
        desc: { type: String, required: true },
        pulsing: { type: Boolean, default: true }
    },
    template: `
        <div>
            <alert-badge :name="badge" class="mb-2" :pulsing="pulsing"></alert-badge>
            <p class="text-core-600 dark:text-core-400 leading-relaxed">{{ desc }}</p>
        </div>
    `
};
