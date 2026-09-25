import { useState, type Ref } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "@/shared/lib/useTheme";
import { LinkRow } from "@/shared/platform/linkRow";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type SettingsRowTrailing = "chevron" | "external" | "none";
export type SettingsRowTone = "default" | "destructive";
export type SettingsRowRole = "button" | "link" | "text";

export interface SettingsRowProps {
  title: string;
  detail?: string;
  leadingIcon?: IconName;
  trailing?: SettingsRowTrailing;
  tone?: SettingsRowTone;
  role: SettingsRowRole;
  /** `role="link"` on web: a real `<a href target="_blank" rel="noopener noreferrer">` (S2). */
  href?: string | null;
  /** `role="button"` / `role="link"` without `href` (native): fires on press. */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Spinner at the trailing edge, `aria-busy`, and presses are ignored. */
  pending?: boolean;
  className?: string;
  /** Focus target, e.g. a sheet's `returnFocusRef` — lands on the tappable element itself. */
  ref?: Ref<View>;
}

const TRAILING_ICON: Partial<Record<SettingsRowTrailing, IconName>> = {
  chevron: "chevronRight",
  external: "externalLink",
};

/**
 * S2 (settings.design.md §9): one tappable or informational row — a data
 * source link, "Выйти", "Удалить аккаунт". `role="text"` renders a plain,
 * non-interactive row (settings.design.md §3.6: a source with no known URL
 * yet).
 */
export function SettingsRow({
  title,
  detail,
  leadingIcon,
  trailing = "none",
  tone = "default",
  role,
  href = null,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  pending = false,
  className = "",
  ref,
}: SettingsRowProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const interactive = role !== "text";

  const iconColor =
    tone === "destructive" ? colors.destructive : colors.textMuted;

  const content = (
    <View className="min-h-tap flex-row items-center gap-sm px-md py-sm">
      {leadingIcon ? <Icon name={leadingIcon} size={20} color={iconColor} /> : null}
      <View className="flex-1">
        <Text variant="body" tone={tone === "destructive" ? "destructive" : "default"} className="font-semibold">
          {title}
        </Text>
        {detail ? (
          <Text variant="caption" tone="muted">
            {detail}
          </Text>
        ) : null}
      </View>
      {pending ? (
        <ActivityIndicator color={colors.textMuted} />
      ) : trailing !== "none" ? (
        <Icon name={TRAILING_ICON[trailing]!} size={18} color={colors.textMuted} />
      ) : null}
    </View>
  );

  if (!interactive) {
    return (
      <View accessibilityRole="text" className={className}>
        {content}
      </View>
    );
  }

  const accessibilityRole = role === "link" ? "link" : "button";

  return (
    <LinkRow
      ref={ref}
      href={role === "link" ? href : null}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ busy: pending }}
      aria-busy={pending}
      disabled={pending}
      onPress={pending ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={`transition-colors duration-fast ${pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : ""} ${className}`}
    >
      {content}
    </LinkRow>
  );
}
