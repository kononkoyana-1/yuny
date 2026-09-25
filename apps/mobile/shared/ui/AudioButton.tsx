import { useEffect, useState } from "react";
import { speak, stopSpeaking, useCanSpeak } from "@/shared/platform/speech";
import { t } from "@/shared/i18n";
import { IconButton } from "./IconButton";

export interface AudioButtonProps {
  /** Что озвучить — иероглифы слова или предложения. */
  text: string;
  className?: string;
}

/**
 * «Послушать» (#86): звук только по нажатию — браузер не даёт запускать его
 * самому. Повторное нажатие проигрывает заново. Голоса нет (телефон, браузер
 * без китайского) — кнопки нет, а не мёртвая кнопка.
 */
export function AudioButton({ text, className = "" }: AudioButtonProps) {
  const canSpeak = useCanSpeak();
  const [playing, setPlaying] = useState(false);

  // Ушли с экрана — звук не продолжает играть поверх следующего.
  useEffect(() => () => stopSpeaking(), []);

  if (!canSpeak || !text) return null;
  return (
    <IconButton
      icon="volume"
      accessibilityLabel={t("audio.listen", { text })}
      accessibilityState={{ busy: playing }}
      className={className}
      onPress={() => {
        setPlaying(true);
        speak(text, { onEnd: () => setPlaying(false) });
      }}
    />
  );
}
