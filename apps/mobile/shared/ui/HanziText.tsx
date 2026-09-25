import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { pickHanziHeroVariant } from "@/shared/lib/hanziVariant";
import { TONE_CLASS, type TextTone } from "./Text";

export type HanziTextVariant = "hero" | "option" | "sentence" | "tile" | "inline";

/** Reuses `Text`'s tone vocabulary — `HanziText` renders every colour role `Text` does. */
export type HanziTextTone = TextTone;

const SIZE_CLASS: Record<Exclude<HanziTextVariant, "hero">, string> = {
  option: "text-hanzi-option",
  sentence: "text-hanzi-sentence",
  tile: "text-hanzi-tile",
  inline: "text-hanzi-inline",
};

const WEIGHT_CLASS: Record<HanziTextVariant, string> = {
  hero: "font-hanzi-medium",
  option: "font-hanzi-medium",
  sentence: "font-hanzi-regular",
  tile: "font-hanzi-medium",
  inline: "font-hanzi-medium",
};

export interface HanziTextProps extends Omit<RNTextProps, "children"> {
  /**
   * A Chinese string. Typed `string`, not `ReactNode` — mixed-language
   * children would defeat both the length check below (DS5: `hero` picks
   * `heroLong` at 3+ знака) and the point of `lang="zh-CN"`, which only
   * makes sense on a pure-hanzi run.
   */
  children: string;
  variant: HanziTextVariant;
  tone?: HanziTextTone;
  className?: string;
}

/**
 * DS5 (today-session.design.md §9): every hanzi string in the app goes
 * through this — `fontFamily.hanzi` (Noto Sans SC), `lang="zh-CN"` so both
 * the screen reader's voice and the glyph set (simplified forms) are right.
 *
 * `variant="hero"` self-selects `typography.hanziHero` (1–2 знака) or
 * `typography.hanziHeroLong` (3+) — see `pickHanziHeroVariant`.
 */
export function HanziText({
  children,
  variant,
  tone = "default",
  className = "",
  ...props
}: HanziTextProps) {
  const sizeClass =
    variant === "hero"
      ? pickHanziHeroVariant(children) === "heroLong"
        ? "text-hanzi-hero-long"
        : "text-hanzi-hero"
      : SIZE_CLASS[variant];

  return (
    <RNText
      className={`${sizeClass} ${WEIGHT_CLASS[variant]} ${TONE_CLASS[tone]} ${className}`}
      // RN's `TextProps` has no `lang` field (checked
      // node_modules/react-native/Libraries/Text/TextProps.d.ts); react-native-web
      // forwards unknown props straight to the DOM node, and native voice-over
      // reads `accessibilityLanguage`, set alongside it for the same effect.
      {...({ lang: "zh-CN", accessibilityLanguage: "zh-CN" } as object)}
      {...props}
    >
      {children}
    </RNText>
  );
}
