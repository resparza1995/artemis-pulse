import type { Locale } from "../../i18n";

type LanguageSwitcherProps = {
  locale: Locale;
  languageLabel: string;
};

const OPTIONS: Locale[] = ["es", "en"];

export function LanguageSwitcher({ locale, languageLabel }: LanguageSwitcherProps) {
  function applyLocale(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }

    document.cookie = `artemis-pulse-lang=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.localStorage.setItem("artemis-pulse-lang", nextLocale);
    window.location.reload();
  }

  return (
    <div className="app-nav-shell flex items-center gap-1 rounded-full p-1" aria-label={languageLabel} title={languageLabel}>
      {OPTIONS.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            onClick={() => applyLocale(option)}
            className={[
              "app-nav-item rounded-full px-3 py-1 text-xs font-medium uppercase transition duration-200",
              active && "app-nav-item-active",
            ].join(" ")}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
