import { View } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";
import { Mascot } from "./Mascot";

export interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  showMascot?: boolean;
  className?: string;
}

/**
 * An invitation, not an apology: the message names the thing to do, and when
 * a caller supplies an action it gets the primary button. The background is
 * painted explicitly — leaving it transparent is what let React Navigation's
 * own `#F2F2F2` show through as a stripe under the tab bar.
 */
export function EmptyState({
  message,
  actionLabel,
  onAction,
  showMascot = true,
  className = "",
}: EmptyStateProps) {
  return (
    <View
      className={`items-center justify-center gap-md bg-background p-lg dark:bg-background-dark ${className}`}
    >
      {showMascot ? (
        <Mascot decorative stage={1} mood="neutral" size="medium" showStage={false} />
      ) : null}
      <Text variant="heading" className="text-center">
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="primary" onPress={onAction} />
      ) : null}
    </View>
  );
}
