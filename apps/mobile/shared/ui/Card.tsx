import { View, type ViewProps } from "react-native";

export interface CardProps extends ViewProps {
  className?: string;
}

/**
 * Container for Goal, Mission preview, Resource (TZ.md §12).
 *
 * Depth comes from a soft shadow rather than a 1px border: on a lavender
 * background a hairline border reads as a seam, while a shadow lets the card
 * sit above the surface. The border stays in dark mode, where a shadow on a
 * near-black background is invisible and an edge is the only thing that
 * separates the card from the page.
 */
export function Card({ className = "", ...props }: CardProps) {
  return (
    <View
      className={`rounded-card bg-surface p-md shadow-md shadow-shadow/10 dark:border dark:border-border-dark dark:bg-surface-dark dark:shadow-none ${className}`}
      {...props}
    />
  );
}
