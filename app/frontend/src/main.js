import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import App from './App.vue';

import en from './locales/en.json';
import es from './locales/es.json';

// i18n Data
const messages = {
  en,
  es
};

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('bloodhound_lang') || 'es',
  fallbackLocale: 'en',
  messages,
});

const app = createApp(App);
app.use(i18n);
app.mount('#app');
