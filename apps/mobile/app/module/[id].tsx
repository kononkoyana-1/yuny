// TEMPORARY (phase 4): заглушка до экрана выбора урока, фаза 5 заменяет файл целиком. docs/design/specs/home.design.md §4
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/shared/ui";
import { t } from "@/shared/i18n";

/**
 * Placeholder for the phase-5 lesson-selection screen. No network requests,
 * `id` is not read (home.design.md §4). Full-screen, outside `(tabs)` — same
 * shape as the lesson flow itself.
 */
export default function ModuleStub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background dark:bg-background-dark" style={{ paddingTop: insets.top }}>
      <EmptyState
        className="flex-1"
        message={t("module.stub.title")}
        actionLabel={t("module.stub.back")}
        onAction={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/");
          }
        }}
      />
    </View>
  );
}
