import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Text } from "@/shared/ui";
import { useOnboardingStore } from "@/features/onboarding/store";
import { TARGET_LANGUAGES } from "@/features/onboarding/targetLanguages";

/**
 * Screen 02 — Target Language (TZ.md §8 row 02). MVP Spec §5: list can be
 * short for MVP, but nothing here assumes a fixed count — see
 * `TARGET_LANGUAGES`. No search box yet since four options don't need one;
 * adding one later only touches this file, not the data model.
 */
export default function TargetLanguage() {
  const router = useRouter();
  const setTargetLanguage = useOnboardingStore((state) => state.setTargetLanguage);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View className="flex-1 justify-between bg-background px-lg py-xl dark:bg-background-dark">
      <View className="gap-lg">
        <Text variant="title">What language do you want to learn?</Text>

        <View className="gap-sm">
          {TARGET_LANGUAGES.map((language) => {
            const isSelected = selected === language.code;
            return (
              <Pressable
                key={language.code}
                accessibilityRole="radio"
                accessibilityLabel={language.label}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelected(language.code)}
                className={`min-h-[44px] justify-center rounded-md border px-md py-sm ${
                  isSelected
                    ? "border-primary bg-primary-soft dark:border-primary-dark dark:bg-primary-soft-dark"
                    : "border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
                }`}
              >
                <Text
                  variant="body"
                  className={isSelected ? "font-semibold text-primary dark:text-primary-dark" : ""}
                >
                  {language.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        label="Continue"
        variant="primary"
        disabled={!selected}
        onPress={() => {
          if (!selected) return;
          setTargetLanguage(selected);
          router.push("/goal-setup");
        }}
      />
    </View>
  );
}
