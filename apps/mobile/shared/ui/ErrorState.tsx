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

/**
 * The mascot is `neutral`, not `thinking`: thinking is what it does while the
 * system is working, and by the time this shows, it has stopped.
 *
 * The reassurance line is the substance of this screen. A learner who hits an
 * error mid-mission does not know whether their work survived, and that — not
 * the failure itself — is what they need answered. Every write goes through an
 * Edge Function that has either committed or not, so the claim holds.
 *
 * "Try again" is `secondary` rather than the gradient: an error screen is not
 * a place the product should be steering anyone forward with its loudest
 * control.
 */
export function ErrorState({
  message = "Something went wrong",
  onRetry,
  onContinueAnyway,
  className = "",
}: ErrorStateProps) {
  return (
    <View
      accessibilityRole="alert"
      className={`items-center justify-center gap-md bg-background p-lg dark:bg-background-dark ${className}`}
    >
      <Mascot stage={1} mood="neutral" size="medium" showStage={false} />

      <View className="items-center gap-xs">
        <Text variant="heading" className="text-center">
          {message}
        </Text>
        <Text variant="body" tone="muted" className="text-center">
          Your progress is saved. This was on our side.
        </Text>
      </View>

      <View className="w-full gap-sm">
        {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
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
