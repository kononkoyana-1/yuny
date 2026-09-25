import { useEffect, useRef } from "react";
import type { ShortcutEvent } from "./keyboardShortcuts";

export type { ShortcutEvent } from "./keyboardShortcuts";

function inTextField(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
}

/**
 * Клавиши экрана упражнений (exercise.design.md §7), web: один `keydown` на
 * документ. Обработчик держится в ref — подписка не пересоздаётся на каждом
 * рендере.
 */
export function useKeyboardShortcuts(handler: (event: ShortcutEvent) => void): void {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      ref.current({
        key: event.key,
        inTextField: inTextField(event.target),
        composing: event.isComposing || event.keyCode === 229,
        preventDefault: () => event.preventDefault(),
      });
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
}
