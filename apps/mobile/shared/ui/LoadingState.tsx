import { View } from "react-native";
import { Text } from "./Text";
import { Mascot } from "./Mascot";

export interface LoadingStateProps {
  /** Human-readable explanation of what is happening, e.g. "Analyzing your goal…" */
  message: string;
  className?: string;
}

export function LoadingState({ message, className = "" }: LoadingStateProps) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`items-center justify-center gap-md p-lg ${className}`}
    >
      <Mascot stage={1} mood="thinking" size="medium" />
      <Text variant="body" tone="muted" className="text-center">
        {message}
      </Text>
    </View>
  );
}
