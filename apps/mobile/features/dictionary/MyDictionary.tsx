import { useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import type { UserDictionaryFolder } from "@yuny/shared";
import { Button, EmptyState, ErrorState, LoadingState, Text } from "@/shared/ui";
import { useCreateFolder, useFolders, useSavedItems } from "@/shared/api";
import { t } from "@/shared/i18n";
import { FolderNameSheet } from "./FolderNameSheet";
import { folderCounts } from "./saved";

/**
 * Свой словарь на экране 04, пока поле поиска пустое (#38): папки со
 * счётчиком слов и кнопка новой папки. Папка открывается отдельным экраном
 * `/folder/[id]`.
 */
export function MyDictionary() {
  const router = useRouter();
  const folders = useFolders();
  const items = useSavedItems();
  const create = useCreateFolder();
  const [creating, setCreating] = useState(false);
  const newFolderRef = useRef<View>(null);

  if (folders.isPending || items.isPending) {
    return <LoadingState className="flex-1" message={t("dictionary.mine.loading")} />;
  }
  if ((folders.isError && !folders.data) || (items.isError && !items.data)) {
    return (
      <ErrorState
        className="flex-1"
        title={t("dictionary.mine.error")}
        onRetry={() => {
          void folders.refetch();
          void items.refetch();
        }}
        retryLabel={t("dictionary.mine.retry")}
      />
    );
  }

  const counts = folderCounts(items.data);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-md px-lg pb-xl"
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="heading" accessibilityRole="header">
        {t("dictionary.mine.title")}
      </Text>

      {folders.data.length === 0 ? (
        // Тот же `EmptyState`, что у пустой выдачи и пустой папки
        // (dictionary.review.md m4). Кнопка — ниже, общая для обоих случаев:
        // у `EmptyState` нет ref на свою кнопку, а лист новой папки должен
        // вернуть фокус туда, откуда его открыли.
        <EmptyState className="py-lg" message={t("dictionary.mine.empty")} />
      ) : (
        <View className="gap-sm">
          {folders.data.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              count={counts.get(folder.id) ?? 0}
              onPress={() => router.push({ pathname: "/folder/[id]", params: { id: folder.id } })}
            />
          ))}
        </View>
      )}

      <Button
        ref={newFolderRef}
        label={t("dictionary.mine.newFolder")}
        variant="primary"
        onPress={() => setCreating(true)}
      />

      <FolderNameSheet
        visible={creating}
        mode="create"
        onClose={() => setCreating(false)}
        onSubmit={async (name) => {
          await create.mutateAsync(name);
          setCreating(false);
        }}
        returnFocusRef={newFolderRef}
      />
    </ScrollView>
  );
}

function FolderRow({
  folder,
  count,
  onPress,
}: {
  folder: UserDictionaryFolder;
  count: number;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const words = t("dictionary.mine.words", { count });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${folder.name}. ${words}`}
      accessibilityHint={t("dictionary.mine.folderA11yHint")}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      className={`min-h-[44px] flex-row items-center gap-md rounded-md px-md py-md ${
        pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : "bg-surface dark:bg-surface-dark"
      }`}
    >
      <Text variant="body" className="flex-1 font-semibold" numberOfLines={1}>
        {folder.name}
      </Text>
      <Text variant="caption" tone="muted">
        {words}
      </Text>
    </Pressable>
  );
}
