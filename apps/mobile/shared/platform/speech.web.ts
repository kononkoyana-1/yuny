import { useEffect, useState } from "react";

/**
 * Озвучка слова (#86, первый шаг) — системный голос браузера
 * (`speechSynthesis`, китайский). Голоса приходят не сразу
 * (`voiceschanged`); китайского голоса нет — кнопки звука нет. Качество
 * зависит от устройства; готовые записи заменят это позже.
 */
function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

/** Лучший китайский голос: путунхуа (zh-CN) раньше тайваньского и кантонского. */
function chineseVoice(): SpeechSynthesisVoice | null {
  const voices = synth()?.getVoices() ?? [];
  const rank = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.replace("_", "-").toLowerCase();
    if (lang === "zh-cn" || lang.startsWith("cmn")) return 0;
    if (lang.startsWith("zh-") && !lang.startsWith("zh-hk")) return 1;
    return lang.startsWith("zh") ? 2 : 9;
  };
  return voices.filter((v) => rank(v) < 9).sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

export function useCanSpeak(): boolean {
  const [can, setCan] = useState(() => chineseVoice() !== null);
  useEffect(() => {
    const s = synth();
    if (!s) return;
    const update = () => setCan(chineseVoice() !== null);
    update();
    s.addEventListener("voiceschanged", update);
    return () => s.removeEventListener("voiceschanged", update);
  }, []);
  return can;
}

export function speak(text: string, handlers: { onEnd?: () => void } = {}): void {
  const s = synth();
  const voice = chineseVoice();
  if (!s || !voice) return;
  // Повторное нажатие — заново, а не в очередь за прошлым.
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice.lang;
  try {
    u.voice = voice;
  } catch {
    // Голос не принят (редкие браузеры) — остаётся выбор по `lang`.
  }
  u.rate = 0.85;
  u.onend = () => handlers.onEnd?.();
  u.onerror = () => handlers.onEnd?.();
  s.speak(u);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}
