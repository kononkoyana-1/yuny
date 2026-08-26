import { Pressable, ActivityIndicator, type PressableProps } from "react-native";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const CONTAINER_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-primary dark:bg-primary-dark",
  secondary:
    "bg-primary-soft dark:bg-primary-soft-dark border border-primary dark:border-primary-dark",
  ghost: "bg-transparent",
};

const LABEL_TONE_CLASS: Record<ButtonVariant, string> = {
  primary: "text-text-inverse dark:text-text-inverse-dark",
  secondary: "text-primary dark:text-primary-dark",
  ghost: "text-primary dark:text-primary-dark",
};

export interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
}

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`min-h-[44px] items-center justify-center rounded-pill px-lg py-md ${CONTAINER_CLASS[variant]} ${isDisabled ? "opacity-50" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text
          variant="heading"
          className={LABEL_TONE_CLASS[variant]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
