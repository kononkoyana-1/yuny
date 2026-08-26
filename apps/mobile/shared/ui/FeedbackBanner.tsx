import { View } from "react-native";
import { Text } from "./Text";

export type FeedbackTone = "positive" | "encouraging";

const CONTAINER_CLASS: Record<FeedbackTone, string> = {
  positive: "bg-success/10 border-success",
  encouraging: "bg-accent-soft border-accent dark:bg-accent-soft-dark",
};

export interface FeedbackBannerProps {
  tone?: FeedbackTone;
  message: string;
  className?: string;
}

export function FeedbackBanner({
  tone = "encouraging",
  message,
  className = "",
}: FeedbackBannerProps) {
  return (
    <View
      accessibilityRole="text"
      className={`rounded-md border px-md py-sm ${CONTAINER_CLASS[tone]} ${className}`}
    >
      <Text variant="body">{message}</Text>
    </View>
  );
}
