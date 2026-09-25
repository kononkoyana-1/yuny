import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Pressable, View, type TextInput } from "react-native";
import {
  FolderNameSchema,
  type SavedEntry,
  type SavedTranslationSource,
  type UserDictionaryFolder,
} from "@yuny/shared";
import { Button, Chip, FeedbackBanner, HanziText, Icon, IconButton, Input, Sheet, Text } from "@/shared/ui";
import { FOCUS_RING_CLASS } from "@/shared/ui/focusRing";
import { useTheme } from "@/shared/lib/useTheme";
import {
  useAddToFolder,
  useDictionaryArticle,
  useCreateFolder,
  useFolders,
  useRemoveFromFolder,
  useSavedItems,
} from "@/shared/api";
import { BackendError } from "@/shared/lib/backendError";
import { returnFocusTo } from "@/shared/platform/sheetA11y";
import { t } from "@/shared/i18n";
import { CheckMark, CheckRow } from "./CheckMark";
import { shortMeaning } from "./article";
import { CharGraph } from "./CharGraph";
import { EntryArticle } from "./EntryArticle";
import { WordComposition } from "./WordComposition";
import { translationLine, wordKey } from "./saved";
import { WordProgressBlock } from "@/features/study/WordProgressBlock";

/** Слово, которое открыто в листе: из выдачи БКРС или из папки своего словаря. */
export interface SheetWord {
  headword: string;
  reading: string | null;
  /**
   * `null` — у слова из папки, чья статья пропала после перезаливки словаря.
   * Не задана — слово открыто из состава или графа знака (#79, #84): статью
   * приносит запрос статьи.
   */
  entry?: SavedEntry | null;
  /** Сохранённое значение слова, если оно уже лежит в какой-то папке. */
  translation?: string | null;
  /** Откуда `translation`: из файла, из статьи или от модели. */
  translationSource?: SavedTranslationSource | null;
}

export interface ArticleSheetProps {
  word: SheetWord | null;
  onClose: () => void;
  returnFocusRef?: RefObject<View | null>;
  /** Лист открыт с экрана этой папки: «Убрать из «…»» (folder-map.design.md §3.5). */
  currentFolder?: { id: string; name: string } | null;
  /** Слово убрано из `currentFolder` — лист закрывается, экран сам решает, куда поставить фокус. */
  onRemoved?: () => void;
}

/**
 * Словарная статья в листе и кнопка «в мой словарь» с выбором папок
 * (TZ.md §11 экран 04, #37 и #38). Один компонент на экран словаря и экран
 * папки: и там и там из статьи можно разложить слово по папкам, а снятая
 * галочка убирает его из папки.
 */
export function ArticleSheet({ word, onClose, returnFocusRef, currentFolder = null, onRemoved }: ArticleSheetProps) {
  // Стек статей (#79, #84): знак из состава или слово из графа открываются
  // поверх, «назад» и Escape возвращают к предыдущей. Новое слово снаружи —
  // стек с нуля.
  const [stack, setStack] = useState<SheetWord[]>([]);
  const [root, setRoot] = useState(word);
  if (root !== word) {
    setRoot(word);
    setStack([]);
  }
  const current = stack.at(-1) ?? word;
  const previous = stack.length > 1 ? stack.at(-2)! : stack.length === 1 ? word : null;
  const back = useCallback(() => setStack((s) => s.slice(0, -1)), []);

  return (
    <Sheet
      visible={word !== null}
      onClose={onClose}
      onBack={stack.length > 0 ? back : undefined}
      accessibilityLabel={current?.headword ?? ""}
      returnFocusRef={returnFocusRef}
    >
      {/* `key` сбрасывает режим листа на статью, когда открывают другое слово. */}
      {current ? (
        <ArticleSheetBody
          key={`${stack.length}:${wordKey(current.headword, current.reading)}`}
          word={current}
          previous={previous}
          onBack={back}
          onOpen={(next) => setStack((s) => [...s, next])}
          onClose={onClose}
          // «Убрать из папки» — только у слова, с которым лист открыли.
          currentFolder={stack.length === 0 ? currentFolder : null}
          onRemoved={onRemoved}
        />
      ) : null}
    </Sheet>
  );
}

function ArticleSheetBody({
  word: opened,
  previous,
  onBack,
  onOpen,
  onClose,
  currentFolder,
  onRemoved,
}: {
  word: SheetWord;
  /** Статья под этой в стеке — для кнопки «Назад к …». */
  previous: SheetWord | null;
  onBack: () => void;
  onOpen: (word: SheetWord) => void;
  onClose: () => void;
  currentFolder: { id: string; name: string } | null;
  onRemoved?: () => void;
}) {
  const [mode, setMode] = useState<"article" | "folders">("article");
  const remove = useRemoveFromFolder();
  const [removeError, setRemoveError] = useState(false);
  const folders = useFolders();
  const items = useSavedItems();
  const actionRef = useRef<View>(null);
  const cameBack = useRef(false);
  const headerRef = useRef<View>(null);
  const article = useDictionaryArticle(opened.headword, opened.reading);
  // Статья слова из состава или графа приходит запросом статьи.
  const word: SheetWord & { entry: SavedEntry | null } = {
    ...opened,
    entry: opened.entry !== undefined ? opened.entry : (article.data?.entry ?? null),
  };
  const loadingEntry = opened.entry === undefined && article.isPending;
  const hsk = article.data?.hsk_level ?? null;

  // Открыли статью поверх другой (или вернулись) — фокус на кнопку «назад»,
  // иначе он остался бы на нажатой плитке, которой уже нет.
  useEffect(() => {
    if (previous) returnFocusTo(headerRef);
  }, [previous]);

  // Вернулись из выбора папок — фокус на кнопку, которая туда вела: кнопки
  // «Готово» уже нет, и без этого фокус падал на страницу (review n1).
  useEffect(() => {
    if (mode === "folders") {
      cameBack.current = true;
    } else if (cameBack.current) {
      returnFocusTo(actionRef);
    }
  }, [mode]);

  const key = wordKey(word.headword, word.reading);
  const wordItems = (items.data ?? []).filter((i) => wordKey(i.headword, i.reading) === key);
  const line = translationLine(word);
  const savedFolderNames = (folders.data ?? [])
    .filter((f) => wordItems.some((i) => i.folder_id === f.id))
    .map((f) => f.name);
  const inCurrent = currentFolder ? wordItems.find((i) => i.folder_id === currentFolder.id) : undefined;

  async function removeFromCurrent() {
    if (!inCurrent) return;
    setRemoveError(false);
    try {
      await remove.mutateAsync(inCurrent.id);
      onRemoved?.();
      onClose();
    } catch {
      setRemoveError(true);
    }
  }

  return (
    <View className="gap-lg">
      {previous ? (
        <BackLink ref={headerRef} to={previous.headword} onPress={onBack} />
      ) : null}
      <View className="flex-row items-start gap-md">
        <View className="flex-1 gap-xs">
          <Text variant="display" accessibilityRole="header">
            {word.headword}
          </Text>
          {word.reading || hsk ? (
            <View className="flex-row flex-wrap items-center gap-sm">
              {word.reading ? (
                <Text variant="heading" tone="muted">
                  {word.reading}
                </Text>
              ) : null}
              {/* #80: уровень HSK в карточке слова — решение владельца от 2026-09-25. */}
              {hsk ? (
                <View accessible accessibilityLabel={t("dictionary.article.hskA11y", { level: hsk })}>
                  <Chip size="micro" label={t("dictionary.article.hsk", { level: hsk })} />
                </View>
              ) : null}
            </View>
          ) : null}
          {line ? (
            <Text variant="body" className="pt-xs">
              {t(`dictionary.article.translation.${line.kind}`, { translation: line.text })}
            </Text>
          ) : null}
        </View>
        <IconButton icon="close" accessibilityLabel={t("dictionary.article.close")} onPress={onClose} />
      </View>

      {mode === "folders" ? (
        <FolderPicker word={word} onDone={() => setMode("article")} />
      ) : loadingEntry ? (
        <Text variant="body" tone="muted">
          {t("dictionary.article.loading")}
        </Text>
      ) : (
        <>
          {article.data && article.data.composition.length > 0 ? (
            <WordComposition
              chars={article.data.composition}
              onOpen={(c) => onOpen({ headword: c.char, reading: c.entry_reading ?? c.reading })}
            />
          ) : null}
          {/* Одно слово — одна память: прогресс виден, где бы слово ни открыли (#70). */}
          {wordItems.length > 0 ? <WordProgressBlock word={word} /> : null}
          <View className="gap-sm">
            {savedFolderNames.length > 0 ? (
              <Text variant="body" tone="brand">
                {t("dictionary.article.savedIn", { folders: savedFolderNames.join(", ") })}
              </Text>
            ) : null}
            <Button
              ref={actionRef}
              label={t(savedFolderNames.length > 0 ? "dictionary.article.changeFolders" : "dictionary.article.save")}
              variant={savedFolderNames.length > 0 ? "secondary" : "primary"}
              onPress={() => setMode("folders")}
            />
            {inCurrent && currentFolder ? (
              <Button
                label={t("learn.word.removeFromFolder", { folder: currentFolder.name })}
                variant="ghost"
                accessibilityHint={t("learn.word.removeHint")}
                loading={remove.isPending}
                onPress={() => void removeFromCurrent()}
              />
            ) : null}
            {removeError ? <FeedbackBanner tone="encouraging" message={t("dictionary.picker.error")} /> : null}
          </View>
          {word.entry ? (
            <EntryArticle entry={word.entry} />
          ) : (
            <Text variant="body" tone="muted">
              {t(word.translation ? "dictionary.article.noEntry" : "dictionary.article.missing")}
            </Text>
          )}
          {article.data?.char_words ? (
            <CharGraph
              char={word.headword}
              words={article.data.char_words}
              onOpen={(w) => onOpen({ headword: w.headword, reading: w.reading })}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

/** «← Назад к 电脑»: шаг назад по стеку статей (#79). Escape делает то же. */
function BackLink({ to, onPress, ref }: { to: string; onPress: () => void; ref?: RefObject<View | null> }) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={t("dictionary.article.backA11y", { word: to })}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      className={`min-h-tap flex-row items-center gap-xs self-start rounded-md pr-sm ${
        pressed ? "opacity-70" : ""
      } ${FOCUS_RING_CLASS}`}
    >
      <Icon name="arrowLeft" size={18} color={colors.primary} />
      <Text variant="body" tone="brand">
        {t("dictionary.article.back")}
      </Text>
      <HanziText variant="inline" tone="brand">
        {to}
      </HanziText>
    </Pressable>
  );
}

/**
 * Галочки по папкам: поставленная кладёт слово в папку сразу, снятая —
 * убирает. Кнопки «сохранить» нет: каждое нажатие уже сохранено, «Готово»
 * только возвращает к статье.
 */
function FolderPicker({ word, onDone }: { word: SheetWord; onDone: () => void }) {
  const folders = useFolders();
  const items = useSavedItems();
  const add = useAddToFolder();
  const remove = useRemoveFromFolder();
  const create = useCreateFolder();

  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Папка, по которой запрос ещё в пути: её галочка не нажимается второй раз.
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);

  const key = wordKey(word.headword, word.reading);
  const wordItems = (items.data ?? []).filter((i) => wordKey(i.headword, i.reading) === key);
  // Значение едет вместе со словом (#36) вместе с источником: уже
  // сохранённое (из файла, от модели), иначе короткое значение статьи — на
  // случай, если статью потом удалят.
  const saveInput = word.translation
    ? {
        headword: word.headword,
        reading: word.reading,
        entryId: word.entry?.id ?? null,
        translation: word.translation,
        translationSource: word.translationSource ?? null,
      }
    : {
        headword: word.headword,
        reading: word.reading,
        entryId: word.entry?.id ?? null,
        translation: word.entry ? shortMeaning(word.entry) : null,
        translationSource: word.entry ? ("dictionary" as const) : null,
      };

  async function toggle(folder: UserDictionaryFolder) {
    if (busyFolderId) return;
    const existing = wordItems.find((i) => i.folder_id === folder.id);
    setBusyFolderId(folder.id);
    setError(null);
    try {
      if (existing) await remove.mutateAsync(existing.id);
      else await add.mutateAsync({ folderId: folder.id, word: saveInput });
    } catch {
      setError(t("dictionary.picker.error"));
    } finally {
      setBusyFolderId(null);
    }
  }

  async function createAndAdd() {
    if (!FolderNameSchema.safeParse(newName).success || create.isPending) return;
    setError(null);
    try {
      const folder = await create.mutateAsync(newName.trim());
      await add.mutateAsync({ folderId: folder.id, word: saveInput });
      setNewName("");
    } catch (e) {
      setError(
        e instanceof BackendError && e.code === "folder_name_taken"
          ? t("dictionary.folderName.taken")
          : t("dictionary.picker.error"),
      );
    }
  }

  // Первое сохранение у нового пользователя: папок ещё нет, и выбирать не из
  // чего. Тогда лист — это одно поле названия и одна кнопка, которая и
  // создаёт папку, и кладёт в неё слово (dictionary.review.md B3).
  const firstFolder = folders.data?.length === 0;

  // Фокус (review n1): на входе — в первую галочку или, если папок нет, в
  // поле названия; после первой папки кнопка «Создать и положить» исчезает —
  // фокус на «Готово».
  const firstCheckRef = useRef<View>(null);
  const nameRef = useRef<TextInput>(null);
  const doneRef = useRef<View>(null);
  const focusedOnEntry = useRef(false);
  const wasFirstFolder = useRef(false);
  useEffect(() => {
    if (folders.data === undefined) return;
    if (!focusedOnEntry.current) {
      focusedOnEntry.current = true;
      if (firstFolder) nameRef.current?.focus();
      else returnFocusTo(firstCheckRef);
    } else if (wasFirstFolder.current && !firstFolder) {
      returnFocusTo(doneRef);
    }
    wasFirstFolder.current = firstFolder;
  }, [folders.data, firstFolder]);

  return (
    <View className="gap-lg">
      <View className="gap-xs">
        <Text variant="heading" accessibilityRole="header">
          {t(firstFolder ? "dictionary.picker.firstTitle" : "dictionary.picker.title", {
            word: word.headword,
          })}
        </Text>
        <Text variant="body" tone="muted">
          {t(firstFolder ? "dictionary.picker.firstHint" : "dictionary.picker.hint")}
        </Text>
      </View>

      {folders.isError && !folders.data ? (
        <FeedbackBanner message={t("dictionary.mine.error")} />
      ) : folders.isPending ? (
        <Text variant="body" tone="muted">
          {t("dictionary.mine.loading")}
        </Text>
      ) : firstFolder ? null : (
        // Пустой список не рисуется вовсе: пустой View всё равно занимал бы
        // свой отступ, и над полем выходил двойной (review n2).
        <View className="gap-xs">
          {folders.data.map((folder, index) => (
            <CheckRow
              key={folder.id}
              ref={index === 0 ? firstCheckRef : undefined}
              accessibilityLabel={t("dictionary.picker.checkA11y", { name: folder.name })}
              checked={wordItems.some((i) => i.folder_id === folder.id)}
              busy={busyFolderId === folder.id}
              onToggle={() => void toggle(folder)}
              className="flex-row items-center gap-md rounded-md px-sm"
            >
              <CheckMark checked={wordItems.some((i) => i.folder_id === folder.id)} />
              <Text variant="body" className="flex-1">
                {folder.name}
              </Text>
            </CheckRow>
          ))}
        </View>
      )}

      <View className="gap-sm">
        <Input
          ref={nameRef}
          value={newName}
          onChangeText={(next) => {
            setNewName(next);
            setError(null);
          }}
          placeholder={firstFolder ? t("dictionary.folderName.placeholder") : t("dictionary.picker.newFolder")}
          accessibilityLabel={t("dictionary.picker.newFolderLabel")}
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={() => void createAndAdd()}
        />
        {!firstFolder && newName.trim() !== "" ? (
          <Button
            label={t("dictionary.picker.create")}
            variant="secondary"
            loading={create.isPending}
            onPress={() => void createAndAdd()}
          />
        ) : null}
      </View>

      {error ? <FeedbackBanner message={error} /> : null}

      {firstFolder ? (
        <View className="gap-sm">
          <Button
            label={t("dictionary.picker.create")}
            variant="primary"
            disabled={!FolderNameSchema.safeParse(newName).success}
            loading={create.isPending}
            onPress={() => void createAndAdd()}
          />
          <Button label={t("dictionary.picker.cancel")} variant="ghost" onPress={onDone} />
        </View>
      ) : (
        <Button ref={doneRef} label={t("dictionary.picker.done")} variant="primary" onPress={onDone} />
      )}
    </View>
  );
}
