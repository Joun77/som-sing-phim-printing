import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import loTranslation from './locales/lo.json';
import enTranslation from './locales/en.json';

const savedLang = localStorage.getItem('somsing_lang') || 'lo';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      lo: { translation: loTranslation },
      en: { translation: enTranslation }
    },
    lng: savedLang,
    fallbackLng: 'lo',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
