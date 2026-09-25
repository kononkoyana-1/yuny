/**
 * Озвучка слова (#86, первый шаг): на телефоне пока нет — кнопки звука не
 * будет. Готовые записи заменят системный голос позже.
 */
export function useCanSpeak(): boolean {
  return false;
}

export function speak(_text: string, _handlers: { onEnd?: () => void } = {}): void {}

export function stopSpeaking(): void {}
