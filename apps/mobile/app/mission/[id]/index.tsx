import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Mascot, Text } from "@/shared/ui";

/**
 * Screen 13 — Mission Overview (TZ.md §8 row 13) is Phase 5 scope (TZ.md
 * §19 "Фаза 5 — Learning loop"), not this task's. This is only the minimal
 * landing spot Home's "[Start Mission]" CTA needs so it navigates somewhere
 * real instead of a dead link or a client-side no-op — full Mission
 * Overview content (Purpose · Why · Estimated time · N activities ·
 * [Start Mission]) is explicitly out of scope here.
 *
 * Lives outside `(tabs)`/`(onboarding)` per TZ.md §4's structure
 * (`app/mission/[id]/`) since Mission is not a tab and opens as its own
 * full-screen flow (TZ.md §7 "Mission — не таб").
 */
export default function MissionOverviewStub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-md bg-background px-lg dark:bg-background-dark">
      <Mascot stage={1} mood="neutral" size="small" />
      <Text variant="title" className="text-center">
        Mission Overview
      </Text>
      <Text variant="body" tone="muted" className="text-center">
        Coming soon — mission {id}.
      </Text>
      <Button label="Back to Home" variant="secondary" onPress={() => router.replace("/")} />
    </View>
  );
}
