import type { ComponentProps } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { TabList, TabSlot, Tabs, TabTrigger } from "expo-router/ui";
import { Icon, Text } from "@/shared/ui";
import type { IconName } from "@/shared/ui";
import { useTheme } from "@/shared/lib/useTheme";
import { breakpoints, spacing, typography } from "@/shared/config/tokens";
import type { Href } from "expo-router";

/**
 * Three visible tabs — Главная / Загрузка / Настройки (#66: the dictionary
 * screen, labelled «Главная», is first and the start screen; `/` redirects there through the hidden
 * `index` trigger below). The
 * lesson is deliberately not part of this navigator: it lives at
 * `app/lesson/` as a separate full-screen flow, so a task fills the screen
 * with nothing competing for the exit.
 *
 * Built on `expo-router/ui`'s headless Tabs/TabList/TabTrigger/TabSlot
 * rather than the styled `Tabs` layout, specifically so the same trigger
 * markup can be repositioned as a bottom bar (<768px) or a left sidebar
 * (≥768px) without an extra navigation dependency (TZ.md §2 forbids one
 * beyond expo-router, TZ.md §7 "Web").
 *
 * IMPORTANT — two constraints these components impose, both of which fail
 * silently rather than loudly:
 *
 * 1. `TabSlot` and `TabList` must be direct children of `Tabs` (only
 *    `Fragment`/`TabList` may sit in between). `Tabs`' internal
 *    `parseTriggersFromChildren` walk recurses into `Fragment` and `TabList`
 *    only — never into a plain `View` — so wrapping them in an extra `<View>`
 *    for layout produces an empty trigger list and crashes the navigator at
 *    runtime (surfacing as the root ErrorBoundary's "Something went wrong").
 *
 * 2. NativeWind does not process `className` on `Tabs` or `TabList`. Styles
 *    put there are dropped with no warning, so all layout on those two goes
 *    through `style`. `TabTrigger`'s child is a plain `Pressable`, which
 *    NativeWind does handle, so classes are fine there.
 */
const TAB_ITEMS: { name: string; href: Href; label: string; icon: IconName }[] = [
  // Стартовый экран: «Сегодня», свой словарь и поиск — поэтому «Главная».
  { name: "dictionary", href: "/dictionary", label: "Главная", icon: "home" },
  { name: "upload", href: "/upload", label: "Загрузка", icon: "upload" },
  { name: "settings", href: "/settings", label: "Настройки", icon: "settings" },
];

interface TabBarButtonProps extends ComponentProps<typeof Pressable> {
  label: string;
  icon: IconName;
  /** Sidebar layout (≥768px): glyph and label sit in a row. */
  isWide: boolean;
  isFocused?: boolean;
}

/**
 * Selection is carried by colour alone — the glyph and label both turn
 * `primary` — with no filled pill behind the active tab. The reference bar
 * is a light surface with one coloured item on it, and a pill would add a
 * second competing shape at the exact moment the icon is already doing the
 * work.
 *
 * The icon is `aria-hidden` (no `label` passed to `Icon`): the Pressable
 * already carries the accessible name, and announcing it twice is noise.
 */
function TabBarButton({ label, icon, isWide, isFocused, ...pressableProps }: TabBarButtonProps) {
  const { colors } = useTheme();
  const tint = isFocused ? colors.primary : colors.textMuted;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(isFocused) }}
      className="min-h-tap flex-1 items-center justify-center rounded-md px-sm py-xs
        md:flex-none md:justify-start md:px-md md:py-sm"
      {...pressableProps}
    >
      {/*
       * The glyph and label are stacked by this inner View, not by the
       * Pressable itself. `TabTrigger` clones its child with `asChild` and
       * appends its own `style` AFTER whatever the child carries, so a
       * `flexDirection` set on the Pressable loses to the trigger's `row` —
       * measured on the rendered tab, and it took the `gap` with it. Nothing
       * clones this View, so its layout is safe.
       */}
      <View
        style={{
          flexDirection: isWide ? "row" : "column",
          alignItems: "center",
          gap: isWide ? spacing.sm : spacing.xs,
        }}
      >
        <Icon name={icon} size={22} color={tint} />
        <Text
          style={{
            color: tint,
            fontSize: typography.tabLabel.size,
            lineHeight: typography.tabLabel.lineHeight,
            letterSpacing: typography.tabLabel.letterSpacing,
          }}
          className={isFocused ? "font-bold" : "font-semibold"}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * No gate in front of the tabs. The previous product hid them until a goal
 * existed; this one has nothing to set up before the first screen — a user
 * with no words sees «Мой словарь»'s empty state inviting a folder or upload.
 */
export default function TabsLayout() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= breakpoints.wide;

  return (
    /*
     * Layout goes through `style`, not `className`.
     *
     * `Tabs` and `TabList` come from `expo-router/ui`, and NativeWind never
     * processes their `className` — measured on the rendered bar, only the
     * flex-direction and justify-content it sets itself survived; the
     * padding, border and background were all silently dropped. That went
     * unnoticed while the bar held bare text and happened to fit; adding
     * icons made it taller, and with no `flex: 1` constraining the tree the
     * whole bar was pushed 18px below the viewport.
     *
     * Narrow: content on top, bar along the bottom. Wide (≥768): the same
     * tree with `row-reverse`, so the bar becomes a left sidebar — no
     * duplicated triggers. The breakpoint is read from the window rather than
     * from a `md:` variant for the same reason as above.
     */
    <Tabs style={{ flex: 1, flexDirection: isWide ? "row-reverse" : "column", overflow: "hidden" }}>
      {/*
        `minHeight: 0` is not decoration. On web these become CSS flex items,
        where a flex child defaults to `min-height: auto` and therefore
        refuses to shrink below its content — a long Home pushed the slot to
        818px inside an 844px window and shoved the tab bar off the bottom
        edge. Zeroing the minimum lets the slot yield the bar its height.
      */}
      <TabSlot style={{ flex: 1, minHeight: 0 }} />
      <TabList
        style={{
          flexDirection: isWide ? "column" : "row",
          alignItems: "stretch",
          justifyContent: isWide ? "flex-start" : "space-around",
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...(isWide
            ? { width: 224, borderRightWidth: 1, padding: spacing.md, gap: spacing.xs }
            : {
                borderTopWidth: 1,
                paddingHorizontal: spacing.xs,
                paddingTop: spacing.xs,
                // Extra room at the foot: this edge is where a phone's home
                // indicator and the browser's own chrome sit.
                paddingBottom: spacing.lg,
              }),
        }}
      >
        {/*
          Маршрут `/` остаётся экраном этого навигатора: `Tabs` знает только
          те экраны, у которых есть триггер в `TabList`, и без него переход на
          `/` (после входа, из ErrorBoundary) уходил бы в «не найдено».
          Триггер без кнопки — `index.tsx` сам перенаправит на «Словарь».
        */}
        <TabTrigger name="index" href="/" style={{ display: "none" }} />
        {TAB_ITEMS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabBarButton label={tab.label} icon={tab.icon} isWide={isWide} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}
