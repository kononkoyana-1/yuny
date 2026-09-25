import { Text as RNText, type TextProps as RNTextProps } from "react-native";

export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "caption"
  // #65 (today-session.design.md V.3/V.7): uppercase section label
  // ("СЕГОДНЯ", "ЧТО ЗНАЧИТ?") and the hero task-count number. `className`
  // must add `uppercase` itself where the source text isn't already —
  // `eyebrow` only sets the size/weight/tracking, per V.7's token table.
  | "eyebrow"
  | "numberHero";
export type TextTone =
  | "default"
  | "muted"
  | "inverse"
  | "brand"
  | "destructive"
  // #65 V.7: text roles introduced with the new colour tokens — a `HeroCard`
  // caption, "Верно"/"Почти" headings on `AnswerTray`, a confusion-pair label.
  | "heroInk"
  | "heroInkMuted"
  | "successInk"
  | "attentionInk"
  | "pairInk";

/**
 * Each variant carries its own font FAMILY, not a numeric weight.
 *
 * React Native does not synthesise weights: `fontWeight: 800` against a
 * Regular face renders as Regular on Android and as a faked, distorted bold
 * on iOS. Pointing each variant at the file that actually holds that weight
 * is the only way the scale in `tokens.ts` looks the same on all three
 * targets — which is why the weights in the Tailwind `fontSize` config are
 * paired with these classes rather than relied on alone.
 */
const VARIANT_CLASS: Record<TextVariant, string> = {
  display: "text-display font-extrabold",
  title: "text-title font-extrabold",
  heading: "text-heading font-bold",
  body: "text-body font-regular",
  caption: "text-caption font-medium",
  eyebrow: "text-eyebrow font-bold",
  numberHero: "text-number-hero font-extrabold tabular-nums",
};

/**
 * Colour belongs to `tone`, never to a `text-…` class passed through
 * `className`: both would be emitted and which one wins is a stylesheet
 * ordering detail, not something the call site can see. Passing
 * `className="text-primary"` here silently loses to `text-text` — that is why
 * `brand` exists rather than being spelled out at each call site.
 */
/** Exported for `HanziText` (`shared/ui/HanziText.tsx`), which shares this exact tone vocabulary. */
export const TONE_CLASS: Record<TextTone, string> = {
  default: "text-text dark:text-text-dark",
  muted: "text-text-muted dark:text-text-muted-dark",
  inverse: "text-text-inverse dark:text-text-inverse-dark",
  brand: "text-primary dark:text-primary-dark",
  destructive: "text-destructive dark:text-destructive-dark",
  heroInk: "text-hero-ink dark:text-hero-ink-dark",
  heroInkMuted: "text-hero-ink-muted dark:text-hero-ink-muted-dark",
  successInk: "text-success-ink dark:text-success-ink-dark",
  attentionInk: "text-attention-ink dark:text-attention-ink-dark",
  pairInk: "text-pair-ink dark:text-pair-ink-dark",
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
}

export function Text({
  variant = "body",
  tone = "default",
  className = "",
  ...props
}: TextProps) {
  return (
    <RNText
      className={`${VARIANT_CLASS[variant]} ${TONE_CLASS[tone]} ${className}`}
      {...props}
    />
  );
}
