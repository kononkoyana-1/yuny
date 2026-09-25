import { Pressable } from "react-native";
import { useTheme } from "@/shared/lib/useTheme";
import { Icon, type IconName } from "./Icon";
import { Text, type TextTone } from "./Text";
import { FOCUS_RING_CLASS } from "./focusRing";

export interface ActionRowProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** `destructive` for "Удалить папку"-style rows. */
  tone?: Extract<TextTone, "default" | "destructive">;
  className?: string;
}

/**
 * DS-M6 (folder-map.design.md §8): a full-width row action — the "Действия
 * с папкой" sheet's rows (rename, delete). `sizing.tapTarget` floor.
 */
export function ActionRow({ icon, label, onPress, tone = "default", className = "" }: ActionRowProps) {
  const { colors } = useTheme();
  const iconColor = tone === "destructive" ? colors.destructive : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`min-h-tap w-full flex-row items-center gap-md rounded-md px-md ${FOCUS_RING_CLASS} ${className}`}
    >
      <Icon name={icon} size={20} color={iconColor} />
      <Text variant="body" tone={tone}>
        {label}
      </Text>
    </Pressable>
  );
}
