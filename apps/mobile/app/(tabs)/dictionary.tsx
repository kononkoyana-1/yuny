import { useState, type RefObject } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DictionaryEntry } from "@yuny/shared";
import {
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingState,
  Sheet,
  Text,
} from "@/shared/ui";
import { useDictionarySearch } from "@/shared/api";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import { spacing } from "@/shared/config/tokens";
import { t } from "@/shared/i18n";
import { EntryArticle } from "@/features/dictionary/EntryArticle";
import { EntryRow } from "@/features/dictionary/EntryRow";

/** Пауза после последней буквы, прежде чем запрос уйдёт на сервер. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Экран 04 — Словарь (TZ.md §11), часть «поиск и статья» (#37). Одно поле:
 * иероглиф, пиньинь и русский перевод ищутся одним запросом, вид запроса
 * определяет сервер. Строка выдачи открывает полную статью БКРС в `Sheet`.
 * Уровень HSK на экране не показывается (TZ.md §4).
 *
 * Свой словарь с папками (#38) добавится на этот же экран.
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

  const [openEntry, setOpenEntry] = useState<DictionaryEntry | null>(null);
  // Та же схема, что на Главной: строка, к которой вернуть фокус, живёт
  // отдельно от открытой статьи — `onClose` обнуляет `openEntry` в том же
  // рендере, в котором `Sheet` читает `returnFocusRef`.
  const [focusEntryId, setFocusEntryId] = useState<number | null>(null);
  const [rowRefs] = useState(() => new Map<number, RefObject<View | null>>());
  function refFor(id: number): RefObject<View | null> {
    let ref = rowRefs.get(id);
    if (!ref) {
      ref = { current: null };
      rowRefs.set(id, ref);
    }
    return ref;
  }

  function openArticle(entry: DictionaryEntry) {
    setFocusEntryId(entry.id);
    setOpenEntry(entry);
  }

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const kind = data?.pages[0]?.kind;

  function renderBody() {
    // Пустое поле — приглашение, а не пустая выдача. Проверяется первым:
    // выключенный запрос тоже в состоянии `pending`.
    if (query === "") {
      return <EmptyState className="flex-1" message={t("dictionary.idle")} />;
    }
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
    if (items.length === 0 && kind) {
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
        renderItem={({ item }) => (
          <EntryRow ref={refFor(item.id)} entry={item} onPress={openArticle} />
        )}
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
            accessibilityRole="search"
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

      <Sheet
        visible={openEntry !== null}
        onClose={() => setOpenEntry(null)}
        accessibilityLabel={openEntry?.headword ?? ""}
        returnFocusRef={focusEntryId !== null ? refFor(focusEntryId) : undefined}
      >
        {openEntry ? (
          <View className="gap-lg">
            <View className="flex-row items-start gap-md">
              <View className="flex-1 gap-xs">
                <Text variant="display" accessibilityRole="header">
                  {openEntry.headword}
                </Text>
                {openEntry.reading ? (
                  <Text variant="heading" tone="muted">
                    {openEntry.reading}
                  </Text>
                ) : null}
              </View>
              <IconButton
                icon="close"
                accessibilityLabel={t("dictionary.article.close")}
                onPress={() => setOpenEntry(null)}
              />
            </View>
            <EntryArticle entry={openEntry} />
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}
