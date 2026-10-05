import { toEnglishDigits } from "@/lib/format";

/**
 * Normalizes an Iranian mobile number to the canonical `09xxxxxxxxx` form.
 * Accepts `0912…`, `912…`, `+98912…`, `0098912…` and Persian/Arabic digits.
 * Returns null when the input is not a valid mobile number.
 */
export function normalizeIranMobile(input: string): string | null {
  const digits = toEnglishDigits(input).replace(/[^\d+]/g, "");

  const match = digits.match(/^(?:\+98|0098|98|0)?(9\d{9})$/);
  if (!match) return null;

  return `0${match[1]}`;
}
