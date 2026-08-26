import { TextInput, type TextInputProps } from "react-native";
import { useTheme } from "@/shared/lib/useTheme";

export interface InputProps extends TextInputProps {
  className?: string;
}

const BASE_CLASS =
  "min-h-[44px] rounded-md border border-border bg-surface px-md py-sm text-body text-text dark:border-border-dark dark:bg-surface-dark dark:text-text-dark";

export function Input({ className = "", ...props }: InputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      className={`${BASE_CLASS} ${className}`}
      placeholderTextColor={colors.textMuted}
      {...props}
    />
  );
}

export function TextArea({ className = "", ...props }: InputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      className={`min-h-[96px] rounded-md border border-border bg-surface px-md py-sm text-body text-text dark:border-border-dark dark:bg-surface-dark dark:text-text-dark ${className}`}
      placeholderTextColor={colors.textMuted}
      {...props}
    />
  );
}
