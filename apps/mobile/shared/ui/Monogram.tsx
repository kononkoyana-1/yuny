import { View } from "react-native";
import { gradients } from "@/shared/config/tokens";
import { angledGradient } from "@/shared/platform/gradient";
import { useTheme } from "@/shared/lib/useTheme";
import { Text } from "./Text";

export interface MonogramProps {
  /** The name to take a letter from — pass `display_name`, not the letter itself. */
  name: string;
  className?: string;
}

/**
 * S5 (settings.design.md §9): the profile-card avatar — a `sizing.avatar`
 * circle carrying the first grapheme of `name`, uppercased. Always
 * `aria-hidden`: the name is already visible as text right next to it
 * (settings.design.md §3.3), so the circle carries no information of its
 * own.
 *
 * Fill is `gradients.hero`, the letter `heroInk`.
 */
export function Monogram({ name, className = "" }: MonogramProps) {
  const { scheme } = useTheme();
  const letter = [...name.trim()][0]?.toLocaleUpperCase("ru") ?? "";

  const heroStops = scheme === "dark" ? gradients.heroDark : gradients.hero;

  return (
    <View
      aria-hidden
      className={`h-avatar w-avatar items-center justify-center rounded-pill ${className}`}
      style={angledGradient(heroStops)}
    >
      {letter ? (
        <Text variant="title" tone="heroInk">
          {letter}
        </Text>
      ) : null}
    </View>
  );
}
