import { useRef, useState } from "react";
import { View, type TextInput } from "react-native";
import { Button, FeedbackBanner, Input, SettingsGroup, SettingsRow, Sheet, Text } from "@/shared/ui";
import { useDeleteAccount } from "@/shared/api";
import { signOut } from "@/shared/lib/auth";
import { t } from "@/shared/i18n";

/** Совпало ли слово подтверждения удаления (settings.design.md §3.7). */
export function deleteConfirmed(value: string): boolean {
  return value.trim().toLocaleLowerCase("ru") === t("settings.delete.confirmWord");
}

/**
 * Группа «Аккаунт»: выход без подтверждения и удаление с подтверждением
 * словом. Экран входа показывает гейт в `app/_layout.tsx`, когда сессии нет.
 */
export function AccountSettings() {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteRowRef = useRef<View>(null);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutFailed(false);
    try {
      await signOut();
    } catch {
      setSignOutFailed(true);
      setSigningOut(false);
    }
  }

  return (
    <>
      <SettingsGroup
        title={t("settings.account.title")}
        footer={signOutFailed ? t("settings.signOutFailed") : undefined}
      >
        <SettingsRow
          role="button"
          leadingIcon="signOut"
          title={t("settings.account.signOut")}
          pending={signingOut}
          onPress={() => void handleSignOut()}
        />
        <SettingsRow
          ref={deleteRowRef}
          role="button"
          leadingIcon="trash"
          tone="destructive"
          title={t("settings.account.delete")}
          accessibilityHint={t("settings.account.deleteHint")}
          onPress={() => setDeleting(true)}
        />
      </SettingsGroup>

      <DeleteSheet visible={deleting} returnFocusRef={deleteRowRef} onClose={() => setDeleting(false)} />
    </>
  );
}

function DeleteSheet({
  visible,
  returnFocusRef,
  onClose,
}: {
  visible: boolean;
  returnFocusRef: React.RefObject<View | null>;
  onClose: () => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const remove = useDeleteAccount();
  const [value, setValue] = useState("");
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setValue("");
      remove.reset();
    }
  }

  const confirmed = deleteConfirmed(value);

  function confirm() {
    if (!confirmed || remove.isPending) return;
    // Успех: сессия уходит, гейт показывает экран входа — лист закрывать не нужно.
    remove.mutate();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      dismissible={!remove.isPending}
      accessibilityLabel={t("settings.delete.title")}
      initialFocusRef={inputRef}
      returnFocusRef={returnFocusRef}
    >
      <View className="gap-lg">
        <Text variant="title">{t("settings.delete.title")}</Text>
        <View className="gap-xs">
          <Text variant="body">{t("settings.delete.lead")}</Text>
          {(["itemProfile", "itemFolders", "itemProgress", "itemFiles"] as const).map((key) => (
            <Text key={key} variant="body">
              {`• ${t(`settings.delete.${key}`)}`}
            </Text>
          ))}
        </View>
        <View className="rounded-md bg-destructive-soft p-md dark:bg-destructive-soft-dark">
          <Text variant="body" tone="destructive" className="font-semibold">
            {t("settings.delete.irreversible")}
          </Text>
        </View>
        <View className="gap-xs">
          <Text variant="caption" tone="muted" nativeID="settings-delete-label">
            {t("settings.delete.confirmLabel")}
          </Text>
          <Input
            ref={inputRef}
            value={value}
            onChangeText={setValue}
            onSubmitEditing={confirm}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!remove.isPending}
            accessibilityLabel={t("settings.delete.confirmLabel")}
          />
        </View>
        <Button
          label={t("settings.delete.confirm")}
          variant="destructive"
          loading={remove.isPending}
          disabled={!confirmed}
          accessibilityHint={confirmed ? undefined : t("settings.delete.confirmHint")}
          onPress={confirm}
        />
        <Button
          label={t("settings.delete.cancel")}
          variant="ghost"
          disabled={remove.isPending}
          onPress={onClose}
        />
        {remove.isError ? <FeedbackBanner tone="encouraging" message={t("settings.delete.error")} /> : null}
      </View>
    </Sheet>
  );
}
