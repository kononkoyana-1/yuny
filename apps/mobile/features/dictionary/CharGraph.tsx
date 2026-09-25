import { useState } from "react";
import { Pressable, View } from "react-native";
import type { CharWord } from "@yuny/shared";
import { Button, HanziText, StageDot, Text } from "@/shared/ui";
import { FOCUS_RING_CLASS } from "@/shared/ui/focusRing";
import { STAGE_FILL_CLASS } from "@/shared/ui/stage";
import { t } from "@/shared/i18n";
import { graphSides } from "./charGraph";

/**
 * Граф знака (#84): знак в центре, от него лучи к словам, в которые он входит.
 * Сторона луча — где стоит знак: слева слова, где он в конце (好看), справа —
 * где в начале или в середине (看书). Слова пользователя — первыми, со стадией
 * памяти (цвет луча и точка, шкала #70), остальные — нейтрально. Порядок и
 * отбор — с сервера; здесь только раскладка.
 *
 * Для скринридера это обычный список кнопок: у каждой в названии слово,
 * чтение, значение, место знака и стадия — цвет и сторона ничего не несут
 * в одиночку.
 */
export function CharGraph({
  char,
  words,
  onOpen,
}: {
  char: string;
  words: CharWord[];
  onOpen: (word: CharWord) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { left, right, rest } = graphSides(words);

  return (
    <View className="gap-sm">
      <Text variant="eyebrow" tone="muted" className="uppercase" accessibilityRole="header">
        {t("dictionary.article.charWords.title")}
      </Text>
      {words.length === 0 ? (
        <Text variant="body" tone="muted">
          {t("dictionary.article.charWords.empty")}
        </Text>
      ) : (
        <>
          <Text variant="caption" tone="muted">
            {t("dictionary.article.charWords.legend")}
          </Text>
          <View className="flex-row items-center">
            <View className="flex-1 items-end gap-xs">
              {left.map((w) => (
                <Ray key={w.headword} word={w} side="left" onPress={() => onOpen(w)} />
              ))}
            </View>
            <View
              aria-hidden
              className="mx-xs h-[56px] w-[56px] items-center justify-center rounded-pill bg-primary-soft dark:bg-primary-soft-dark"
            >
              <HanziText variant="tileLong">{char}</HanziText>
            </View>
            <View className="flex-1 items-start gap-xs">
              {right.map((w) => (
                <Ray key={w.headword} word={w} side="right" onPress={() => onOpen(w)} />
              ))}
            </View>
          </View>
          {rest.length > 0 ? (
            <View className="gap-xs">
              <Button
                variant="ghost"
                label={
                  expanded
                    ? t("dictionary.article.charWords.less")
                    : t("dictionary.article.charWords.more", { count: rest.length })
                }
                onPress={() => setExpanded((v) => !v)}
              />
              {expanded ? rest.map((w) => <ListRow key={w.headword} word={w} onPress={() => onOpen(w)} />) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function wordA11y(w: CharWord): string {
  return [
    w.headword,
    w.reading,
    w.meaning,
    t(`dictionary.article.charWords.position.${w.position}`),
    w.stage ? t("dictionary.article.charWords.mine", { stage: t(`learn.stage.${w.stage}`) }) : null,
  ]
    .filter(Boolean)
    .join(", ");
}

/** Луч: короткая черта к центру и плитка слова. */
function Ray({ word, side, onPress }: { word: CharWord; side: "left" | "right"; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  const line = (
    <View
      aria-hidden
      className={`h-[2px] w-sm ${word.stage ? STAGE_FILL_CLASS[word.stage] : "bg-border dark:bg-border-dark"}`}
    />
  );
  return (
    <View className="max-w-full flex-row items-center">
      {side === "right" ? line : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={wordA11y(word)}
        accessibilityHint={t("dictionary.article.charWords.hint")}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={onPress}
        className={`min-h-tap shrink justify-center rounded-md px-sm py-xs ${
          word.mine ? "border border-border dark:border-border-dark" : ""
        } ${pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : "bg-surface dark:bg-surface-dark"} ${FOCUS_RING_CLASS}`}
      >
        <View className={`flex-row items-center gap-xs ${side === "left" ? "justify-end" : ""}`}>
          {word.stage ? <StageDot stage={word.stage} size={8} /> : null}
          <HanziText variant="inline">{word.headword}</HanziText>
        </View>
        {word.meaning ? (
          <Text variant="caption" tone="muted" numberOfLines={1} className={side === "left" ? "text-right" : ""}>
            {word.meaning}
          </Text>
        ) : null}
      </Pressable>
      {side === "left" ? line : null}
    </View>
  );
}

/** Слово сверх лучей: строкой списка «ещё N». */
function ListRow({ word, onPress }: { word: CharWord; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={wordA11y(word)}
      accessibilityHint={t("dictionary.article.charWords.hint")}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      className={`min-h-tap flex-row flex-wrap items-baseline gap-x-sm rounded-md px-md py-xs ${
        pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : "bg-surface dark:bg-surface-dark"
      } ${FOCUS_RING_CLASS}`}
    >
      {word.stage ? <StageDot stage={word.stage} size={8} /> : null}
      <HanziText variant="inline">{word.headword}</HanziText>
      {word.reading ? (
        <Text variant="caption" tone="muted">
          {word.reading}
        </Text>
      ) : null}
      {word.meaning ? (
        <Text variant="body" className="shrink">
          {word.meaning}
        </Text>
      ) : null}
    </Pressable>
  );
}
