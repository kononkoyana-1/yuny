import { useState } from "react";
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
 *
 * `sizing.tapTarget` is a #65 token not yet in `tokens.ts`; `min-h-[44px]`
 * is §V-F's named exception, the one literal that replacement is allowed to
 * be.
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
}: SettingsRowProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const interactive = role !== "text";

  const titleToneClass =
    tone === "destructive" ? "text-destructive dark:text-destructive-dark" : "text-text dark:text-text-dark";
  const iconColor =
    tone === "destructive" ? colors.destructive : colors.textMuted;

  const content = (
    <View className="min-h-[44px] flex-row items-center gap-sm px-md py-sm">
      {leadingIcon ? <Icon name={leadingIcon} size={20} color={iconColor} /> : null}
      <View className="flex-1">
        <Text variant="body" className={`font-semibold ${titleToneClass}`}>
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
      // No `motion.fast` transition (#65-token, §V-F: "без анимации" until
      // the token lands) — the background swap below is instant.
      className={`${pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : ""} ${className}`}
    >
      {content}
    </LinkRow>
  );
}
