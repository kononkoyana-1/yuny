import { useState, type RefObject } from "react";
import { View } from "react-native";
import { FolderNameSchema } from "@yuny/shared";
import { Button, FeedbackBanner, Input, Sheet, Text } from "@/shared/ui";
import { BackendError } from "@/shared/lib/backendError";
import { t } from "@/shared/i18n";

export interface FolderNameSheetProps {
  visible: boolean;
  mode: "create" | "rename";
  /** Название, с которого начинается поле: пустое для новой папки, текущее — для переименования. */
  initialName?: string;
  onClose: () => void;
  /** Сохраняет название. Ошибку показывает этот лист, закрывает его вызывающий — на успехе. */
  onSubmit: (name: string) => Promise<unknown>;
  returnFocusRef?: RefObject<View | null>;
}

const MAX_NAME = 60;

function errorCopy(error: unknown): string {
  if (error instanceof BackendError && error.code === "folder_name_taken") {
    return t("dictionary.folderName.taken");
  }
  return t("dictionary.folderName.error");
}

/**
 * Лист с одним полем — названием папки. Один и тот же для создания и
 * переименования (#38): отличаются заголовок и подпись кнопки.
 */
export function FolderNameSheet({
  visible,
  mode,
  initialName = "",
  onClose,
  onSubmit,
  returnFocusRef,
}: FolderNameSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={t(`dictionary.folderName.${mode}Title`)}
      returnFocusRef={returnFocusRef}
    >
      {/* Форма пересоздаётся на каждое открытие: поле и ошибка не переживают закрытия листа. */}
      {visible ? (
        <FolderNameForm mode={mode} initialName={initialName} onClose={onClose} onSubmit={onSubmit} />
      ) : null}
    </Sheet>
  );
}

function FolderNameForm({
  mode,
  initialName,
  onClose,
  onSubmit,
}: Pick<FolderNameSheetProps, "mode" | "onClose" | "onSubmit"> & { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const valid = FolderNameSchema.safeParse(name).success;
  const unchanged = mode === "rename" && name.trim() === initialName.trim();

  async function submit() {
    if (!valid || unchanged || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(name.trim());
    } catch (e) {
      setError(errorCopy(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="gap-lg">
      <Text variant="heading" accessibilityRole="header">
        {t(`dictionary.folderName.${mode}Title`)}
      </Text>
      <View className="gap-xs">
        <Input
          value={name}
          onChangeText={(next) => {
            setName(next);
            setError(null);
          }}
          placeholder={t("dictionary.folderName.placeholder")}
          accessibilityLabel={t("dictionary.folderName.label")}
          maxLength={MAX_NAME}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />
        {error ? <FeedbackBanner message={error} /> : null}
      </View>
      <View className="gap-sm">
        <Button
          label={t(`dictionary.folderName.${mode === "create" ? "create" : "save"}`)}
          variant="primary"
          disabled={!valid || unchanged}
          loading={saving}
          onPress={() => void submit()}
        />
        <Button label={t("dictionary.folderName.cancel")} variant="ghost" onPress={onClose} />
      </View>
    </View>
  );
}
