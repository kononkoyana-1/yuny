import { View } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";
import { Mascot } from "./Mascot";

export interface ErrorStateProps {
  /** Heading. Human-facing only — never a raw error code, stack trace, or API/LLM detail. */
  title: string;
  /** Body copy under the title, muted tone. Omit the prop — not pass an empty string — to show no explanation at all. */
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onContinueAnyway?: () => void;
  continueLabel?: string;
  className?: string;
}

/**
 * The mascot is `neutral`, not `thinking`: thinking is what it does while the
 * system is working, and by the time this shows, it has stopped. It is
 * decorative here — `accessible={false}` — so it is never announced by name
 * ("Mascot, neutral, stage 1"); the caller's `title`/`detail` already say
 * what happened.
 *
 * There used to be a single hardcoded reassurance line here ("Your progress
 * is saved. This was on our side."). That claim is not always true — a
 * rejected upload is the caller's material, not a server fault — so the
 * text is now entirely the caller's: `title` and `detail` carry whatever is
 * actually true for that failure, and there is no English-literal fallback.
 *
 * "Try again" is `secondary` rather than the gradient: an error screen is not
 * a place the product should be steering anyone forward with its loudest
 * control.
 */
export function ErrorState({
  title,
  detail,
  onRetry,
  retryLabel,
  onContinueAnyway,
  continueLabel,
  className = "",
}: ErrorStateProps) {
  return (
    <View
      accessibilityRole="alert"
      className={`items-center justify-center gap-md bg-background p-lg dark:bg-background-dark ${className}`}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Mascot stage={1} mood="neutral" size="medium" showStage={false} />
      </View>

      <View className="items-center gap-xs">
        <Text variant="heading" className="text-center">
          {title}
        </Text>
        {detail ? (
          <Text variant="body" tone="muted" className="text-center">
            {detail}
          </Text>
        ) : null}
      </View>

      <View className="w-full gap-sm">
        {onRetry && retryLabel ? (
          <Button label={retryLabel} variant="secondary" onPress={onRetry} />
        ) : null}
        {onContinueAnyway && continueLabel ? (
          <Button label={continueLabel} variant="ghost" onPress={onContinueAnyway} />
        ) : null}
      </View>
    </View>
  );
}
