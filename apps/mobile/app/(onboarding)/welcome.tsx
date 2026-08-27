import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Mascot, Text } from "@/shared/ui";
import { useOnboardingStore } from "@/features/onboarding/store";
import { UI_LANGUAGES } from "@/features/onboarding/uiLanguages";
import { useProfile, useUpdateProfile } from "@/shared/api";

/**
 * Screen 01 — Welcome (TZ.md §8 row 01). Copy verbatim from
 * `docs/MVP Product Specification.md` §4. Resets the onboarding draft on
 * entry so a second pass through onboarding (e.g. after backing all the way
 * out) never carries stale answers from a previous attempt.
 *
 * UI-language switcher: a small top-corner control, deliberately not a full
 * list like screen 02's target-language picker — Welcome's one primary
 * action stays "Get Started" (MVP-4.03), this is a secondary, ambient
 * control that must not visually compete with it or the mascot (TZ.md §11).
 * Persists immediately to `Profile.ui_language` via `useUpdateProfile()` on
 * tap, not gated behind the CTA.
 *
 * IMPORTANT — scope: this only persists the choice. No i18next is wired up
 * yet (TZ.md §12 describes the full requirement; Phase 3's screens are all
 * hardcoded English strings per the existing precedent noted across this
 * onboarding flow). Selecting "RU" here does not yet translate any UI text —
 * that's a separate, larger task. Don't present this as full localization.
 */
export default function Welcome() {
  const router = useRouter();
  const reset = useOnboardingStore((state) => state.reset);
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  return (
    <View className="flex-1 items-center justify-center gap-lg bg-background px-lg dark:bg-background-dark">
      <View className="absolute right-lg top-xl flex-row gap-xs">
        {UI_LANGUAGES.map((language) => {
          const isSelected = profile?.ui_language === language.code;
          return (
            <Pressable
              key={language.code}
              accessibilityRole="button"
              accessibilityLabel={`Interface language: ${language.label}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => updateProfile.mutate({ ui_language: language.code })}
              className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-pill px-sm ${
                isSelected
                  ? "bg-primary-soft dark:bg-primary-soft-dark"
                  : "bg-transparent"
              }`}
            >
              <Text
                variant="caption"
                className={
                  isSelected
                    ? "font-semibold text-primary dark:text-primary-dark"
                    : "text-text-muted dark:text-text-muted-dark"
                }
              >
                {language.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Mascot stage={1} mood="neutral" size="large" />

      <View className="gap-sm">
        <Text variant="title" className="text-center">
          Tell us what you want to achieve.
        </Text>
        <Text variant="body" tone="muted" className="text-center">
          We&apos;ll help you learn the language for it.
        </Text>
      </View>

      <Button
        label="Get Started"
        variant="primary"
        className="w-full"
        onPress={() => {
          reset();
          router.push("/language");
        }}
      />
    </View>
  );
}
