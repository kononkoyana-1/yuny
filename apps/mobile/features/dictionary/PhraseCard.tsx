import { useState } from "react";
import { Pressable, View } from "react-native";
import type { PhraseTranslation, PhraseWord } from "@yuny/shared";
import { AudioButton, Button, Card, HanziText, Text } from "@/shared/ui";
import { FOCUS_RING_CLASS } from "@/shared/ui/focusRing";
import { BackendError } from "@/shared/lib/backendError";
import { t } from "@/shared/i18n";

/**
 * Перевод фразы из поиска (#76): перевод, пиньинь китайской фразы и слова,
 * из которых она состоит, — каждое открывает свою статью (там «В мой
 * словарь»). Ниже карточки остаётся обычная выдача словаря; загрузка и
 * ошибка перевода её не заслоняют.
 */
export function PhraseCard({
  data,
  isPending,
  error,
  onRetry,
  onOpenWord,
}: {
  data: PhraseTranslation | undefined;
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
  onOpenWord: (word: { headword: string; reading: string | null }) => void;
}) {
  if (isPending) {
    return (
      <Card className="gap-sm">
        <Text variant="eyebrow" tone="muted" className="uppercase">
          {t("dictionary.phrase.title")}
        </Text>
        <Text variant="body" tone="muted" accessibilityLiveRegion="polite">
          {t("dictionary.phrase.loading")}
        </Text>
      </Card>
    );
  }
  if (!data) {
    if (!error) return null;
    const limited = error instanceof BackendError && error.code === "phrase_rate_limited";
    return (
      <Card className="gap-sm">
        <Text variant="body">{limited ? t("dictionary.phrase.limited") : t("dictionary.phrase.error")}</Text>
        {limited ? null : (
          <View className="flex-row">
            <Button label={t("dictionary.phrase.retry")} variant="ghost" onPress={onRetry} />
          </View>
        )}
      </Card>
    );
  }

  const fromChinese = data.direction === "zh-ru";
  return (
    <Card className="gap-md">
      <View className="gap-xs">
        <Text variant="eyebrow" tone="muted" className="uppercase" accessibilityRole="header">
          {t("dictionary.phrase.title")}
        </Text>
        {fromChinese ? (
          <Text variant="title">{data.translation}</Text>
        ) : (
          <HanziText variant="sentence">{data.zh}</HanziText>
        )}
        <View className="flex-row flex-wrap items-center gap-sm">
          <Text variant="body" tone="muted" className="flex-1">
            {data.pinyin}
          </Text>
          <AudioButton text={data.zh} />
        </View>
      </View>

      {data.words.some((w) => !w.punct) ? (
        <View className="gap-sm">
          <Text variant="eyebrow" tone="muted" className="uppercase">
            {t("dictionary.phrase.words")}
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {data.words.filter((w) => !w.punct).map((w, i) => (
              <WordChip key={`${w.text}-${i}`} word={w} onPress={() => onOpenWord({ headword: w.text, reading: w.reading })} />
            ))}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function WordChip({ word, onPress }: { word: PhraseWord; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  const meaning = word.meaning ?? (word.in_dictionary ? null : t("dictionary.phrase.notInDictionary"));
  const label = [word.text, word.reading, meaning].filter(Boolean).join(", ");
  const content = (
    <>
      <HanziText variant="inline">{word.text}</HanziText>
      <View className="shrink">
        {word.reading ? (
          <Text variant="caption" tone="muted">
            {word.reading}
          </Text>
        ) : null}
        {meaning ? (
          <Text variant="caption" tone={word.meaning ? "default" : "muted"} numberOfLines={2}>
            {meaning}
          </Text>
        ) : null}
      </View>
    </>
  );
  // Нет статьи — открывать нечего: плитка без нажатия.
  if (!word.in_dictionary) {
    return (
      <View
        accessible
        accessibilityLabel={label}
        className="min-h-tap max-w-full flex-row items-center gap-sm rounded-md bg-surface-alt px-md py-xs dark:bg-surface-alt-dark"
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t("dictionary.phrase.wordHint")}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      className={`min-h-tap max-w-full flex-row items-center gap-sm rounded-md border border-border px-md py-xs dark:border-border-dark ${
        pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : "bg-surface dark:bg-surface-dark"
      } ${FOCUS_RING_CLASS}`}
    >
      {content}
    </Pressable>
  );
}
