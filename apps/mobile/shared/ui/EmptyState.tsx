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

export function EmptyState({
  message,
  actionLabel,
  onAction,
  showMascot = true,
  className = "",
}: EmptyStateProps) {
  return (
    <View
      className={`items-center justify-center gap-md p-lg ${className}`}
    >
      {showMascot ? <Mascot stage={1} mood="neutral" size="medium" /> : null}
      <Text variant="body" tone="muted" className="text-center">
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="primary" onPress={onAction} />
      ) : null}
    </View>
  );
}
