import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import HanziWriter from "hanzi-writer";
import { useTheme } from "@/shared/lib/useTheme";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import { t } from "@/shared/i18n";
import { FOCUS_RING_CLASS } from "./focusRing";
import { Icon } from "./Icon";
import { Text } from "./Text";
import type { StrokeOrderProps } from "./StrokeOrder";

export type { StrokeOrderProps } from "./StrokeOrder";

const HAN = /\p{Script=Han}/u;
/** Сторона клетки знака, px: крупно, чтобы черты было видно. */
const CELL = 96;

/**
 * Порядок черт (#86): по нажатию «Порядок черт» знаки слова прорисовываются
 * по очереди (Hanzi Writer; данные черт — Make Me a Hanzi, грузятся с CDN по
 * знаку). «Ещё раз» — заново. При reduced motion знаки показываются сразу,
 * без анимации.
 */
export function StrokeOrder({ text, leading, centered = false }: StrokeOrderProps) {
  const chars = [...text].filter((c) => HAN.test(c));
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState(0);
  const [failed, setFailed] = useState(false);
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const cells = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const writers = chars.map((char, i) => {
      const el = cells.current[i];
      if (!el) return null;
      el.innerHTML = "";
      return HanziWriter.create(el, char, {
        width: CELL,
        height: CELL,
        padding: 6,
        showOutline: true,
        showCharacter: reducedMotion,
        strokeColor: colors.text,
        radicalColor: colors.primary,
        outlineColor: colors.border,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 180,
        onLoadCharDataError: () => {
          if (!cancelled) setFailed(true);
        },
      });
    });
    if (!reducedMotion) {
      // Знаки по очереди, как пишут.
      void (async () => {
        for (const w of writers) {
          if (cancelled || !w) return;
          await w.animateCharacter().catch(() => undefined);
        }
      })();
    }
    return () => {
      cancelled = true;
    };
    // `chars` — производное от `text`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, run, text, reducedMotion, colors.text, colors.primary, colors.border]);

  if (chars.length === 0) return leading ?? null;

  return (
    <View className={`gap-sm ${centered ? "items-center" : ""}`}>
      <View className={`flex-row flex-wrap items-center gap-md ${centered ? "justify-center" : ""}`}>
        {leading}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? t("strokes.hide") : t("strokes.a11y", { text: chars.join("") })}
          accessibilityState={{ expanded: open }}
          onPress={() => {
            setFailed(false);
            setOpen((v) => !v);
          }}
          className={`min-h-tap flex-row items-center gap-xs self-start rounded-sm ${FOCUS_RING_CLASS}`}
        >
          <Icon name="edit" size={16} color={colors.primary} />
          <Text variant="body" tone="brand" className="font-semibold">
            {open ? t("strokes.hide") : t("strokes.show")}
          </Text>
        </Pressable>
        {open && !reducedMotion ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFailed(false);
              setRun((n) => n + 1);
            }}
            className={`min-h-tap justify-center rounded-sm ${FOCUS_RING_CLASS}`}
          >
            <Text variant="body" tone="brand">
              {t("strokes.replay")}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <View aria-hidden className={`flex-row flex-wrap gap-sm ${centered ? "justify-center" : ""}`}>
          {chars.map((char, i) => (
            <View
              key={`${char}-${i}`}
              ref={(node) => {
                cells.current[i] = node as unknown as HTMLElement | null;
              }}
              style={{ width: CELL, height: CELL }}
              className="rounded-tile border border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
            />
          ))}
        </View>
      ) : null}
      {failed ? (
        <Text variant="caption" tone="muted">
          {t("strokes.error")}
        </Text>
      ) : null}
    </View>
  );
}
