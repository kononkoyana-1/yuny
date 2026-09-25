import { useEffect, useRef, useState, type RefObject } from "react";
import { FlatList, Pressable, ScrollView, View, type TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FolderNameSchema, type WordsExtractResult } from "@yuny/shared";
import { Button, FeedbackBanner, Input, Mascot, Sheet, Text } from "@/shared/ui";
import { useCreateFolder, useFolders, useSaveWords, useSavedItems } from "@/shared/api";
import { BackendError } from "@/shared/lib/backendError";
import { spacing } from "@/shared/config/tokens";
import { t } from "@/shared/i18n";
import { returnFocusTo } from "@/shared/platform/sheetA11y";
import { CheckMark, CheckRow } from "@/features/dictionary/CheckMark";
import { folderCounts } from "@/features/dictionary/saved";
import { useRowRefs } from "@/features/dictionary/useRowRefs";
import { QueueHint } from "@/features/study/QueueHint";
import type { SaveWordInput } from "@/shared/repositories";
import { applyEdits, cleanTranslation, savedSource, type ReviewWord } from "./edits";

interface SavedOutcome {
  folderId: string;
  folderName: string;
  added: number;
  total: number;
}

/**
 * Итог разбора файла (редакция 2026-09-23): слова с переводами, все отмечены.
 * Снятая галочка убирает слово из сохранения; «Изменить» открывает лист, где
 * перевод можно поправить руками — такой перевод сохраняется как «Ваш
 * перевод» (решение владельца, 2026-09-23).
 * «Сохранить» открывает лист: новая папка с названием, которое предложил
 * разбор, или одна из тех, что уже есть. После сохранения — итог и переход в
 * папку.
 */
export function WordsReview({ result, onDone }: { result: WordsExtractResult; onDone: () => void }) {
  const [unchecked, setUnchecked] = useState<Set<string>>(() => new Set());
  const [choosing, setChoosing] = useState(false);
  const [saved, setSaved] = useState<SavedOutcome | null>(null);
  const [edits, setEdits] = useState<Map<string, string>>(() => new Map());
  const [editing, setEditing] = useState<ReviewWord | null>(null);
  const [focusWord, setFocusWord] = useState<string | null>(null);
  const editRefFor = useRowRefs();
  const saveRef = useRef<View>(null);
  const insets = useSafeAreaInsets();

  const words = applyEdits(result.words, edits);
  const chosen = words.filter((w) => !unchecked.has(w.word));

  if (saved) return <SavedScreen outcome={saved} onDone={onDone} />;

  function toggle(word: string) {
    setUnchecked((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  const allChecked = unchecked.size === 0;

  return (
    <View className="flex-1 bg-background dark:bg-background-dark" style={{ paddingTop: insets.top }}>
      <FlatList
        data={words}
        keyExtractor={(w) => w.word}
        contentContainerClassName="px-lg pb-lg"
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View className="gap-xs pb-sm pt-xl">
            <Text variant="title" accessibilityRole="header">
              {t("upload.words.title", { count: result.words.length })}
            </Text>
            {/* Название файла — будущее имя папки, не часть подсказки (review m4). */}
            <Text variant="heading">{result.title}</Text>
            <Text variant="body" tone="muted">
              {t("upload.words.hint")}
            </Text>
            <View className="flex-row">
              <Button
                label={t(allChecked ? "upload.words.selectNone" : "upload.words.selectAll")}
                variant="ghost"
                // Без своего отступа: текст на одной линии со строками (review m3).
                // Стилем, не классом: `px-0` проигрывает `px-lg` самой кнопки
                // по порядку правил в CSS.
                style={{ paddingHorizontal: 0 }}
                onPress={() =>
                  setUnchecked(allChecked ? new Set(result.words.map((w) => w.word)) : new Set())
                }
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <WordRow
            word={item}
            checked={!unchecked.has(item.word)}
            onPress={() => toggle(item.word)}
            editRef={editRefFor(item.word)}
            onEdit={() => {
              setFocusWord(item.word);
              setEditing(item);
            }}
          />
        )}
      />

      <View className="gap-sm bg-background px-lg pb-md pt-sm dark:bg-background-dark">
        <Button
          ref={saveRef}
          label={t("upload.words.save", { count: chosen.length })}
          variant="primary"
          disabled={chosen.length === 0}
          onPress={() => setChoosing(true)}
        />
        <Button label={t("upload.words.another")} variant="ghost" onPress={onDone} />
      </View>

      <EditTranslationSheet
        word={editing}
        original={result.words.find((w) => w.word === editing?.word)?.translation ?? null}
        onClose={() => setEditing(null)}
        onSave={(word, translation) => {
          setEdits((prev) => new Map(prev).set(word, translation));
          setEditing(null);
        }}
        onRevert={(word) => {
          setEdits((prev) => {
            const next = new Map(prev);
            next.delete(word);
            return next;
          });
          setEditing(null);
        }}
        returnFocusRef={focusWord !== null ? editRefFor(focusWord) : undefined}
      />

      <Sheet
        visible={choosing}
        onClose={() => setChoosing(false)}
        accessibilityLabel={t("upload.words.where.title", { count: chosen.length })}
        returnFocusRef={saveRef}
      >
        {choosing ? (
          <WhereToSave
            title={result.title}
            words={chosen}
            onCancel={() => setChoosing(false)}
            onSaved={(outcome) => {
              setChoosing(false);
              setSaved(outcome);
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

/**
 * Подпись источника. Слово без статьи БКРС помечено «нет в словаре», откуда
 * бы ни был перевод — из файла или от модели (upload-words.review.md B1).
 * Поправленный руками перевод — «Ваш перевод».
 */
function sourceLabel(word: ReviewWord): string {
  if (word.edited) return t("upload.words.source.user");
  if (word.source === "file" && word.entry_id === null) return t("upload.words.source.fileNoEntry");
  return t(`upload.words.source.${word.source}`);
}

function WordRow({
  word,
  checked,
  onPress,
  onEdit,
  editRef,
}: {
  word: ReviewWord;
  checked: boolean;
  onPress: () => void;
  onEdit: () => void;
  editRef: RefObject<View | null>;
}) {
  const source = sourceLabel(word);
  // Без чтения — без пустого места в подписи: «слово, , перевод» (review m6).
  const label = [word.word, word.reading, word.translation].filter(Boolean).join(", ") + `. ${source}`;
  return (
    // Галочка и «Изменить» — два отдельных элемента в одной строке: кнопка
    // внутри `checkbox` — недопустимое дерево для скринридера.
    <View className="flex-row items-start rounded-md bg-surface dark:bg-surface-dark">
      <CheckRow
        checked={checked}
        onToggle={onPress}
        accessibilityLabel={label}
        className="flex-1 flex-row items-start gap-md py-sm pl-md"
      >
        <View className="pt-xs">
          <CheckMark checked={checked} />
        </View>
        <View className={`flex-1 gap-xs ${checked ? "" : "opacity-50"}`}>
          <View className="flex-row flex-wrap items-baseline gap-x-sm">
            <Text variant="title">{word.word}</Text>
            {word.reading ? (
              <Text variant="body" tone="muted">
                {word.reading}
              </Text>
            ) : null}
          </View>
          <Text variant="body">{word.translation}</Text>
          <Text variant="caption" tone={!word.edited && word.entry_id === null ? "brand" : "muted"}>
            {source}
          </Text>
        </View>
      </CheckRow>
      <Pressable
        ref={editRef}
        accessibilityRole="button"
        accessibilityLabel={t("upload.words.edit.a11y", { word: word.word })}
        onPress={onEdit}
        className="min-h-tap min-w-tap justify-center px-md py-sm"
      >
        <Text variant="caption" tone="brand" className="font-semibold">
          {t("upload.words.edit.action")}
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Лист правки перевода одного слова: поле с текущим переводом, «Сохранить»,
 * «Вернуть исходный» — если перевод уже правили — и «Отмена».
 */
function EditTranslationSheet({
  word,
  original,
  onClose,
  onSave,
  onRevert,
  returnFocusRef,
}: {
  word: ReviewWord | null;
  original: string | null;
  onClose: () => void;
  onSave: (word: string, translation: string) => void;
  onRevert: (word: string) => void;
  returnFocusRef?: RefObject<View | null>;
}) {
  const inputRef = useRef<TextInput>(null);
  return (
    <Sheet
      visible={word !== null}
      onClose={onClose}
      accessibilityLabel={word ? t("upload.words.edit.title", { word: word.word }) : ""}
      returnFocusRef={returnFocusRef}
      initialFocusRef={inputRef}
    >
      {/* `key` — новое поле на каждое слово, а не остатки ввода от прошлого. */}
      {word ? (
        <EditTranslationForm
          key={word.word}
          word={word}
          original={original}
          inputRef={inputRef}
          onClose={onClose}
          onSave={onSave}
          onRevert={onRevert}
        />
      ) : null}
    </Sheet>
  );
}

function EditTranslationForm({
  word,
  original,
  inputRef,
  onClose,
  onSave,
  onRevert,
}: {
  word: ReviewWord;
  original: string | null;
  inputRef: RefObject<TextInput | null>;
  onClose: () => void;
  onSave: (word: string, translation: string) => void;
  onRevert: (word: string) => void;
}) {
  const [text, setText] = useState(word.translation);
  const clean = cleanTranslation(text);

  function save() {
    if (clean) onSave(word.word, clean);
  }

  return (
    <View className="gap-lg">
      <View className="gap-xs">
        <Text variant="heading" accessibilityRole="header">
          {t("upload.words.edit.title", { word: word.word })}
        </Text>
        {word.reading ? (
          <Text variant="body" tone="muted">
            {word.reading}
          </Text>
        ) : null}
      </View>
      <Input
        ref={inputRef}
        value={text}
        onChangeText={setText}
        accessibilityLabel={t("upload.words.edit.label")}
        placeholder={t("upload.words.edit.placeholder")}
        maxLength={300}
        returnKeyType="done"
        onSubmitEditing={save}
      />
      <View className="gap-sm">
        <Button
          label={t("upload.words.edit.save")}
          variant="primary"
          disabled={clean === null}
          onPress={save}
        />
        {word.edited && original ? (
          <Button
            label={t("upload.words.edit.revert", { translation: original })}
            variant="secondary"
            onPress={() => onRevert(word.word)}
          />
        ) : null}
        <Button label={t("upload.words.edit.cancel")} variant="ghost" onPress={onClose} />
      </View>
    </View>
  );
}

function toSaveInput(word: ReviewWord): SaveWordInput {
  return {
    headword: word.word,
    reading: word.reading,
    entryId: word.entry_id,
    // Значение едет вместе со словом всегда (#36), в том числе предложенное
    // словарём: если статью удалят при перезаливке, слово не останется пустым.
    // Источник — чтобы статья подписала его честно; поправленное — `user`.
    translation: word.translation,
    translationSource: savedSource(word),
  };
}

function WhereToSave({
  title,
  words,
  onCancel,
  onSaved,
}: {
  title: string;
  words: ReviewWord[];
  onCancel: () => void;
  onSaved: (outcome: SavedOutcome) => void;
}) {
  const folders = useFolders();
  const items = useSavedItems();
  const create = useCreateFolder();
  const save = useSaveWords();
  const [name, setName] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);

  const counts = folderCounts(items.data ?? []);
  const inputs = words.map(toSaveInput);
  const busy = create.isPending || save.isPending;

  async function saveInto(folderId: string, folderName: string) {
    const added = await save.mutateAsync({ folderId, words: inputs });
    onSaved({ folderId, folderName, added, total: inputs.length });
  }

  async function createAndSave() {
    if (busy || !FolderNameSchema.safeParse(name).success) return;
    setError(null);
    try {
      const folder = await create.mutateAsync(name.trim());
      await saveInto(folder.id, folder.name);
    } catch (e) {
      setError(
        e instanceof BackendError && e.code === "folder_name_taken"
          ? t("dictionary.folderName.taken")
          : t("upload.words.where.error"),
      );
    }
  }

  async function saveExisting(folderId: string, folderName: string) {
    if (busy) return;
    setError(null);
    setBusyFolderId(folderId);
    try {
      await saveInto(folderId, folderName);
    } catch {
      setError(t("upload.words.where.error"));
    } finally {
      setBusyFolderId(null);
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-lg">
      <Text variant="heading" accessibilityRole="header">
        {t("upload.words.where.title", { count: words.length })}
      </Text>

      <View className="gap-sm">
        <Text variant="body" className="font-semibold">
          {t("upload.words.where.newFolder")}
        </Text>
        <Input
          value={name}
          onChangeText={(next) => {
            setName(next);
            setError(null);
          }}
          accessibilityLabel={t("upload.words.where.nameLabel")}
          placeholder={t("dictionary.folderName.placeholder")}
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={() => void createAndSave()}
        />
        <Button
          label={t("upload.words.where.create")}
          variant="primary"
          disabled={!FolderNameSchema.safeParse(name).success || (busy && busyFolderId !== null)}
          loading={create.isPending || (save.isPending && busyFolderId === null)}
          onPress={() => void createAndSave()}
        />
      </View>

      {error ? <FeedbackBanner message={error} /> : null}

      {/* Папки ещё грузятся или не загрузились — сказать об этом, а не молчать (review m5). */}
      {folders.isPending ? (
        <Text variant="body" tone="muted">
          {t("dictionary.mine.loading")}
        </Text>
      ) : folders.isError && !folders.data ? (
        <FeedbackBanner message={t("dictionary.mine.error")} />
      ) : null}

      {folders.data && folders.data.length > 0 ? (
        <View className="gap-sm">
          <Text variant="body" className="font-semibold">
            {t("upload.words.where.existing")}
          </Text>
          {folders.data.map((folder) => {
            const wordsLabel = t("dictionary.mine.words", { count: counts.get(folder.id) ?? 0 });
            return (
              <Pressable
                key={folder.id}
                accessibilityRole="button"
                accessibilityLabel={t("upload.words.where.folderA11y", { name: folder.name, words: wordsLabel })}
                accessibilityState={{ busy: busyFolderId === folder.id, disabled: busy }}
                disabled={busy}
                onPress={() => void saveExisting(folder.id, folder.name)}
                className={`min-h-tap flex-row items-center gap-md rounded-md border border-border px-md py-md dark:border-border-dark ${
                  busyFolderId === folder.id ? "opacity-50" : ""
                }`}
              >
                <Text variant="body" className="flex-1 font-semibold" numberOfLines={1}>
                  {folder.name}
                </Text>
                <Text variant="caption" tone="muted">
                  {wordsLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Button label={t("upload.words.where.cancel")} variant="ghost" onPress={onCancel} />
    </ScrollView>
  );
}

function SavedScreen({ outcome, onDone }: { outcome: SavedOutcome; onDone: () => void }) {
  const router = useRouter();
  const skipped = outcome.total - outcome.added;
  const openRef = useRef<View>(null);

  // Лист «Куда сохранить» закрылся вместе с кнопкой, на которой был фокус:
  // ставим его на главное действие итога, а сам итог объявляется живой
  // областью (review m1).
  useEffect(() => {
    const id = setTimeout(() => returnFocusTo(openRef), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <View className="flex-1 items-center justify-center gap-lg bg-background px-lg dark:bg-background-dark">
      <Mascot decorative stage={1} mood="celebrating" size="medium" showStage={false} />
      <View className="items-center gap-xs" accessibilityLiveRegion="polite" aria-live="polite">
        <Text variant="title" className="text-center" accessibilityRole="header">
          {outcome.added > 0
            ? t("upload.words.saved.title", { count: outcome.added, folder: outcome.folderName })
            : t("upload.words.saved.none", { folder: outcome.folderName })}
        </Text>
        {outcome.added > 0 && skipped > 0 ? (
          <Text variant="body" tone="muted" className="text-center">
            {t("upload.words.saved.skipped", { count: skipped })}
          </Text>
        ) : null}
      </View>
      {outcome.added > 0 ? (
        <QueueHint
          folderId={outcome.folderId}
          added={outcome.added}
          onStart={() => {
            onDone();
            router.push({ pathname: "/study", params: { folder: outcome.folderId, mode: "new" } });
          }}
        />
      ) : null}
      <View className="w-full gap-sm">
        <Button
          ref={openRef}
          label={t("upload.words.saved.open")}
          variant="primary"
          onPress={() => {
            onDone();
            router.push({ pathname: "/folder/[id]", params: { id: outcome.folderId } });
          }}
        />
        <Button label={t("upload.words.saved.more")} variant="ghost" onPress={onDone} />
      </View>
    </View>
  );
}
