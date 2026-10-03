const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/** Parses a display price such as "۱۳٬۱۵۰٬۰۰۰ ریال" back to a number. */
export function parsePrice(price?: string | number | null) {
  if (typeof price === "number") return Number.isFinite(price) ? price : 0;
  if (!price || price.includes("تماس")) return 0;

  return Number(toEnglishDigits(price).replace(/[^\d]/g, "") || 0);
}

export function formatNumber(value: number) {
  return value.toLocaleString("fa-IR");
}

export function formatRial(value: number) {
  return `${formatNumber(value)} ریال`;
}
