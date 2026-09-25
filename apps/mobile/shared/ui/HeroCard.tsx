import { View, type ViewProps } from "react-native";
import { gradients } from "@/shared/config/tokens";
import { angledGradient, radialGlow } from "@/shared/platform/gradient";
import { useTheme } from "@/shared/lib/useTheme";

export interface HeroCardProps extends Omit<ViewProps, "style"> {
  className?: string;
}

/**
 * DS1 (today-session.design.md §9): the "Сегодня" card's `ready`/
 * `in_progress` surface — `gradients.hero` (135°) with a radial
 * `gradients.heroSheen` decal from the top-right corner, `radius.hero`,
 * `elevation.glow`. Descendants set their own text tone (`heroInk` /
 * `heroInkMuted`, via `Text`'s `tone` prop) — this component only paints the
 * backdrop, per the "colour via `tone`, not a `text-*` className" rule.
 *
 * Not used at `done`/`nothing_due`/error (§3.5): those states are `Card`
 * (`surface` + `border`), which is a different component on purpose — the
 * one-hero-per-screen rule (V.1 п.1) means the gradient itself is part of
 * what "being the hero" means, not just a colour swap.
 */
export function HeroCard({ className = "", children, ...props }: HeroCardProps) {
  const { scheme } = useTheme();
  const heroStops = scheme === "dark" ? gradients.heroDark : gradients.hero;
  const sheenStops = scheme === "dark" ? gradients.heroSheenDark : gradients.heroSheen;

  return (
    <View
      className={`overflow-hidden rounded-hero p-lg shadow-glow dark:shadow-glow-dark ${className}`}
      style={angledGradient(heroStops)}
      {...props}
    >
      <View
        pointerEvents="none"
        aria-hidden
        className="absolute inset-0"
        style={radialGlow(sheenStops, "100% 0%")}
      />
      {children}
    </View>
  );
}
