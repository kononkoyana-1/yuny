import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, EmptyState, ErrorState, IconButton, Input, LoadingState, Text } from "@/shared/ui";
import { useDictionarySearch, useSavedItems } from "@/shared/api";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import { spacing } from "@/shared/config/tokens";
import { t } from "@/shared/i18n";
import { ArticleSheet, type SheetWord } from "@/features/dictionary/ArticleSheet";
import { EntryRow } from "@/features/dictionary/EntryRow";
import { MyDictionary } from "@/features/dictionary/MyDictionary";
import { groupSavedWords, searchSaved, wordKey } from "@/features/dictionary/saved";
import { useRowRefs } from "@/features/dictionary/useRowRefs";

/** Пауза после последней буквы, прежде чем запрос уйдёт на сервер. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Экран 04 — Словарь (TZ.md §11). Одно поле: иероглиф, пиньинь и русский
 * перевод ищутся одним запросом, вид запроса определяет сервер (#37). Пока
 * поле пустое, на экране свой словарь — папки со словами (#38); с запросом —
 * сначала совпадения из своего словаря, под ними выдача БКРС. Строка
 * открывает статью в листе, оттуда слово раскладывается по папкам. Уровень
 * HSK на экране не показывается (TZ.md §4).
 */
export default function DictionaryTab() {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const query = useDebouncedValue(input.trim(), SEARCH_DEBOUNCE_MS);

  const {
    data,
    isPending,
    isError,
    isPlaceholderData,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useDictionarySearch(query);
  const saved = useSavedItems();

  const [openWord, setOpenWord] = useState<SheetWord | null>(null);
  // Та же схема, что на Главной: строка, к которой вернуть фокус, живёт
  // отдельно от открытого слова — `onClose` обнуляет `openWord` в том же
  // рендере, в котором `Sheet` читает `returnFocusRef`.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const refFor = useRowRefs();

  function open(rowKey: string, word: SheetWord) {
    setFocusKey(rowKey);
    setOpenWord(word);
  }

  const savedWords = useMemo(() => groupSavedWords(saved.data ?? []), [saved.data]);
  const savedKeys = useMemo(() => new Set(savedWords.map((w) => w.key)), [savedWords]);
  const ownMatches = useMemo(() => searchSaved(savedWords, query), [savedWords, query]);

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const kind = data?.pages[0]?.kind;

  function renderBody() {
    // Пустое поле — свой словарь. Проверяется первым: выключенный запрос
    // тоже в состоянии `pending`.
    if (query === "") return <MyDictionary />;
    if (isPending) {
      return <LoadingState className="flex-1" message={t("dictionary.loading")} />;
    }
    if (isError && !data) {
      return (
        <ErrorState
          className="flex-1"
          title={t("dictionary.error.title")}
          detail={t("dictionary.error.detail")}
          onRetry={() => void refetch()}
          retryLabel={t("dictionary.error.retry")}
        />
      );
    }
    if (items.length === 0 && ownMatches.length === 0 && kind) {
      return <EmptyState className="flex-1" message={t(`dictionary.empty.${kind}`)} />;
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(entry) => String(entry.id)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // Пока догружается выдача нового запроса, на экране старая — чуть
        // приглушённая, чтобы не читалась как ответ на новый.
        style={{ opacity: isPlaceholderData ? 0.5 : 1 }}
        contentContainerClassName="px-lg pb-xl"
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
        }}
        ListHeaderComponent={
          ownMatches.length > 0 ? (
            <View className="gap-sm pb-lg">
              <Text variant="heading" accessibilityRole="header">
                {t("dictionary.mine.found")}
              </Text>
              {ownMatches.map((word) => {
                const rowKey = `saved:${word.key}`;
                return (
                  <EntryRow
                    key={rowKey}
                    ref={refFor(rowKey)}
                    word={word.entry ?? { ...word, senses: [], compact: [] }}
                    translation={word.translation}
                    onPress={() => open(rowKey, word)}
                  />
                );
              })}
              {items.length > 0 ? (
                <Text variant="heading" accessibilityRole="header" className="pt-md">
                  {t("dictionary.mine.bkrs")}
                </Text>
              ) : null}
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const rowKey = `bkrs:${item.id}`;
          return (
            <EntryRow
              ref={refFor(rowKey)}
              word={item}
              saved={savedKeys.has(wordKey(item.headword, item.reading))}
              onPress={() => open(rowKey, { headword: item.headword, reading: item.reading, entry: item })}
            />
          );
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <Text variant="caption" tone="muted" className="py-md text-center">
              {t("dictionary.loadingMore")}
            </Text>
          ) : isFetchNextPageError ? (
            <View className="items-center py-md">
              <Button
                label={t("dictionary.error.more")}
                variant="ghost"
                onPress={() => void fetchNextPage()}
              />
            </View>
          ) : null
        }
      />
    );
  }

  return (
    <View className="flex-1 bg-background dark:bg-background-dark" style={{ paddingTop: insets.top }}>
      <View className="gap-md px-lg pb-md pt-xl">
        <Text variant="title" accessibilityRole="header">
          {t("dictionary.title")}
        </Text>
        <View className="flex-row items-center gap-sm">
          <Input
            className="flex-1"
            value={input}
            onChangeText={setInput}
            placeholder={t("dictionary.search.placeholder")}
            accessibilityLabel={t("dictionary.search.a11y")}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            inputMode="search"
            maxLength={64}
          />
          {input !== "" ? (
            <IconButton
              icon="close"
              accessibilityLabel={t("dictionary.search.clear")}
              onPress={() => setInput("")}
            />
          ) : null}
        </View>
      </View>

      {renderBody()}

      <ArticleSheet
        word={openWord}
        onClose={() => setOpenWord(null)}
        returnFocusRef={focusKey !== null ? refFor(focusKey) : undefined}
      />
    </View>
  );
}
