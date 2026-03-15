import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { fr } from '@/i18n/locales/fr.ts';
import { en } from '@/i18n/locales/en.ts';
import { setDefaultOptions } from 'date-fns';
import { fr as dateFnsFr, enUS, type Locale } from 'date-fns/locale';

const dateFnsLocales: Record<string, Locale> = { fr: dateFnsFr, en: enUS };

const syncDateFnsLocale = (language: string) => {
  setDefaultOptions({ locale: dateFnsLocales[language] ?? enUS });
};

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: navigator.language.startsWith('fr') ? 'fr' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

const syncDocumentLanguage = (language: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
};

const initialLang = i18n.resolvedLanguage ?? i18n.language ?? 'en';
syncDocumentLanguage(initialLang);
syncDateFnsLocale(initialLang);
i18n.on('languageChanged', (lang) => {
  syncDocumentLanguage(lang);
  syncDateFnsLocale(lang);
});

export default i18n;
