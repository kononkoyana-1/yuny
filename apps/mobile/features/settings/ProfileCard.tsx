import { useRef, useState, type RefObject } from "react";
import { View, type TextInput } from "react-native";
import {
  Button,
  Chip,
  ErrorState,
  FeedbackBanner,
  Input,
  LoadingState,
  Monogram,
  SettingsGroup,
  Sheet,
  Text,
} from "@/shared/ui";
import { useAccountEmail, useProfile, useUpdateProfile } from "@/shared/api";
import { t } from "@/shared/i18n";

export const NAME_MAX = 40;

/** Проверка имени из листа «Как вас называть?» (settings.design.md §3.3). */
export function nameError(value: string): "empty" | "long" | null {
  const trimmed = value.trim();
  if (!trimmed) return "empty";
  if (trimmed.length > NAME_MAX) return "long";
  return null;
}

/** Группа «Профиль»: аватар, имя, почта и «Изменить имя». */
export function ProfileCard({ isWide }: { isWide: boolean }) {
  const profile = useProfile();
  const email = useAccountEmail();
  const editRef = useRef<View>(null);
  const [editing, setEditing] = useState(false);

  return (
    <>
    <SettingsGroup title={t("settings.profile.title")}>
      {profile.isPending ? (
        <View className="flex-row items-center gap-md p-md">
          <Monogram name="" />
          <LoadingState message={t("settings.profile.loading")} className="flex-1 items-start" />
        </View>
      ) : profile.isError || !profile.data ? (
        <ErrorState
          title={t("settings.profile.error")}
          detail={t("settings.common.errorDetail")}
          onRetry={() => void profile.refetch()}
          retryLabel={t("settings.common.retry")}
          className="p-md"
        />
      ) : (
        <View className={`gap-md p-md ${isWide ? "flex-row items-center" : "flex-row items-start"}`}>
          <Monogram name={profile.data.display_name} />
          <View className="flex-1 gap-xs">
            <Text variant="title" numberOfLines={2}>
              {profile.data.display_name}
            </Text>
            {email.data ? (
              <Text
                variant="body"
                tone="muted"
                numberOfLines={1}
                ellipsizeMode="middle"
                accessibilityLabel={t("settings.profile.emailA11y", { email: email.data })}
              >
                {email.data}
              </Text>
            ) : null}
            {isWide ? null : (
              <View className="mt-xs flex-row">
                <Chip
                  ref={editRef}
                  label={t("settings.profile.edit")}
                  accessibilityLabel={t("settings.profile.editA11y", { name: profile.data.display_name })}
                  onPress={() => setEditing(true)}
                />
              </View>
            )}
          </View>
          {isWide ? (
            <Button
              ref={editRef}
              label={t("settings.profile.edit")}
              variant="ghost"
              accessibilityLabel={t("settings.profile.editA11y", { name: profile.data.display_name })}
              onPress={() => setEditing(true)}
            />
          ) : null}
        </View>
      )}
    </SettingsGroup>

    {/* Вне группы: между детьми группы стоят разделители. */}
    {profile.data ? (
      <NameSheet
        visible={editing}
        current={profile.data.display_name}
        returnFocusRef={editRef}
        onClose={() => setEditing(false)}
      />
    ) : null}
    </>
  );
}

function NameSheet({
  visible,
  current,
  returnFocusRef,
  onClose,
}: {
  visible: boolean;
  current: string;
  returnFocusRef: RefObject<View | null>;
  onClose: () => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const update = useUpdateProfile();
  const [value, setValue] = useState(current);
  const [touched, setTouched] = useState(false);
  // Лист открывают заново — поле снова с текущим именем.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setValue(current);
      setTouched(false);
      update.reset();
    }
  }

  const error = nameError(value);
  const unchanged = value.trim() === current.trim();
  const canSave = !error && !unchanged && !update.isPending;

  function save() {
    setTouched(true);
    if (!canSave) return;
    update.mutate({ display_name: value.trim() }, { onSuccess: onClose });
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={t("settings.name.title")}
      initialFocusRef={inputRef}
      returnFocusRef={returnFocusRef}
    >
      <View className="gap-lg">
        <Text variant="title">{t("settings.name.title")}</Text>
        <View className="gap-xs">
          <Input
            ref={inputRef}
            value={value}
            onChangeText={setValue}
            onBlur={() => setTouched(true)}
            onSubmitEditing={save}
            maxLength={Math.max(NAME_MAX, current.length)}
            accessibilityLabel={t("settings.name.label")}
            selectTextOnFocus
          />
          <View className="flex-row justify-between gap-sm">
            <Text variant="caption" tone="default" accessibilityLiveRegion="polite">
              {touched && error ? t(error === "empty" ? "settings.name.errorEmpty" : "settings.name.errorLong") : ""}
            </Text>
            <Text variant="caption" tone="muted">
              {t("settings.name.counter", { count: value.trim().length })}
            </Text>
          </View>
        </View>
        <Button
          label={t("settings.name.save")}
          loading={update.isPending}
          disabled={!canSave}
          onPress={save}
        />
        <Button label={t("settings.name.cancel")} variant="ghost" onPress={onClose} />
        {update.isError ? <FeedbackBanner tone="encouraging" message={t("settings.name.saveError")} /> : null}
      </View>
    </Sheet>
  );
}

