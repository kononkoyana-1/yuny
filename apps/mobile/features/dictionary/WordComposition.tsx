import { useState } from "react";
import { Pressable, View } from "react-native";
import type { CompositionChar } from "@yuny/shared";
import { HanziText, Text } from "@/shared/ui";
import { FOCUS_RING_CLASS } from "@/shared/ui/focusRing";
import { t } from "@/shared/i18n";

/**
 * Состав слова (#79): каждый знак — плитка с чтением в этом слове и коротким
 * значением по-русски; нажатие открывает статью знака поверх статьи слова.
 * Чтение и значение считает сервер (`_shared/dictionaryArticle.ts`).
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
      <View className="flex-row flex-wrap gap-sm">
        {chars.map((c, index) => (
          <CharChip key={`${c.char}-${index}`} char={c} onPress={() => onOpen(c)} />
        ))}
      </View>
    </View>
  );
}

function CharChip({ char, onPress }: { char: CompositionChar; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  const meaning = char.meaning ?? t("dictionary.article.composition.noMeaning");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("dictionary.article.composition.a11y", {
        char: char.char,
        reading: char.reading ?? "",
        meaning,
      })}
      accessibilityHint={t("dictionary.article.composition.hint")}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      className={`min-h-tap max-w-full flex-row items-center gap-sm rounded-md border border-border px-md py-xs dark:border-border-dark ${
        pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : "bg-surface dark:bg-surface-dark"
      } ${FOCUS_RING_CLASS}`}
    >
      <HanziText variant="inline">{char.char}</HanziText>
      <View className="shrink">
        {char.reading ? (
          <Text variant="caption" tone="muted">
            {char.reading}
          </Text>
        ) : null}
        <Text variant="caption" tone={char.meaning ? "default" : "muted"} numberOfLines={2}>
          {meaning}
        </Text>
      </View>
    </Pressable>
  );
}
