import { Text as RNText, type TextProps as RNTextProps } from "react-native";

export type TextVariant = "display" | "title" | "heading" | "body" | "caption";
export type TextTone = "default" | "muted" | "inverse";

const VARIANT_CLASS: Record<TextVariant, string> = {
  display: "text-display",
  title: "text-title",
  heading: "text-heading",
  body: "text-body",
  caption: "text-caption",
};

const TONE_CLASS: Record<TextTone, string> = {
  default: "text-text dark:text-text-dark",
  muted: "text-text-muted dark:text-text-muted-dark",
  inverse: "text-text-inverse dark:text-text-inverse-dark",
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
