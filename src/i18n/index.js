import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const savedLang = localStorage.getItem("lang") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// Keep <html lang> and <html dir> in sync with the active language.
// This is what makes Tailwind's rtl:/ltr: variants and native
// text direction work automatically.
const applyDirection = (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
};

applyDirection(savedLang);

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("lang", lng);
  applyDirection(lng);
});

export default i18n;
