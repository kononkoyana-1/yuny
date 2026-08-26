import { View } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";
import { Mascot } from "./Mascot";

export interface ErrorStateProps {
  /** Human-facing message only — never a raw error code, stack trace, or API/LLM detail. */
  message?: string;
  onRetry?: () => void;
  onContinueAnyway?: () => void;
  className?: string;
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
  onContinueAnyway,
  className = "",
}: ErrorStateProps) {
  return (
    <View
      accessibilityRole="alert"
      className={`items-center justify-center gap-md p-lg ${className}`}
    >
      <Mascot stage={1} mood="thinking" size="medium" />
      <Text variant="heading" className="text-center">
        {message}
      </Text>
      <Text variant="body" tone="muted" className="text-center">
        Let&apos;s try again.
      </Text>
      <View className="w-full gap-sm">
        {onRetry ? (
          <Button label="Try Again" variant="primary" onPress={onRetry} />
        ) : null}
        {onContinueAnyway ? (
          <Button
            label="Continue with another activity"
            variant="ghost"
            onPress={onContinueAnyway}
          />
        ) : null}
      </View>
    </View>
  );
}
