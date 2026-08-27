/**
 * Welcome screen's UI-language switcher list. Distinct from
 * `targetLanguages.ts` (screen 02, "what language do you want to learn") —
 * this is `Profile.ui_language`, the language the app's own interface is
 * displayed in (TZ.md §12: "UI language" is one of four independent
 * dimensions, never conflate it with target/native/content language).
 */
export interface UiLanguageOption {
  code: string;
  label: string;
}

export const UI_LANGUAGES: UiLanguageOption[] = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];
