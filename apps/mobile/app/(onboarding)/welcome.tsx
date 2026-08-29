import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { AtmosphericBackground, Button, Mascot, Text } from "@/shared/ui";
import { useOnboardingStore } from "@/features/onboarding/store";
import { UI_LANGUAGES } from "@/features/onboarding/uiLanguages";
import { useProfile, useUpdateProfile } from "@/shared/api";
import { REQUIRES_AUTH } from "@/shared/config/dataSource";

/**
 * Screen 01 — Welcome (TZ.md §8 row 01), laid out to the visual reference in
 * `assets/image/design.png`: wordmark, two-line value proposition, mascot,
 * gradient CTA, and a route back to sign-in for people who already have an
 * account.
 *
 * The copy differs from `docs/MVP Product Specification.md` §4, and that is
 * allowed: the spec offers its wording under "Пример", as an illustration of
 * a short value proposition rather than mandated text. What the spec does
 * require — mascot, short value proposition, CTA, and none of the stats,
 * library, chat or long product description — all holds.
 *
 * The reference also shows three carousel dots. They are deliberately NOT
 * drawn here: this screen is one screen, not the first of three, and dots
 * that promise slides which do not exist are a lie in the interface. Adding
 * the slides would mean inventing product copy and new screens, which
 * TZ.md §20 and MVP-4.01 both rule out without an explicit ask.
 *
 * UI-language switcher: a small top-corner control, deliberately not a full
 * list like screen 02's target-language picker — Welcome's one primary action
 * stays the CTA (MVP-4.03), and this must not compete with it or the mascot.
 *
 * IMPORTANT — scope: the switcher only persists the choice. No i18next is
 * wired up yet, so selecting "RU" does not translate any UI text.
 */
export default function Welcome() {
  const router = useRouter();
  const reset = useOnboardingStore((state) => state.reset);
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  return (
    <AtmosphericBackground className="px-lg pb-xl pt-xxl">
      <View className="absolute right-lg top-xl z-10 flex-row gap-xs">
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
                isSelected ? "bg-primary-soft dark:bg-primary-soft-dark" : "bg-transparent"
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

      {/* Wordmark + value proposition */}
      <View className="items-center gap-md pt-xl">
        <Text variant="display" tone="brand" className="text-[52px] leading-[56px]">
          Yuny
        </Text>
        <View className="items-center">
          <Text variant="body" className="text-center font-medium">
            Your AI companion
          </Text>
          <Text variant="body" className="text-center font-medium">
            for real English growth
          </Text>
        </View>
      </View>

      {/* The mascot carries its own sparkles in the asset, so nothing
          decorative is drawn around it here. `neutral` is what TZ.md §8 row 01
          specifies for this screen.

          `showStage={false}`: nobody has a growth stage before their first
          mission, and five pips under a centred illustration read as carousel
          dots — the very thing this screen deliberately does not draw. */}
      <View className="flex-1 items-center justify-center">
        <Mascot stage={1} mood="neutral" size="hero" showStage={false} />
      </View>

      <View className="gap-md">
        <Button
          label="Let's start"
          variant="primary"
          className="w-full"
          onPress={() => {
            reset();
            router.push("/language");
          }}
        />

        {REQUIRES_AUTH ? (
          <View className="flex-row items-center justify-center gap-xs">
            <Text variant="caption" tone="muted">
              Already have an account?
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Log in"
              onPress={() => router.push("/sign-in")}
              className="min-h-[44px] justify-center px-xs"
            >
              <Text variant="caption" className="font-bold text-primary dark:text-primary-dark">
                Log in
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </AtmosphericBackground>
  );
}
