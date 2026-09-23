import { useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FolderNameSchema, type ExtractedWord, type WordsExtractResult } from "@yuny/shared";
import { Button, FeedbackBanner, Input, Mascot, Sheet, Text } from "@/shared/ui";
import { useCreateFolder, useFolders, useSaveWords, useSavedItems } from "@/shared/api";
import { BackendError } from "@/shared/lib/backendError";
import { spacing } from "@/shared/config/tokens";
import { t } from "@/shared/i18n";
import { CheckMark } from "@/features/dictionary/CheckMark";
import { folderCounts } from "@/features/dictionary/saved";
import type { SaveWordInput } from "@/shared/repositories";

interface SavedOutcome {
  folderId: string;
  folderName: string;
  added: number;
  total: number;
}

/**
 * Итог разбора файла (редакция 2026-09-23): слова с переводами, все отмечены.
 * Снятая галочка убирает слово из сохранения — править перевод здесь нельзя.
 * «Сохранить» открывает лист: новая папка с названием, которое предложил
 * разбор, или одна из тех, что уже есть. После сохранения — итог и переход в
 * папку.
 */
export function WordsReview({ result, onDone }: { result: WordsExtractResult; onDone: () => void }) {
  const [unchecked, setUnchecked] = useState<Set<string>>(() => new Set());
  const [choosing, setChoosing] = useState(false);
  const [saved, setSaved] = useState<SavedOutcome | null>(null);
  const saveRef = useRef<View>(null);
  const insets = useSafeAreaInsets();

  const chosen = result.words.filter((w) => !unchecked.has(w.word));

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
        data={result.words}
        keyExtractor={(w) => w.word}
        contentContainerClassName="px-lg pb-lg"
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View className="gap-xs pb-lg pt-xl">
            <Text variant="title" accessibilityRole="header">
              {t("upload.words.title", { count: result.words.length })}
            </Text>
            <Text variant="body" tone="muted">
              {result.title}
            </Text>
            <Text variant="body" tone="muted">
              {t("upload.words.hint")}
            </Text>
            <View className="flex-row">
              <Button
                label={t(allChecked ? "upload.words.selectNone" : "upload.words.selectAll")}
                variant="ghost"
                onPress={() =>
                  setUnchecked(allChecked ? new Set(result.words.map((w) => w.word)) : new Set())
                }
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <WordRow word={item} checked={!unchecked.has(item.word)} onPress={() => toggle(item.word)} />
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

function WordRow({ word, checked, onPress }: { word: ExtractedWord; checked: boolean; onPress: () => void }) {
  const source = t(`upload.words.source.${word.source}`);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={t("upload.words.checkA11y", {
        word: word.word,
        reading: word.reading ?? "",
        translation: word.translation,
        source,
      })}
      accessibilityState={{ checked }}
      // react-native-web не переносит `accessibilityState.checked` в `aria-checked`.
      aria-checked={checked}
      onPress={onPress}
      className="min-h-[44px] flex-row items-start gap-md rounded-md bg-surface px-md py-sm dark:bg-surface-dark"
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
        <Text variant="caption" tone={word.source === "ai" ? "brand" : "muted"}>
          {source}
        </Text>
      </View>
    </Pressable>
  );
}

function toSaveInput(word: ExtractedWord): SaveWordInput {
  return {
    headword: word.word,
    reading: word.reading,
    entryId: word.entry_id,
    // Значение едет вместе со словом всегда (#36), в том числе предложенное
    // словарём: если статью удалят при перезаливке, слово не останется пустым.
    translation: word.translation,
  };
}

function WhereToSave({
  title,
  words,
  onCancel,
  onSaved,
}: {
  title: string;
  words: ExtractedWord[];
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
                className={`min-h-[44px] flex-row items-center gap-md rounded-md border border-border px-md py-md dark:border-border-dark ${
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

  return (
    <View className="flex-1 items-center justify-center gap-lg bg-background px-lg dark:bg-background-dark">
      <Mascot decorative stage={1} mood="celebrating" size="medium" showStage={false} />
      <View className="items-center gap-xs">
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
      <View className="w-full gap-sm">
        <Button
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
