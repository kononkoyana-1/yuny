import { View } from "react-native";
import { EmptyState } from "@/shared/ui";

/**
 * Screen 11 — Library (TZ.md §8). Real content (For Your Goal / Public
 * Resources / My Materials) is Phase 7. Copy is verbatim TZ.md §10 "Empty".
 */
export default function LibraryTab() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-lg dark:bg-background-dark">
      <EmptyState message="Add a material or create one with AI" />
    </View>
  );
}
