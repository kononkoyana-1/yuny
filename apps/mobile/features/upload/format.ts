import { t } from "@/shared/i18n";

/**
 * `Intl.NumberFormat("ru")`-formatted byte size (§3 of the design spec):
 * under 1 MB shows a whole number of KB, at or above 1 MB shows MB with one
 * decimal place. Used both for a single file's row and for the running
 * total, so the two never drift into different rounding.
 */
const KB_FORMATTER = new Intl.NumberFormat("ru", { maximumFractionDigits: 0 });
const MB_FORMATTER = new Intl.NumberFormat("ru", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return t("upload.size.kb", { value: KB_FORMATTER.format(bytes / 1024) });
  }
  return t("upload.size.mb", { value: MB_FORMATTER.format(bytes / (1024 * 1024)) });
}
