import { useMemo, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  EmptyState,
  ErrorState,
  FeedbackBanner,
  LoadingState,
  Sheet,
  Text,
} from "@/shared/ui";
import { useDeleteFolder, useFolders, useRenameFolder, useSavedItems } from "@/shared/api";
import { spacing } from "@/shared/config/tokens";
import { t } from "@/shared/i18n";
import { ArticleSheet, type SheetWord } from "@/features/dictionary/ArticleSheet";
import { EntryRow } from "@/features/dictionary/EntryRow";
import { FolderNameSheet } from "@/features/dictionary/FolderNameSheet";
import { groupSavedWords } from "@/features/dictionary/saved";
import { useRowRefs } from "@/features/dictionary/useRowRefs";

/**
 * Папка своего словаря (#38): слова в ней, новые первыми, переименование и
 * удаление. Отдельный экран вне табов, как `/module/[id]`. Слово открывает ту
 * же статью, что и поиск; снятая там галочка этой папки убирает слово отсюда.
 */
export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const folders = useFolders();
  const items = useSavedItems();
  const rename = useRenameFolder();
  const remove = useDeleteFolder();

  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const renameRef = useRef<View>(null);
  const deleteRef = useRef<View>(null);

  const [openWord, setOpenWord] = useState<SheetWord | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const refFor = useRowRefs();

  const folder = folders.data?.find((f) => f.id === id) ?? null;
  const words = useMemo(
    () => groupSavedWords((items.data ?? []).filter((i) => i.folder_id === id)),
    [items.data, id],
  );

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/dictionary");
  }

  const header = (
    <View className="flex-row items-center px-sm pt-md">
      <Button label={t("dictionary.folder.back")} variant="ghost" onPress={goBack} />
    </View>
  );

  function renderBody() {
    if (folders.isPending || items.isPending) {
      return <LoadingState className="flex-1" message={t("dictionary.folder.loading")} />;
    }
    if ((folders.isError && !folders.data) || (items.isError && !items.data)) {
      return (
        <ErrorState
          className="flex-1"
          title={t("dictionary.folder.error")}
          onRetry={() => {
            void folders.refetch();
            void items.refetch();
          }}
          retryLabel={t("dictionary.folder.retry")}
        />
      );
    }
    if (!folder) {
      return <EmptyState className="flex-1" message={t("dictionary.folder.notFound")} />;
    }

    return (
      <FlatList
        data={words}
        keyExtractor={(word) => word.key}
        contentContainerClassName="px-lg pb-xl"
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View className="gap-md pb-lg">
            <Text variant="title" accessibilityRole="header">
              {folder.name}
            </Text>
            <Text variant="caption" tone="muted">
              {t("dictionary.mine.words", { count: words.length })}
            </Text>
            <View className="flex-row flex-wrap gap-sm">
              <Button
                ref={renameRef}
                label={t("dictionary.folder.rename")}
                variant="secondary"
                onPress={() => setRenaming(true)}
              />
              <Button
                ref={deleteRef}
                label={t("dictionary.folder.delete")}
                variant="ghost"
                onPress={() => {
                  setDeleteError(false);
                  setConfirmingDelete(true);
                }}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            message={t("dictionary.folder.empty")}
            actionLabel={t("dictionary.folder.emptyAction")}
            onAction={() => router.navigate("/dictionary")}
          />
        }
        renderItem={({ item: word }) => (
          <EntryRow
            ref={refFor(word.key)}
            word={word.entry ?? { ...word, senses: [], compact: [] }}
            onPress={() => {
              setFocusKey(word.key);
              setOpenWord(word);
            }}
          />
        )}
      />
    );
  }

  return (
    <View className="flex-1 bg-background dark:bg-background-dark" style={{ paddingTop: insets.top }}>
      {header}
      {renderBody()}

      <ArticleSheet
        word={openWord}
        onClose={() => setOpenWord(null)}
        returnFocusRef={focusKey !== null ? refFor(focusKey) : undefined}
      />

      {folder ? (
        <FolderNameSheet
          visible={renaming}
          mode="rename"
          initialName={folder.name}
          onClose={() => setRenaming(false)}
          onSubmit={async (name) => {
            await rename.mutateAsync({ id: folder.id, name });
            setRenaming(false);
          }}
          returnFocusRef={renameRef}
        />
      ) : null}

      <Sheet
        visible={confirmingDelete && folder !== null}
        onClose={() => setConfirmingDelete(false)}
        accessibilityLabel={folder ? t("dictionary.folder.confirmTitle", { name: folder.name }) : ""}
        returnFocusRef={deleteRef}
      >
        {folder ? (
          <View className="gap-lg">
            <View className="gap-xs">
              <Text variant="heading" accessibilityRole="header">
                {t("dictionary.folder.confirmTitle", { name: folder.name })}
              </Text>
              <Text variant="body" tone="muted">
                {words.length > 0
                  ? t("dictionary.folder.confirmDetail", { count: words.length })
                  : t("dictionary.folder.confirmEmpty")}
              </Text>
            </View>
            {deleteError ? <FeedbackBanner message={t("dictionary.folder.deleteError")} /> : null}
            <View className="gap-sm">
              <Button
                label={t("dictionary.folder.confirm")}
                variant="primary"
                loading={remove.isPending}
                onPress={async () => {
                  setDeleteError(false);
                  try {
                    await remove.mutateAsync(folder.id);
                    setConfirmingDelete(false);
                    goBack();
                  } catch {
                    setDeleteError(true);
                  }
                }}
              />
              <Button
                label={t("dictionary.folder.cancel")}
                variant="ghost"
                onPress={() => setConfirmingDelete(false)}
              />
            </View>
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}
