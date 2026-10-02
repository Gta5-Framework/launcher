import type { LanguageCode } from "./i18n";

const LOCALES: Record<LanguageCode, string> = { de: "de-DE", en: "en-US" };

export function formatBytes(bytes: number, language: LanguageCode): string {
  if (bytes <= 0) return `0 ${bytes === 0 ? "B" : "B"}`;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  const formatted = new Intl.NumberFormat(LOCALES[language], {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);
  return `${formatted} ${units[exponent]}`;
}

export function formatDate(ms: number, language: LanguageCode): string {
  return new Intl.DateTimeFormat(LOCALES[language], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ms));
}
