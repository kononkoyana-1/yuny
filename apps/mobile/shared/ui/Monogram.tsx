import { View } from "react-native";
import { gradients } from "@/shared/config/tokens";
import { linearGradient } from "@/shared/platform/gradient";
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
 * `gradients.hero` (#65) is not in `tokens.ts` yet — §V-F's replacement,
 * `gradients.primary` / `gradients.primaryDark`, is used instead, with
 * `heroInk` replaced the same way by `textInverse` (both AA-checked in the
 * spec's replacement table).
 */
export function Monogram({ name, className = "" }: MonogramProps) {
  const { scheme } = useTheme();
  const letter = [...name.trim()][0]?.toLocaleUpperCase("ru") ?? "";

  // #65-token: gradients.hero — replacement per §V-F.
  const [from, to] = scheme === "dark" ? gradients.primaryDark : gradients.primary;

  return (
    <View
      aria-hidden
      className={`h-avatar w-avatar items-center justify-center rounded-pill ${className}`}
      style={linearGradient(from, to)}
    >
      {letter ? (
        <Text
          variant="title"
          // #65-token: heroInk — replacement per §V-F: `textInverse`.
          tone="inverse"
        >
          {letter}
        </Text>
      ) : null}
    </View>
  );
}
