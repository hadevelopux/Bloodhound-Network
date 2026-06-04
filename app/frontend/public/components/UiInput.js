/**
 * UiInput Component
 * 
 * Componente de entrada de texto reutilizable con estilos Tailwind.
 * Utilizado principalmente para la barra de búsqueda (filtro en vivo).
 * 
 * @vue-prop {String} modelValue - El valor actual del input.
 * @vue-prop {String} placeholder - Texto de marcador de posición.
 * @vue-event {String} input-change - Se emite cuando el usuario escribe en el input.
 */
const UiInput = {
    props: {
        modelValue: { type: String, default: '' },
        placeholder: { type: String, default: '' }
    },
    template: `
        <input type="text" 
            :value="modelValue"
            @input="$emit('input-change', $event.target.value)"
            :placeholder="placeholder" 
            autocomplete="off"
            class="bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 px-4 py-2 rounded-md font-mono w-64 md:w-[350px] outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-all">
    `
};
