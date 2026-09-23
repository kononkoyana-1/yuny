import { useState, type Ref } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { useTheme } from "@/shared/lib/useTheme";

export interface InputProps extends TextInputProps {
  className?: string;
  /**
   * Reaches the `TextInput` through `...props` (React 19: `ref` is an
   * ordinary prop), so a `Sheet` can put focus in the field on open.
   */
  ref?: Ref<TextInput>;
}

/**
 * Focus is drawn by us, not by the browser.
 *
 * On web `TextInput` renders an `<input>`, which picks up the platform's
 * default focus ring — a black outline in Chrome. That is off-palette and
 * inconsistent with the same field on iOS and Android, so the ring is
 * suppressed and replaced by a primary-coloured border of the same weight.
 *
 * Suppressing it is only acceptable *because* something visible takes its
 * place: keyboard users must still be able to see where they are (TZ.md §13).
 */
const FIELD_BASE =
  "rounded-md border bg-surface px-md py-sm text-body text-text dark:bg-surface-dark dark:text-text-dark";

const borderClass = (focused: boolean) =>
  focused
    ? "border-primary dark:border-primary-dark"
    : "border-border dark:border-border-dark";

/**
 * RNW maps this to CSS `outline-width`; native ignores it. Width rather than
 * `outlineStyle: "none"`, which React Native's own types do not allow.
 */
const NO_NATIVE_OUTLINE = { outlineWidth: 0 } as const;

function useFocusState(props: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return {
    focused,
    handlers: {
      onFocus: (e: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) => {
        setFocused(true);
        props.onFocus?.(e);
      },
      onBlur: (e: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) => {
        setFocused(false);
        props.onBlur?.(e);
      },
    },
  };
}

export function Input({ className = "", style, ...props }: InputProps) {
  const { colors } = useTheme();
  const { focused, handlers } = useFocusState(props);

  return (
    <TextInput
      className={`min-h-[44px] ${FIELD_BASE} ${borderClass(focused)} ${className}`}
      placeholderTextColor={colors.textMuted}
      style={[NO_NATIVE_OUTLINE, style]}
      {...props}
      {...handlers}
    />
  );
}

export function TextArea({ className = "", style, ...props }: InputProps) {
  const { colors } = useTheme();
  const { focused, handlers } = useFocusState(props);

  return (
    <TextInput
      multiline
      textAlignVertical="top"
      className={`min-h-[96px] ${FIELD_BASE} ${borderClass(focused)} ${className}`}
      placeholderTextColor={colors.textMuted}
      style={[NO_NATIVE_OUTLINE, style]}
      {...props}
      {...handlers}
    />
  );
}
