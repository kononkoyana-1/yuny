import { useState, type RefObject } from "react";
import type { View } from "react-native";

/**
 * Одна ссылка на строку списка по её ключу, созданная при первом обращении и
 * живущая, пока жив экран: `Sheet` возвращает фокус ровно в ту строку, что его
 * открыла. Карта держится в `useState`, а не в `useRef` — её читают во время
 * рендера, а `react-hooks/refs` запрещает читать там `.current` (тот же приём,
 * что на Главной).
 */
export function useRowRefs(): (key: string) => RefObject<View | null> {
  const [refs] = useState(() => new Map<string, RefObject<View | null>>());
  return (key) => {
    let ref = refs.get(key);
    if (!ref) {
      ref = { current: null };
      refs.set(key, ref);
    }
    return ref;
  };
}
