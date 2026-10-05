// Single source of truth for order totals. The server always recomputes with
// these; the client only uses them to preview what the server will charge.

export type ShippingMethodCode = "NORMAL" | "EXPRESS";

export const SHIPPING_COST: Record<ShippingMethodCode, number> = {
  NORMAL: 150_000,
  EXPRESS: 300_000,
};

export const VAT_RATE = 0.1;

export const MAX_QUANTITY_PER_ITEM = 99;

export function computeOrderTotals(
  lines: Array<{ unitPrice: number; quantity: number }>,
  shippingMethod: ShippingMethodCode
) {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  const shipping = itemCount > 0 ? SHIPPING_COST[shippingMethod] : 0;
  const vat = itemCount > 0 ? Math.round((subtotal + shipping) * VAT_RATE) : 0;

  return { itemCount, subtotal, shipping, vat, total: subtotal + shipping + vat };
}
