import { useCallback, useMemo, useState, type RefObject } from "react";
import { FlatList, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import type { ModuleProgress } from "@yuny/shared";
import { Button, EmptyState, ErrorState, IconButton, LoadingState, Sheet, Text } from "@/shared/ui";
import { useModules } from "@/shared/api";
import { sizing, spacing } from "@/shared/config/tokens";
import { t } from "@/shared/i18n";
import { ModuleCircle } from "@/features/home/ModuleCircle";

type Row = { type: "module"; module: ModuleProgress } | { type: "spacer"; id: string };

/** `home.sheet.progress` ("3 / 8") — same `Intl.NumberFormat("ru")` pattern as `features/upload/format.ts`. */
const NUMBER_FORMATTER = new Intl.NumberFormat("ru");

/**
 * Экран 01 — Главная (`home.design.md`). Modules render as circles with a
 * progress ring; a tap opens a `Sheet` with the number of tasks and a
 * primary action to `/module/[id]` (a phase-4 stub, §4).
 */
export default function HomeTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, refetch } = useModules();

  const [listWidth, setListWidth] = useState(0);
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  // Tracks which circle to return focus to. Set on open and, unlike
  // `openModuleId`, left alone on close: `onClose` clears `openModuleId` in
  // the same render `Sheet`'s own `visible`-false effect reads
  // `returnFocusRef` in, so deriving that ref straight from `openModuleId`
  // would already be `undefined` by the time the close transition runs.
  const [focusModuleId, setFocusModuleId] = useState<string | null>(null);

  // One ref per module, created lazily and kept for the component's
  // lifetime — `Sheet`'s `returnFocusRef` needs to point at the exact
  // circle that opened it, not just "a" circle (home.design.md §Composition,
  // `Sheet` new primitive). Backed by `useState`, not `useRef`: `refFor` reads
  // this map during render (both here and in `renderItem`), and
  // `react-hooks/refs` disallows reading a `useRef`'s `.current` there — a
  // plain mutable object held in state sidesteps that rule without needing
  // an effect just to hand out ref objects.
  const [circleRefs] = useState(() => new Map<string, RefObject<View | null>>());
  function refFor(moduleId: string): RefObject<View | null> {
    let ref = circleRefs.get(moduleId);
    if (!ref) {
      ref = { current: null };
      circleRefs.set(moduleId, ref);
    }
    return ref;
  }

  // Perezapros при фокусе вкладки (home.design.md §1, механизм 2) — covers
  // a module that finished parsing while this tab was backgrounded, or
  // progress that changed on another device. No loading UI on this path:
  // the previous data stays on screen while it runs.
  useFocusEffect(
    useCallback(() => {
      void refetch({ cancelRefetch: false });
      // eslint-disable-next-line react-hooks/exhaustive-deps -- `refetch` is stable per `useModules()` call; re-running on identity change would refetch every render.
    }, []),
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setListWidth(e.nativeEvent.layout.width);
  }, []);

  const numColumns = Math.max(3, Math.floor(listWidth / sizing.moduleCell) || 3);

  const rows: Row[] = useMemo(() => {
    const modules = data ?? [];
    const items: Row[] = modules.map((module) => ({ type: "module", module }));
    const remainder = items.length % numColumns;
    if (remainder !== 0) {
      const spacersNeeded = numColumns - remainder;
      for (let i = 0; i < spacersNeeded; i += 1) {
        items.push({ type: "spacer", id: `spacer-${i}` });
      }
    }
    return items;
  }, [data, numColumns]);

  const openModule = data?.find((m) => m.module_id === openModuleId) ?? null;

  function openSheet(moduleId: string) {
    setFocusModuleId(moduleId);
    setOpenModuleId(moduleId);
  }

  if (isPending) {
    return (
      <View className="flex-1 bg-background dark:bg-background-dark">
        <LoadingState className="flex-1" message={t("home.loading")} />
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View className="flex-1 bg-background dark:bg-background-dark">
        <ErrorState
          className="flex-1"
          title={t("home.error.title")}
          detail={t("home.error.detail")}
          onRetry={() => void refetch()}
          retryLabel={t("home.error.retry")}
        />
      </View>
    );
  }

  if ((data?.length ?? 0) === 0) {
    return (
      <View className="flex-1 bg-background dark:bg-background-dark">
        <EmptyState
          className="flex-1"
          message={t("home.empty.message")}
          actionLabel={t("home.empty.action")}
          onAction={() => router.navigate("/upload")}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background dark:bg-background-dark" style={{ paddingTop: insets.top }}>
      <FlatList
        key={numColumns}
        data={rows}
        numColumns={numColumns}
        onLayout={onLayout}
        keyExtractor={(row) => (row.type === "module" ? row.module.module_id : row.id)}
        contentContainerClassName="px-lg pt-xl pb-xl"
        columnWrapperClassName="gap-md"
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        ListHeaderComponent={
          <Text variant="title" accessibilityRole="header" className="mb-lg">
            {t("home.title")}
          </Text>
        }
        renderItem={({ item }) =>
          item.type === "spacer" ? (
            <View className="flex-1" accessible={false} />
          ) : (
            <View className="flex-1 items-center">
              <ModuleCircle
                ref={refFor(item.module.module_id)}
                module={item.module}
                onPress={openSheet}
              />
            </View>
          )
        }
      />

      <Sheet
        visible={openModule !== null}
        onClose={() => setOpenModuleId(null)}
        accessibilityLabel={openModule?.title ?? ""}
        returnFocusRef={focusModuleId ? refFor(focusModuleId) : undefined}
      >
        {openModule ? (
          <View className="gap-lg">
            <View className="flex-row items-start gap-md">
              <View className="flex-1 gap-xs">
                <Text variant="heading" accessibilityRole="header">
                  {openModule.title}
                </Text>
                {openModule.topic !== null ? (
                  <Text variant="caption" tone="muted">
                    {openModule.topic}
                  </Text>
                ) : null}
              </View>
              <IconButton
                icon="close"
                accessibilityLabel={t("home.sheet.close")}
                onPress={() => setOpenModuleId(null)}
              />
            </View>

            <View
              accessible
              accessibilityLabel={t("home.sheet.progressA11y", {
                done: openModule.done_tasks,
                count: openModule.total_tasks,
              })}
              className="items-start gap-xs"
            >
              <Text variant="display">
                {t("home.sheet.progress", {
                  done: NUMBER_FORMATTER.format(openModule.done_tasks),
                  total: NUMBER_FORMATTER.format(openModule.total_tasks),
                })}
              </Text>
              <Text variant="caption" tone="muted">
                {t("home.sheet.progressCaption")}
              </Text>
            </View>

            <Button
              label={t("home.sheet.open")}
              variant="primary"
              onPress={() => {
                const moduleId = openModule.module_id;
                setOpenModuleId(null);
                router.push({ pathname: "/module/[id]", params: { id: moduleId } });
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}
