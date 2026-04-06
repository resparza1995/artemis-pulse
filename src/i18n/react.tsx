import { createContext, useContext } from "react";
import { getMessages, type AppMessages, type Locale } from "./index";

type I18nContextValue = {
  locale: Locale;
  messages: AppMessages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, messages: getMessages(locale) }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }
  return context;
}
