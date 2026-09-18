/**
 * i18next needs `Intl.PluralRules` to resolve `_one` / `_few` / `_many`
 * suffixes (TZ.md §1 predecessor P1). This package checks on its own
 * whether the runtime's `Intl.PluralRules` already covers `ru` and is a
 * no-op if so (`node_modules/intl-pluralrules/polyfill.js`), which is the
 * expected case on all three targets — Hermes ships full ICU/`Intl` support,
 * and `react-native-web` runs on the browser's own engine. Imported first,
 * as a side effect, so it has run before `i18next.init` below ever needs it.
 */
import "intl-pluralrules";
import i18next from "i18next";
import { ru } from "./ru";

/**
 * Language is fixed to `ru` (TZ.md §1) — there is no in-app locale switch,
 * so this does not read the device locale via `expo-localization` the way a
 * multi-language app would. `expo-localization` stays installed per the
 * design spec's precondition for when that changes.
 */
// eslint-disable-next-line import/no-named-as-default-member -- known i18next/eslint-plugin-import false positive: `init` is a method on the default-exported singleton, not a competing named export to prefer.
void i18next.init({
  lng: "ru",
  fallbackLng: "ru",
  resources: { ru: { translation: ru } },
  interpolation: { escapeValue: false },
  returnNull: false,
});

/**
 * Thin wrapper so call sites import `t` from one place rather than reaching
 * into `i18next` directly. Safe to call from inside a render function: with
 * one fixed language there is nothing asynchronous or reactive about it.
 */
export function t(key: string, options?: Record<string, unknown>): string {
  // eslint-disable-next-line import/no-named-as-default-member -- same false positive as above.
  return i18next.t(key, options);
}

export default i18next;
