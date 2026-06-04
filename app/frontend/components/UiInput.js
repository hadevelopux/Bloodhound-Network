const UiInput = {
    props: {
        modelValue: { type: String, default: '' },
        placeholder: { type: String, default: '' }
    },
    template: `
        <input type="text" 
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            :placeholder="placeholder" 
            autocomplete="off"
            class="bg-core-200 dark:bg-core-800 border border-core-300 dark:border-core-700 text-core-800 dark:text-core-200 px-4 py-2 rounded-md font-mono w-64 md:w-[350px] outline-none focus:border-core-400 dark:focus:border-core-500 transition-all">
    `
};
