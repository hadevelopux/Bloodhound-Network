/**
 * LegendItem Component
 * 
 * Componente auxiliar para la barra lateral de Leyenda.
 * Muestra el título, color de severidad y descripción de una categoría de amenaza específica.
 * 
 * @vue-prop {String} title - Título de la alerta.
 * @vue-prop {String} colorClass - Clases Tailwind para el color de la insignia.
 * @vue-prop {String} desc - Descripción detallada de la alerta.
 */
const LegendItem = {
    props: {
        badge: { type: String, required: true },
        desc: { type: String, required: true },
        pulsing: { type: Boolean, default: true }
    },
    template: `
        <div>
            <alert-badge :name="badge" class="mb-2" :pulsing="pulsing"></alert-badge>
            <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ desc }}</p>
        </div>
    `
};
