/**
 * UiWidgetPanel Component
 * 
 * Contenedor genérico para los widgets del panel lateral izquierdo.
 * Proporciona el marco, fondo oscuro/claro y el título estandarizado.
 * 
 * @vue-prop {String} title - El título que se mostrará en la cabecera del widget.
 */
const UiWidgetPanel = {
    props: {
        title: { type: String, required: true },
        colLeft: { type: String, required: true },
        colRight: { type: String, required: true }
    },
    template: `
        <div class="flex-1 flex flex-col overflow-hidden min-h-0 border-b border-stone-300 dark:border-stone-800">
            <div class="bg-stone-200 dark:bg-stone-900 px-4 py-3 font-semibold text-sm text-stone-800 dark:text-stone-300 border-b border-stone-300 dark:border-stone-800 flex justify-between items-center">
                <span>{{ title }}</span>
            </div>
            <div class="flex justify-between px-4 py-1.5 text-xs text-stone-500 dark:text-stone-400 border-b border-stone-300 dark:border-stone-800 bg-stone-100 dark:bg-stone-900/80 font-mono">
                <span>{{ colLeft }}</span>
                <span>{{ colRight }}</span>
            </div>
            <ul class="flex-1 overflow-y-auto p-2.5 font-mono text-sm">
                <slot></slot>
            </ul>
        </div>
    `
};
