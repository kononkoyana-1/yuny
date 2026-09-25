import { useState } from "react";
import { Pressable, View } from "react-native";
import type { CompositionChar } from "@yuny/shared";
import { HanziText, Text } from "@/shared/ui";
import { FOCUS_RING_CLASS } from "@/shared/ui/focusRing";
import { t } from "@/shared/i18n";

/**
 * Состав слова (#79): каждый знак — карточка, как строка выдачи поиска, но
 * со всеми значениями знака для его чтения в этом слове (решение владельца).
 * Нажатие открывает статью знака поверх статьи слова. Чтение и значения
 * считает сервер (`_shared/dictionaryArticle.ts`).
 */
export function WordComposition({
  chars,
  onOpen,
}: {
  chars: CompositionChar[];
  onOpen: (char: CompositionChar) => void;
}) {
  return (
    <View className="gap-sm">
      <Text variant="eyebrow" tone="muted" className="uppercase" accessibilityRole="header">
        {t("dictionary.article.composition.title")}
      </Text>
      <View className="gap-sm">
        {chars.map((c, index) => (
          <CharCard key={`${c.char}-${index}`} char={c} onPress={() => onOpen(c)} />
        ))}
      </View>
    </View>
  );
}

function CharCard({ char, onPress }: { char: CompositionChar; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  const meanings = char.meanings.length ? char.meanings : char.meaning ? [char.meaning] : [];
  const label = t("dictionary.article.composition.a11y", {
    char: char.char,
    reading: char.reading ?? "",
    meaning: meanings.join("; ") || t("dictionary.article.composition.noMeaning"),
  });
  const content = (
    <>
      <View className="flex-row flex-wrap items-baseline gap-x-sm">
        <HanziText variant="sentence">{char.char}</HanziText>
        {char.reading ? (
          <Text variant="body" tone="muted">
            {char.reading}
          </Text>
        ) : null}
      </View>
      {meanings.length > 1 ? (
        <View className="gap-xs">
          {meanings.map((m, i) => (
            <View key={i} className="flex-row gap-sm">
              <Text variant="body" tone="muted" className="tabular-nums">
                {`${i + 1})`}
              </Text>
              <Text variant="body" className="flex-1">
                {m}
              </Text>
            </View>
          ))}
        </View>
      ) : meanings.length === 1 ? (
        <Text variant="body">{meanings[0]}</Text>
      ) : (
        <Text variant="caption" tone="muted">
          {t("dictionary.article.composition.noMeaning")}
        </Text>
      )}
    </>
  );
  // Статьи знака в словаре нет — открывать нечего: карточка без нажатия, а не переход в пустоту.
  if (char.entry_reading === null) {
    return (
      <View accessible accessibilityLabel={label} className="gap-xs rounded-md bg-surface-alt px-md py-sm dark:bg-surface-alt-dark">
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t("dictionary.article.composition.hint")}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      className={`min-h-tap gap-xs rounded-md border border-border px-md py-sm dark:border-border-dark ${
        pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : "bg-surface dark:bg-surface-dark"
      } ${FOCUS_RING_CLASS}`}
    >
      {content}
    </Pressable>
  );
}
