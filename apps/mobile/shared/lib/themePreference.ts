import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { colorScheme } from "nativewind";

/**
 * Тема приложения из настроек (#40): системная, светлая или тёмная. Выбор —
 * свойство устройства, а не аккаунта, поэтому живёт в `localStorage`, а не в
 * базе.
 *
 * NativeWind работает в режиме `darkMode: "class"` (tailwind.config.js): тёмные
 * стили включает класс `dark` на `<html>`. Для «системной» темы класс ставим
 * сами по `prefers-color-scheme` и следим за его сменой — в режиме `class`
 * NativeWind сам на систему не смотрит.
 */
export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "yuny.theme";
const listeners = new Set<() => void>();
let preference: ThemePreference = "system";
let media: MediaQueryList | null = null;

function readStored(): ThemePreference {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function systemIsDark(): boolean {
  return media?.matches ?? false;
}

function apply(): void {
  if (Platform.OS !== "web") return;
  const dark = preference === "dark" || (preference === "system" && systemIsDark());
  colorScheme.set(dark ? "dark" : "light");
}

/** Вызывается один раз при старте приложения, до первой отрисовки. */
export function initTheme(): void {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  preference = readStored();
  media = window.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
  media?.addEventListener?.("change", () => {
    if (preference === "system") apply();
  });
  apply();
}

export function setThemePreference(next: ThemePreference): void {
  preference = next;
  try {
    if (next === "system") globalThis.localStorage?.removeItem(STORAGE_KEY);
    else globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    // Хранилище недоступно (приватный режим) — тема действует до перезагрузки.
  }
  apply();
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** Выбор человека (а не итоговая тема) — для переключателя в настройках. */
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, () => preference, () => "system");
}
