import { useState, type RefObject } from "react";
import { Pressable, View } from "react-native";
import { FolderNameSchema, type SavedEntry, type UserDictionaryFolder } from "@yuny/shared";
import { Button, FeedbackBanner, IconButton, Input, Sheet, Text } from "@/shared/ui";
import {
  useAddToFolder,
  useCreateFolder,
  useFolders,
  useRemoveFromFolder,
  useSavedItems,
} from "@/shared/api";
import { BackendError } from "@/shared/lib/backendError";
import { t } from "@/shared/i18n";
import { EntryArticle } from "./EntryArticle";
import { wordKey } from "./saved";

/** Слово, которое открыто в листе: из выдачи БКРС или из папки своего словаря. */
export interface SheetWord {
  headword: string;
  reading: string | null;
  /** `null` — у слова из папки, чья статья пропала после перезаливки словаря. */
  entry: SavedEntry | null;
}

export interface ArticleSheetProps {
  word: SheetWord | null;
  onClose: () => void;
  returnFocusRef?: RefObject<View | null>;
}

/**
 * Словарная статья в листе и кнопка «в мой словарь» с выбором папок
 * (TZ.md §11 экран 04, #37 и #38). Один компонент на экран словаря и экран
 * папки: и там и там из статьи можно разложить слово по папкам, а снятая
 * галочка убирает его из папки.
 */
export function ArticleSheet({ word, onClose, returnFocusRef }: ArticleSheetProps) {
  return (
    <Sheet
      visible={word !== null}
      onClose={onClose}
      accessibilityLabel={word?.headword ?? ""}
      returnFocusRef={returnFocusRef}
    >
      {/* `key` сбрасывает режим листа на статью, когда открывают другое слово. */}
      {word ? <ArticleSheetBody key={wordKey(word.headword, word.reading)} word={word} onClose={onClose} /> : null}
    </Sheet>
  );
}

function ArticleSheetBody({ word, onClose }: { word: SheetWord; onClose: () => void }) {
  const [mode, setMode] = useState<"article" | "folders">("article");
  const folders = useFolders();
  const items = useSavedItems();

  const key = wordKey(word.headword, word.reading);
  const wordItems = (items.data ?? []).filter((i) => wordKey(i.headword, i.reading) === key);
  const savedFolderNames = (folders.data ?? [])
    .filter((f) => wordItems.some((i) => i.folder_id === f.id))
    .map((f) => f.name);

  return (
    <View className="gap-lg">
      <View className="flex-row items-start gap-md">
        <View className="flex-1 gap-xs">
          <Text variant="display" accessibilityRole="header">
            {word.headword}
          </Text>
          {word.reading ? (
            <Text variant="heading" tone="muted">
              {word.reading}
            </Text>
          ) : null}
        </View>
        <IconButton icon="close" accessibilityLabel={t("dictionary.article.close")} onPress={onClose} />
      </View>

      {mode === "folders" ? (
        <FolderPicker word={word} onDone={() => setMode("article")} />
      ) : (
        <>
          <View className="gap-sm">
            {savedFolderNames.length > 0 ? (
              <Text variant="body" tone="brand">
                {t("dictionary.article.savedIn", { folders: savedFolderNames.join(", ") })}
              </Text>
            ) : null}
            <Button
              label={t(savedFolderNames.length > 0 ? "dictionary.article.changeFolders" : "dictionary.article.save")}
              variant={savedFolderNames.length > 0 ? "secondary" : "primary"}
              onPress={() => setMode("folders")}
            />
          </View>
          {word.entry ? (
            <EntryArticle entry={word.entry} />
          ) : (
            <Text variant="body" tone="muted">
              {t("dictionary.article.missing")}
            </Text>
          )}
        </>
      )}
    </View>
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
  const saveInput = { headword: word.headword, reading: word.reading, entryId: word.entry?.id ?? null };

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

  return (
    <View className="gap-lg">
      <View className="gap-xs">
        <Text variant="heading" accessibilityRole="header">
          {t("dictionary.picker.title", { word: word.headword })}
        </Text>
        <Text variant="body" tone="muted">
          {t("dictionary.picker.hint")}
        </Text>
      </View>

      {folders.isError && !folders.data ? (
        <FeedbackBanner message={t("dictionary.mine.error")} />
      ) : folders.isPending ? (
        <Text variant="body" tone="muted">
          {t("dictionary.mine.loading")}
        </Text>
      ) : (
        <View className="gap-xs">
          {folders.data.map((folder) => (
            <FolderCheckbox
              key={folder.id}
              name={folder.name}
              checked={wordItems.some((i) => i.folder_id === folder.id)}
              busy={busyFolderId === folder.id}
              onPress={() => void toggle(folder)}
            />
          ))}
        </View>
      )}

      <View className="gap-sm">
        <Input
          value={newName}
          onChangeText={(next) => {
            setNewName(next);
            setError(null);
          }}
          placeholder={t("dictionary.picker.newFolder")}
          accessibilityLabel={t("dictionary.picker.newFolder")}
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={() => void createAndAdd()}
        />
        {newName.trim() !== "" ? (
          <Button
            label={t("dictionary.picker.create")}
            variant="secondary"
            loading={create.isPending}
            onPress={() => void createAndAdd()}
          />
        ) : null}
      </View>

      {error ? <FeedbackBanner message={error} /> : null}

      <Button label={t("dictionary.picker.done")} variant="primary" onPress={onDone} />
    </View>
  );
}

function FolderCheckbox({
  name,
  checked,
  busy,
  onPress,
}: {
  name: string;
  checked: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={t("dictionary.picker.checkA11y", { name })}
      accessibilityState={{ checked, busy }}
      // react-native-web не переносит `accessibilityState.checked` в
      // `aria-checked` — без этого web-скринридер не слышит, стоит ли галочка.
      aria-checked={checked}
      aria-busy={busy}
      onPress={onPress}
      className={`min-h-[44px] flex-row items-center gap-md rounded-md px-sm ${busy ? "opacity-50" : ""}`}
    >
      <View
        className={`h-[22px] w-[22px] items-center justify-center rounded-sm border-2 ${
          checked
            ? "border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark"
            : "border-border dark:border-border-dark"
        }`}
        aria-hidden
      >
        {checked ? (
          <Text variant="caption" tone="inverse" className="font-bold">
            ✓
          </Text>
        ) : null}
      </View>
      <Text variant="body" className="flex-1">
        {name}
      </Text>
    </Pressable>
  );
}
