import { useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActionRow,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  FeedbackBanner,
  IconButton,
  Sheet,
  StageBar,
  StageLegend,
  STAGE_ORDER,
  Text,
  WordTile,
  type Stage,
} from "@/shared/ui";
import { useDeleteFolder, useFolderMap, useFolders, useRenameFolder, useSavedItems } from "@/shared/api";
import { breakpoints, sizing, spacing } from "@/shared/config/tokens";
import { focusRef } from "@/shared/platform/focusRef";
import { t } from "@/shared/i18n";
import { ArticleSheet, type SheetWord } from "@/features/dictionary/ArticleSheet";
import { FolderNameSheet } from "@/features/dictionary/FolderNameSheet";
import { FolderMapSkeleton } from "@/features/dictionary/FolderMapSkeleton";
import { nextGridIndex } from "@/features/dictionary/gridNav";
import { folderWords, wordKey, type SavedWord } from "@/features/dictionary/saved";
import { useRowRefs } from "@/features/dictionary/useRowRefs";
import { queueText } from "@/features/study/queueText";
import { FolderStudyBlock } from "@/features/study/FolderStudyBlock";

/** Стадии от самой прочной — так полоска «заполняется» слева направо (folder-map.design.md §3.2). */
const LEGEND_ORDER: readonly Stage[] = [...STAGE_ORDER].reverse();

/**
 * Папка своего словаря (#38, карта — #70): полоска стадий, блок учёбы и
 * мозаика слов — насыщенность плитки = стадия, пунктир — «пора освежить»,
 * метка — пара путаницы (folder-map.design.md). Стадии и сроки — с сервера
 * (`learning-overview`). Переименовать и удалить — в листе «⋯». Плитка
 * открывает ту же статью, что и поиск, с прогрессом слова.
 *
 * Слова — в порядке добавления (`position`). На широком экране шапка папки
 * стоит слева колонкой `heroColumn`, мозаика — справа (§3.1). По сетке на web
 * ходят стрелками: одна плитка — остановка Tab (roving tabindex, §7).
 */
export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const folders = useFolders();
  const items = useSavedItems();
  const rename = useRenameFolder();
  const remove = useDeleteFolder();

  const map = useFolderMap(id);
  const [screenWidth, setScreenWidth] = useState(0);
  const [listWidth, setListWidth] = useState(0);
  const wide = screenWidth >= breakpoints.wide;
  const listRef = useRef<FlatList<SavedWord | null>>(null);
  // Плитка — остановка Tab в сетке; стрелки двигают её вместе с фокусом.
  const [tabIndexAt, setTabIndexAt] = useState(0);
  const [actionsOpen, setActionsOpen] = useState(false);
  const moreRef = useRef<View>(null);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const [openWord, setOpenWord] = useState<SheetWord | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const refFor = useRowRefs();

  const folder = folders.data?.find((f) => f.id === id) ?? null;
  const words = useMemo(() => folderWords(items.data ?? [], id), [items.data, id]);
  const rovingIndex = Math.min(tabIndexAt, Math.max(words.length - 1, 0));

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/dictionary");
  }

  const header = (
    // Без своего отступа: у кнопки-призрака он уже `lg`, и текст «Назад»
    // встаёт на одну линию с заголовком и строками (review m8).
    <View className="flex-row items-center justify-between pr-md pt-md">
      <Button
        label={t("dictionary.folder.back")}
        accessibilityLabel={t("dictionary.folder.backA11y")}
        variant="ghost"
        onPress={goBack}
      />
      {folder ? (
        <IconButton ref={moreRef} icon="more" accessibilityLabel={t("learn.map.more")} onPress={() => setActionsOpen(true)} />
      ) : null}
    </View>
  );

  // Стадия, «пора освежить» и пара — с сервера, по ключу слова; нет сводки — плитка «новая».
  const progressByKey = useMemo(
    () => new Map((map.data?.words ?? []).map((w) => [wordKey(w.headword, w.reading), w])),
    [map.data],
  );
  // §3.4: ширина — из `onLayout` самого списка, за вычетом его полей
  // (на узком `px-lg`, на широком `pl-sm pr-lg` — см. `renderBody`).
  const gridInner = listWidth - (wide ? spacing.sm + spacing.lg : 2 * spacing.lg);
  const columns = Math.max(3, Math.floor((gridInner + spacing.sm) / (sizing.wordTile + spacing.sm)));
  // Последний ряд дополняется пустыми ячейками, чтобы плитки не растягивались.
  const cells: (SavedWord | null)[] = [...words];
  while (cells.length % columns !== 0) cells.push(null);

  /** Стрелки и Home / End на плитке (web): фокус — на соседнюю по сетке. */
  function onTileKey(index: number, event: { key: string; preventDefault(): void }) {
    const next = nextGridIndex(index, words.length, columns, event.key);
    if (next === null) return;
    event.preventDefault();
    if (next === index) return;
    setTabIndexAt(next);
    const target = refFor(words[next]!.key);
    if (target.current) {
      focusRef(target);
      return;
    }
    // Ряд ещё не отрисован (длинная папка): сначала прокрутка, потом фокус.
    listRef.current?.scrollToIndex({ index: Math.floor(next / columns), viewPosition: 0.5, animated: false });
    requestAnimationFrame(() => focusRef(target));
  }

  function renderBody() {
    // Пока нет карты, плитки были бы «новыми» и на её приходе все разом
    // «налились» бы — поэтому скелет ждёт и её (кроме ошибки карты).
    if (folders.isPending || items.isPending || (map.isPending && !map.isError)) {
      return <FolderMapSkeleton message={t("dictionary.folder.loading")} />;
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

    const counts = map.data?.stage_counts ?? null;
    const queue = map.data ? queueText(map.data) : null;
    const legend = counts
      ? LEGEND_ORDER.filter((stage) => counts[stage] > 0).map((stage) => ({
        stage,
        label: t("learn.map.legendItem", { stage: t(`learn.stage.${stage}`), count: counts[stage] }),
      }))
      : [];

    // Шапка папки: на узком — над мозаикой в том же списке, на широком — левой колонкой.
    const summary = (
      <View className="gap-md">
        <View className="gap-xs">
          <Text variant="display" accessibilityRole="header">
            {folder.name}
          </Text>
          <View className="flex-row flex-wrap items-center gap-sm">
            <Text variant="caption" tone="muted">
              {t("dictionary.mine.words", { count: words.length })}
            </Text>
            {map.data && map.data.due_count > 0 ? (
              <Chip size="micro" variant="attention" label={t("learn.map.due", { count: map.data.due_count })} />
            ) : null}
          </View>
        </View>
        {counts && words.length > 0 ? (
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={t("learn.map.stageBarA11y", { list: legend.map((l) => l.label).join(", ") })}
            className="gap-sm"
          >
            <StageBar counts={counts} />
            <View aria-hidden>
              <StageLegend items={legend} />
            </View>
          </View>
        ) : null}
        {queue ? (
          <Text variant="caption" tone="muted">
            {queue}
          </Text>
        ) : null}
        {words.length > 0 ? (
          <View className="pt-sm">
            <FolderStudyBlock
              folderId={folder.id}
              onStart={(mode) => router.push({ pathname: "/study", params: { folder: folder.id, mode } })}
            />
          </View>
        ) : null}
      </View>
    );
    const wordsTitle =
      words.length > 0 ? (
        <Text variant="eyebrow" tone="muted" className={`uppercase ${wide ? "" : "pt-xl"}`}>
          {t("learn.map.words")}
        </Text>
      ) : null;

    const grid = (
      <FlatList
        ref={listRef}
        key={columns}
        data={cells}
        numColumns={columns}
        keyExtractor={(word, i) => word?.key ?? `empty-${i}`}
        onLayout={(event) => setListWidth(event.nativeEvent.layout.width)}
        contentContainerClassName={wide ? "pb-xl pl-sm pr-lg" : "px-lg pb-xl"}
        columnWrapperClassName="gap-sm"
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        // Длинная папка: ряд с фокусом ещё не измерен — прокручиваем по оценке и пробуем снова.
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
          requestAnimationFrame(() => focusRef(refFor(words[rovingIndex]?.key ?? "")));
        }}
        ListHeaderComponent={
          <View className="gap-sm pb-sm">
            {wide ? null : summary}
            {wordsTitle}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            message={t("dictionary.folder.empty")}
            actionLabel={t("dictionary.folder.emptyAction")}
            onAction={() => router.navigate("/dictionary")}
          />
        }
        renderItem={({ item: word, index }) => {
          // Одинаковая обёртка без отступов у каждой ячейки: иначе в неполном ряду
          // плитка (с `p-sm` и рамкой) выходит шире соседних.
          if (!word) return <View className="flex-1" />;
          const p = progressByKey.get(word.key);
          const stage: Stage = p?.stage ?? "new";
          const label = [
            word.headword,
            word.reading,
            word.translation,
            t(`learn.stage.${stage}`),
            p?.due ? t("learn.map.tileDue") : null,
            p?.pair_partner ? t("learn.map.tilePair", { partner: p.pair_partner }) : null,
          ]
            .filter(Boolean)
            .join(". ");
          return (
            <View className="flex-1 flex-row">
              <WordTile
                ref={refFor(word.key)}
                headword={word.headword}
                stage={stage}
                due={p?.due ?? false}
                pairPartner={p?.pair_partner ?? undefined}
                accessibilityLabel={label}
                tabStop={index === rovingIndex}
                onFocus={() => setTabIndexAt(index)}
                onKeyDown={(event) => onTileKey(index, event)}
                onPress={() => {
                  setTabIndexAt(index);
                  setFocusKey(word.key);
                  setOpenWord(word);
                }}
                className="flex-1"
              />
            </View>
          );
        }}
      />
    );

    if (!wide) return grid;
    // §3.1, широкий: шапка — колонка `heroColumn` слева, прилипает к верху
    // (прокручивается сама, если выше экрана); справа «СЛОВА» и мозаика.
    // Поля колонок — внутри прокрутки, а не снаружи: иначе она обрезает свечение
    // кнопки учёбы и кольцо фокуса у крайних плиток. Между колонками
    // `pr-lg` шапки + `pl-sm` мозаики = `spacing.xl`.
    return (
      <View className="flex-1 flex-row">
        <ScrollView
          className="grow-0"
          style={{ width: sizing.heroColumn + 2 * spacing.lg }}
          contentContainerClassName="px-lg pb-xl"
        >
          {summary}
        </ScrollView>
        <View className="flex-1">{grid}</View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-background-dark"
      style={{ paddingTop: insets.top }}
      onLayout={(event) => setScreenWidth(event.nativeEvent.layout.width)}
    >
      {header}
      {renderBody()}

      <ArticleSheet
        word={openWord}
        onClose={() => setOpenWord(null)}
        returnFocusRef={focusKey !== null ? refFor(focusKey) : undefined}
        currentFolder={folder ? { id: folder.id, name: folder.name } : null}
      />

      {/* «⋯»: редкие действия с папкой (folder-map.design.md §3.6). */}
      <Sheet
        visible={actionsOpen && folder !== null}
        onClose={() => setActionsOpen(false)}
        accessibilityLabel={t("learn.map.more")}
        returnFocusRef={moreRef}
      >
        {folder ? (
          <View className="gap-sm">
            <Text variant="heading" accessibilityRole="header">
              {folder.name}
            </Text>
            <ActionRow
              icon="edit"
              label={t("dictionary.folder.rename")}
              onPress={() => {
                setActionsOpen(false);
                setRenaming(true);
              }}
            />
            <ActionRow
              icon="trash"
              label={t("dictionary.folder.delete")}
              onPress={() => {
                setActionsOpen(false);
                setDeleteError(false);
                setConfirmingDelete(true);
              }}
            />
          </View>
        ) : null}
      </Sheet>

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
          returnFocusRef={moreRef}
        />
      ) : null}

      <Sheet
        visible={confirmingDelete && folder !== null}
        onClose={() => setConfirmingDelete(false)}
        accessibilityLabel={folder ? t("dictionary.folder.confirmTitle", { name: folder.name }) : ""}
        returnFocusRef={moreRef}
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
