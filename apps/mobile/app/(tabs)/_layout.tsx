import type { ComponentProps } from "react";
import { Pressable } from "react-native";
import { TabList, TabSlot, Tabs, TabTrigger } from "expo-router/ui";
import { Text } from "@/shared/ui";
import type { Href } from "expo-router";

/**
 * Four tabs — Home / Goal / Library / Profile (TZ.md §7, MVP-3.01). Mission
 * is deliberately not part of this navigator (TZ.md §7, MVP-3.03) — it will
 * live at `app/mission/[id]/` as a separate full-screen flow (Phase 5).
 *
 * Built on `expo-router/ui`'s headless Tabs/TabList/TabTrigger/TabSlot
 * rather than the styled `Tabs` layout, specifically so the same trigger
 * markup can be repositioned as a bottom bar (≤768px) or a left sidebar
 * (>768px) via NativeWind responsive variants alone (TZ.md §7 "Web") —
 * no extra navigation dependency (TZ.md §2 forbids one beyond expo-router).
 *
 * IMPORTANT: `TabSlot` and `TabList` must be direct children of `Tabs` (only
 * `Fragment`/`TabList` wrapping is allowed in between). `Tabs`' internal
 * `parseTriggersFromChildren` walk only recurses into `Fragment` and
 * `TabList` nodes — never into a plain `View` — so wrapping them in an extra
 * `<View>` (as an earlier version of this file did, for layout) silently
 * produces an empty trigger list, which crashes the navigator at runtime
 * (caught by the root ErrorBoundary as "Something went wrong"). Layout
 * classes therefore go directly on `Tabs` and `TabList` themselves — both
 * forward `className`/`style` onto their own rendered `View`.
 */
const TAB_ITEMS: { name: string; href: Href; label: string }[] = [
  { name: "index", href: "/", label: "Home" },
  { name: "goal", href: "/goal", label: "Goal" },
  { name: "library", href: "/library", label: "Library" },
  { name: "profile", href: "/profile", label: "Profile" },
];

interface TabBarButtonProps extends ComponentProps<typeof Pressable> {
  label: string;
  isFocused?: boolean;
}

function TabBarButton({ label, isFocused, ...pressableProps }: TabBarButtonProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(isFocused) }}
      className={`min-h-[44px] flex-1 items-center justify-center gap-xs rounded-md px-sm py-xs
        md:flex-none md:flex-row md:items-center md:justify-start md:gap-sm md:px-md md:py-sm
        ${isFocused ? "bg-primary-soft dark:bg-primary-soft-dark" : ""}`}
      {...pressableProps}
    >
      <Text
        variant="caption"
        className={
          isFocused
            ? "font-semibold text-primary dark:text-primary-dark"
            : "text-text-muted dark:text-text-muted-dark"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    // Mobile/narrow web: TabSlot on top, bar below (row order). Wide web
    // (md:): row-reverse puts the bar on the left as a sidebar, content on
    // the right — same tree, no duplicated triggers.
    <Tabs className="flex-1 md:flex-row-reverse">
      <TabSlot />
      <TabList
        className="flex-row items-stretch justify-around border-t border-border bg-surface p-xs
          dark:border-border-dark dark:bg-surface-dark
          md:w-56 md:flex-col md:items-stretch md:justify-start md:gap-xs md:border-r md:border-t-0 md:p-md"
      >
        {TAB_ITEMS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabBarButton label={tab.label} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}
