import { useMemo, useRef, useState, type RefObject } from "react";
import { FlatList, View, type TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, EmptyState, ErrorState, LoadingState, Text } from "@/shared/ui";
import { useDictionarySearch, usePhraseTranslation, useSavedItems, useToday, useTodayActions } from "@/shared/api";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import { breakpoints, spacing } from "@/shared/config/tokens";
import { t } from "@/shared/i18n";
import { ArticleSheet, type SheetWord } from "@/features/dictionary/ArticleSheet";
import { EntryRow } from "@/features/dictionary/EntryRow";
import { SearchField } from "@/features/dictionary/SearchField";
import { PhraseCard } from "@/features/dictionary/PhraseCard";
import { isPhraseQuery } from "@/features/dictionary/phrase";
import { MyDictionary, type MyDictionaryHandle } from "@/features/dictionary/MyDictionary";
import { TodayHero } from "@/features/study/TodayHero";
import { BudgetSheet } from "@/features/study/BudgetSheet";
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
 *
 * Над своим словарём — карточка «Сегодня» (#66, today-session.design.md
 * §3.2): на узком экране прокручивается вместе с папками, на широком стоит
 * слева отдельной колонкой. Раскладка — по ширине контейнера из `onLayout`:
 * в статической web-сборке `useWindowDimensions` на первой отрисовке
 * ошибался (#56).
 */
export default function DictionaryTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [input, setInput] = useState("");
  const inputRef = useRef<TextInput>(null);
  // После утреннего окна фокус — в поле поиска (§7); `Sheet` ждёт ref на View,
  // а на web у поля тот же `.focus()`.
  const inputRefAsView = inputRef as unknown as RefObject<View | null>;
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
  const today = useToday();
  const { markPromptShown, saveBudget } = useTodayActions();
  // Окно «Повторим?»: утреннее открыто, пока сервер его предлагает и в этом
  // заходе его не закрыли; из чипа — по нажатию (today-session.design.md §3.7).
  const [promptClosed, setPromptClosed] = useState(false);
  const [changingBudget, setChangingBudget] = useState(false);
  const budgetChipRef = useRef<View>(null);
  const budgetMode = changingBudget
    ? "change"
    : today.data?.show_daily_prompt && !promptClosed && input === ""
      ? "daily"
      : null;
  const [width, setWidth] = useState(0);
  const wide = width >= breakpoints.wide;
  const myDictionaryRef = useRef<MyDictionaryHandle>(null);

  const [openWord, setOpenWord] = useState<SheetWord | null>(null);
  // Строка, к которой вернуть фокус, живёт
  // отдельно от открытого слова — `onClose` обнуляет `openWord` в том же
  // рендере, в котором `Sheet` читает `returnFocusRef`.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const refFor = useRowRefs();

  function open(rowKey: string, word: SheetWord) {
    setFocusKey(rowKey);
    setOpenWord(word);
  }

  const savedWords = useMemo(() => groupSavedWords(saved.data ?? []), [saved.data]);
  const savedByKey = useMemo(() => new Map(savedWords.map((w) => [w.key, w])), [savedWords]);
  const ownMatches = useMemo(() => searchSaved(savedWords, query), [savedWords, query]);

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const kind = data?.pages[0]?.kind;

  // Фраза, а не слово (#76): перевод и слова фразы — над обычной выдачей.
  // Решаем по уже пришедшей выдаче этого запроса, не по прошлой.
  const phrase = query !== "" && !isPending && !isPlaceholderData && isPhraseQuery(query, items);
  const phraseQuery = usePhraseTranslation(query, phrase);
  const phraseCard = phrase ? (
    <View className="pb-md">
      <PhraseCard
        data={phraseQuery.data}
        isPending={phraseQuery.isPending}
        error={phraseQuery.error}
        onRetry={() => void phraseQuery.refetch()}
        onOpenWord={(w) => open(`phrase:${w.headword}`, { headword: w.headword, reading: w.reading })}
      />
    </View>
  ) : null;

  function renderBody() {
    // Пустое поле — свой словарь. Проверяется первым: выключенный запрос
    // тоже в состоянии `pending`.
    if (query === "") return renderMine();
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
    if (items.length === 0 && ownMatches.length === 0 && kind && !phrase) {
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
          <>
            {phraseCard}
            {ownMatches.length > 0 ? (
              // Под заголовком «Словарь БКРС» — тот же `sm`, что под «В моём
              // словаре»: заголовок прилипает к своим строкам (review m7).
              <View className={`gap-sm ${items.length > 0 ? "pb-sm" : "pb-lg"}`}>
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
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const rowKey = `bkrs:${item.id}`;
          // Уже сохранённое слово открывается со своим значением и его
          // источником — как из папки (review n3): иначе статья не показала
          // бы перевод из файла, а сохранение в ещё одну папку скопировало
          // бы значение статьи вместо него.
          const own = savedByKey.get(wordKey(item.headword, item.reading));
          return (
            <EntryRow
              ref={refFor(rowKey)}
              word={item}
              saved={own !== undefined}
              onPress={() =>
                open(rowKey, {
                  headword: item.headword,
                  reading: item.reading,
                  entry: item,
                  translation: own?.translation,
                  translationSource: own?.translationSource,
                })
              }
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

  function renderMine() {
    // Пока карточка — герой, главный акцент экрана она, а не «Новая папка».
    const heroIsPrimary = today.data?.state === "ready" || (!today.data && !today.isError);
    const hero = (
      <TodayHero
        today={today.data}
        isError={today.isError}
        onRetry={() => void today.refetch()}
        onStart={() => router.push("/study")}
        onChangeBudget={() => setChangingBudget(true)}
        budgetChipRef={budgetChipRef}
        onToFolders={() => myDictionaryRef.current?.showFolders()}
      />
    );
    const newFolderVariant = heroIsPrimary ? "secondary" : "primary";

    if (!wide) {
      return <MyDictionary ref={myDictionaryRef} header={hero} newFolderVariant={newFolderVariant} />;
    }
    return (
      <View className="flex-1 flex-row gap-xl pl-lg">
        <View className="w-hero-column">{hero}</View>
        <View className="flex-1">
          <MyDictionary ref={myDictionaryRef} newFolderVariant={newFolderVariant} />
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-background-dark"
      style={{ paddingTop: insets.top }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {/* Заголовка нет: поиск — первое на экране (вкладка и так «Главная»). */}
      <View className="px-lg pb-md pt-md">
        <SearchField
          ref={inputRef}
          value={input}
          onChangeText={setInput}
          onClear={() => {
            setInput("");
            // Кнопка очистки сейчас исчезнет вместе с фокусом на ней —
            // ведём фокус туда, где человек продолжит: в поле.
            inputRef.current?.focus();
          }}
        />
      </View>

      {renderBody()}

      {today.data ? (
        <BudgetSheet
          mode={budgetMode}
          today={today.data}
          returnFocusRef={budgetMode === "change" ? budgetChipRef : inputRefAsView}
          onStart={async (minutes) => {
            await saveBudget(minutes, today.data?.today);
            setPromptClosed(true);
            router.push({ pathname: "/study", params: { minutes: String(minutes) } });
          }}
          onSave={async (minutes) => {
            await saveBudget(minutes);
            setChangingBudget(false);
          }}
          onClose={() => {
            if (budgetMode === "change") {
              setChangingBudget(false);
              return;
            }
            setPromptClosed(true);
            // «Позже» — до завтра. Не записалось — окно просто покажется ещё раз.
            if (today.data) void markPromptShown(today.data.today).catch(() => undefined);
          }}
        />
      ) : null}

      <ArticleSheet
        word={openWord}
        onClose={() => setOpenWord(null)}
        returnFocusRef={focusKey !== null ? refFor(focusKey) : undefined}
      />
    </View>
  );
}
