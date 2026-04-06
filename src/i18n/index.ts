import { en } from "./en";
import { es } from "./es";

export const messages = { es, en } as const;
export type Locale = keyof typeof messages;
export type AppMessages = typeof es;

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return "es";
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("en") ? "en" : "es";
}

export function getMessages(locale: Locale): AppMessages {
  return messages[locale] as AppMessages;
}

export function getLocaleFromRequest(input: { cookie?: string | null; acceptLanguage?: string | null }): Locale {
  const cookieMatch = input.cookie?.match(/(?:^|;\s*)artemis-pulse-lang=([^;]+)/);
  if (cookieMatch?.[1]) {
    return normalizeLocale(decodeURIComponent(cookieMatch[1]));
  }
  return normalizeLocale(input.acceptLanguage ?? undefined);
}

export function getClientLocale(): Locale {
  if (typeof window === "undefined") {
    return "es";
  }

  try {
    const localValue = window.localStorage.getItem("artemis-pulse-lang");
    if (localValue) {
      return normalizeLocale(localValue);
    }
  } catch {
    // ignore
  }

  const cookieMatch = document.cookie.match(/(?:^|;\s*)artemis-pulse-lang=([^;]+)/);
  if (cookieMatch?.[1]) {
    return normalizeLocale(decodeURIComponent(cookieMatch[1]));
  }

  return normalizeLocale(window.navigator.language);
}
export function getIntlLocale(locale: Locale) {
  return locale === "en" ? "en-US" : "es-ES";
}


