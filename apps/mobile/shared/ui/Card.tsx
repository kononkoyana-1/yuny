import { View, type ViewProps } from "react-native";

export interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className = "", ...props }: CardProps) {
  return (
    <View
      className={`rounded-lg border border-border bg-surface p-md dark:border-border-dark dark:bg-surface-dark ${className}`}
      {...props}
    />
  );
}
