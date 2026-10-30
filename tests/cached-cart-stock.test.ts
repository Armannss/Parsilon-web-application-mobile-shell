import { strict as assert } from "node:assert";
import { test } from "node:test";
import { resolveCartItems } from "../lib/cart-products";

test("cached stock respects unavailable labels and requested quantity", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  try {
    for (const [stock, quantity, expected] of [["ناموجود", 1, true], ["استعلام", 1, true], ["موجود", 1, false], [2, 3, true], [2, 2, false], [0, 1, true]] as const) {
      const product = { slug: "part", name: "Part", code: "A", stock, isAvailable: true };
      Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: () => JSON.stringify([product]) } } });
      assert.equal(resolveCartItems([{ slug: "part", quantity }])[0].isUnavailable, expected);
    }
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
