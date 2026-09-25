export interface ShortcutEvent {
  key: string;
  /** Фокус в текстовом поле: цифры и Backspace — часть ввода, не сокращения. */
  inTextField: boolean;
  /** Идёт IME-набор: Enter и Escape только подтверждают или отменяют его (#41). */
  composing: boolean;
  preventDefault(): void;
}

/**
 * Клавиши экрана упражнений (exercise.design.md §7), native: аппаратной
 * клавиатуры на телефоне обычно нет, действия доступны касанием.
 */
export function useKeyboardShortcuts(_handler: (event: ShortcutEvent) => void): void {}
