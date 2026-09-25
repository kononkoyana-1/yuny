import type { ReactNode } from "react";

export interface StrokeOrderProps {
  /** Слово или знак; анимируются только иероглифы. */
  text: string;
  /** Что поставить в строку перед кнопкой — например, «Послушать». */
  leading?: ReactNode;
  /** По центру — в знакомстве со словом; по умолчанию по левому краю. */
  centered?: boolean;
}

/** Порядок черт (#86): пока только на web — на телефоне только `leading`. */
export function StrokeOrder({ leading }: StrokeOrderProps) {
  return leading ?? null;
}
