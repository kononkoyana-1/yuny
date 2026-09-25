import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import type { FolderProgress, UserDictionaryFolder } from "@yuny/shared";
import { Button, Chip, EmptyState, ErrorState, LoadingState, StageBar, Text } from "@/shared/ui";
import { useCreateFolder, useFolderProgress, useFolders, useSavedItems } from "@/shared/api";
import { focusRef } from "@/shared/platform/focusRef";
import { t } from "@/shared/i18n";
import { FolderNameSheet } from "./FolderNameSheet";
import { folderCounts } from "./saved";

/**
 * Свой словарь на экране 04, пока поле поиска пустое (#38): папки со
 * счётчиком слов и кнопка новой папки. Папка открывается отдельным экраном
 * `/folder/[id]`.
 *
 * `header` — карточка «Сегодня» на узком экране (#66): прокручивается вместе
 * с папками. Пока она — главный акцент экрана, «Новая папка» становится
 * `secondary` (today-session.design.md §2, «один primary»).
 */
export interface MyDictionaryHandle {
  /** «Можно поучить папку →»: прокрутить к «Мой словарь» и поставить туда фокус. */
  showFolders(): void;
}

export interface MyDictionaryProps {
  header?: ReactNode;
  newFolderVariant?: "primary" | "secondary";
  ref?: Ref<MyDictionaryHandle>;
}

export function MyDictionary({ header, newFolderVariant = "primary", ref }: MyDictionaryProps) {
  const router = useRouter();
  const folders = useFolders();
  const items = useSavedItems();
  const create = useCreateFolder();
  // Стадии и «пора освежить» по папкам (#70); не пришли — карточки без полоски.
  const progress = useFolderProgress();
  const [creating, setCreating] = useState(false);
  const newFolderRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const titleRef = useRef<View>(null);
  const titleY = useRef(0);

  useImperativeHandle(ref, () => ({
    showFolders() {
      scrollRef.current?.scrollTo({ y: titleY.current, animated: true });
      focusRef(titleRef);
    },
  }));

  if (folders.isPending || items.isPending) {
    return (
      <View className="flex-1">
        {header ? <View className="px-lg">{header}</View> : null}
        <LoadingState className="flex-1" message={t("dictionary.mine.loading")} />
      </View>
    );
  }
  if ((folders.isError && !folders.data) || (items.isError && !items.data)) {
    return (
      <View className="flex-1">
        {header ? <View className="px-lg">{header}</View> : null}
        <ErrorState
        className="flex-1"
        title={t("dictionary.mine.error")}
        onRetry={() => {
          void folders.refetch();
          void items.refetch();
        }}
        retryLabel={t("dictionary.mine.retry")}
        />
      </View>
    );
  }

  const counts = folderCounts(items.data);

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerClassName="gap-md px-lg pb-xl"
      keyboardShouldPersistTaps="handled"
    >
      {header ? <View className="mb-md">{header}</View> : null}
      <View
        ref={titleRef}
        onLayout={(event) => {
          titleY.current = event.nativeEvent.layout.y;
        }}
        // Цель «Можно поучить папку →»: на web фокус ставится программно.
        {...({ tabIndex: -1 } as object)}
      >
        <Text variant="heading" accessibilityRole="header">
          {t("dictionary.mine.title")}
        </Text>
      </View>

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
              progress={progress.data?.find((p) => p.folder_id === folder.id) ?? null}
              onPress={() => router.push({ pathname: "/folder/[id]", params: { id: folder.id } })}
            />
          ))}
        </View>
      )}

      <Button
        ref={newFolderRef}
        label={t("dictionary.mine.newFolder")}
        variant={newFolderVariant}
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

/**
 * Карточка папки (folder-map.design.md §3.7): название, число слов, мини-полоска
 * стадий и «N пора освежить». Сводки нет — только название и число.
 */
function FolderRow({
  folder,
  count,
  progress,
  onPress,
}: {
  folder: UserDictionaryFolder;
  count: number;
  progress: FolderProgress | null;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const words = t("dictionary.mine.words", { count });
  const due = progress && progress.due_count > 0 ? t("learn.map.due", { count: progress.due_count }) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[folder.name, words, due].filter(Boolean).join(". ")}
      accessibilityHint={t("dictionary.mine.folderA11yHint")}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      className={`min-h-tap gap-sm rounded-tile px-md py-md ${
        pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : "bg-surface dark:bg-surface-dark"
      }`}
    >
      <View className="flex-row items-center gap-md">
        <Text variant="body" className="flex-1 font-semibold" numberOfLines={1}>
          {folder.name}
        </Text>
        <Text variant="caption" tone="muted">
          {words}
        </Text>
      </View>
      {progress && progress.word_count > 0 ? (
        <View aria-hidden>
          <StageBar counts={progress.stage_counts} size="mini" />
        </View>
      ) : null}
      {due ? (
        <View className="flex-row">
          <Chip size="micro" variant="attention" label={due} />
        </View>
      ) : null}
    </Pressable>
  );
}
