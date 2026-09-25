import { useState } from "react";
import { View } from "react-native";
import { Button, Card, IconButton, Text } from "@/shared/ui";
import { useFolderMap, useLearningSettings } from "@/shared/api";
import { t } from "@/shared/i18n";
import { queueText } from "./queueText";

/**
 * Подсказка после большой загрузки (#85): в очередь встало больше двух
 * дневных потолков новых слов — предлагаем раунды по папке, где знакомые
 * слова сразу отмечаются «Уже знаю». Живёт на экране итога загрузки, так что
 * показывается один раз на загрузку; «Скрыть» убирает её.
 */
export function QueueHint({ folderId, added, onStart }: { folderId: string; added: number; onStart: () => void }) {
  const settings = useLearningSettings();
  const map = useFolderMap(folderId);
  const [hidden, setHidden] = useState(false);
  const maxNew = settings.data?.max_new;

  if (hidden || maxNew === undefined || added <= 2 * maxNew) return null;
  const queue = map.data ? queueText(map.data) : null;

  return (
    <Card className="w-full gap-sm">
      <View className="flex-row items-start gap-sm">
        <Text variant="body" className="flex-1 font-semibold" accessibilityRole="header">
          {t("learn.queue.hint.title")}
        </Text>
        <IconButton icon="close" accessibilityLabel={t("learn.queue.hint.close")} onPress={() => setHidden(true)} />
      </View>
      {queue ? (
        <Text variant="body" tone="muted">
          {queue}
        </Text>
      ) : null}
      <Text variant="body">{t("learn.queue.hint.body")}</Text>
      <View className="flex-row">
        <Button label={t("learn.queue.hint.start")} variant="secondary" onPress={onStart} />
      </View>
    </Card>
  );
}
